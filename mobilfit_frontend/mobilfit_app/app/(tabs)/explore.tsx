import React, { useState, useRef } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Animated, Dimensions, GestureResponderEvent, Image, Alert, Platform, TextInput, Keyboard, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { apiPost, apiGet } from "../../lib/api";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const { width: screenWidth } = Dimensions.get('window');

const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>MobilFit 자전거 경로 지도</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  <script src="https://unpkg.com/@here/harp-flexible-polyline/dist/flexiblepolyline.min.js"></script>
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .leaflet-container {
      background: #f8f9fa;
    }
    .leaflet-control-zoom {
      display: none !important;
    }
    .leaflet-control-attribution {
      background: rgba(255,255,255,0.8) !important;
      backdrop-filter: blur(10px) !important;
      border-radius: 4px !important;
      margin: 10px !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map').setView([37.5665, 126.9780], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap | MobilFit'
    }).addTo(map);

    let startMarker = null;
    let endMarker = null;
    let userLocationMarker = null;
    let polylineGroup = L.layerGroup().addTo(map);
    let crossingGroup = L.layerGroup().addTo(map);
    let isSearchingRoute = false;
    let isRouteFixed = false;
    let chunkedCoords = [];
    let chunkedWaytypes = [];

    const userLocationIcon = L.divIcon({
      className: 'user-location-marker',
      html: '<div style="width:16px;height:16px;background:#FF4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const startIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNSA0MSc+PHBhdGggZmlsbD0nIzRDQUY1MCcgc3Ryb2tlPScjZmZmZmZmJyBzdHJva2Utd2lkdGg9JzInIGQ9J00xMi41LDBDNS41OTYsMCwwLDUuNTk2LDAsMTIuNWMwLDEyLjUsMTIuNSwyOC41LDEyLjUsMjguNXMxMi41LTE2LDEyLjUtMjguNUMyNSw1LjU5NiwxOS40MDQsMCwxMi41LDB6Jy8+PGNpcmNsZSBmaWxsPScjZmZmZmZmJyBjeD0nMTIuNScgY3k9JzEyLjUnIHI9JzYnLz48L3N2Zz4=',
      iconSize: [20, 33],
      iconAnchor: [10, 33],
      popupAnchor: [1, -28],
    });

    const endIcon = L.icon({
      iconUrl:
        'data:image/svg+xml;base64,' +
        'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNSA0MSI+PHBhdGggZmlsbD0iI0ZGQTcyNiIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiIGQ9Ik0xMi41LDBDNS41OTYsMCwwLDUuNTk2LDAsMTIuNWMwLDEyLjUsMTIuNSwyOC41LDEyLjUsMjguNXMxMi41LTE2LDEyLjUtMjguNUMyNSw1LjU5NiwxOS40MDQsMCwxMi41LDB6Ii8+PGNpcmNsZSBmaWxsPSIjZmZmZmZmIiBjeD0iMTIuNSIgY3k9IjEyLjUiIHI9IjYiLz48L3N2Zz4=',
      iconSize: [20, 33],
      iconAnchor: [10, 33],
      popupAnchor: [1, -28],
    });


    function handleMessage(event) {
      try {
        let data = event.data;
        if (typeof data === "string") data = JSON.parse(data);

        if (data.type === "setStartMarker") {
          if (startMarker) {
            map.removeLayer(startMarker);
          }
          startMarker = L.marker([data.lat, data.lng], { icon: startIcon }).addTo(map);
          if (data.name) {
            startMarker.bindPopup(data.name);
          }
        } else if (data.type === "setEndMarker") {
          if (endMarker) {
            map.removeLayer(endMarker);
          }
          endMarker = L.marker([data.lat, data.lng], { icon: endIcon }).addTo(map);
          if (data.name) {
            endMarker.bindPopup(data.name);
          }
        } else if (data.type === "removeStartMarker") {
          if (startMarker) {
            map.removeLayer(startMarker);
            startMarker = null;
          }
        } else if (data.type === "removeEndMarker") {
          if (endMarker) {
            map.removeLayer(endMarker);
            endMarker = null;
          }
        } else if (data.type === "getMapCenter") {
          const center = map.getCenter();
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: "mapCenter", 
            lat: center.lat, 
            lng: center.lng 
          }));
        } else if (data.type === "drawRoute") {
          chunkedCoords = [];
          chunkedWaytypes = [];
          polylineGroup.clearLayers();
          const coordinates = data.coordinates, waytypes = data.waytypes;
          for (let i = 0; i < coordinates.length - 1; i++) {
            const [lng1, lat1] = coordinates[i], [lng2, lat2] = coordinates[i+1];
            const color = waytypes[i] === 6 ? "#4CAF50" : "#2196F3";
            const weight = waytypes[i] === 6 ? 6 : 4;
            polylineGroup.addLayer(L.polyline([[lat1, lng1], [lat2, lng2]], { color, weight, opacity: 0.8 }));
          }
          map.fitBounds(L.latLngBounds(coordinates.map(([lng, lat]) => [lat, lng])));
          isRouteFixed = true;
        } else if (data.type === "drawRouteChunk") {
          chunkedCoords.push(...(data.coordinates || []).map(([lng, lat]) => [lat, lng]));
          chunkedWaytypes.push(...(data.waytypes || []));
        } else if (data.type === "drawRouteComplete") {
          polylineGroup.clearLayers();
          for (let i = 0; i < chunkedCoords.length - 1; i++) {
            const [lat1, lng1] = chunkedCoords[i], [lat2, lng2] = chunkedCoords[i+1];
            const color = chunkedWaytypes[i] === 6 ? "#4CAF50" : "#2196F3";
            const weight = chunkedWaytypes[i] === 6 ? 6 : 4;
            polylineGroup.addLayer(L.polyline([[lat1, lng1], [lat2, lng2]], { color, weight, opacity: 0.8 }));
          }
          if (chunkedCoords.length) map.fitBounds(L.latLngBounds(chunkedCoords));
          isRouteFixed = true;
          chunkedCoords = [];
          chunkedWaytypes = [];
        } else if (data.type === "drawCrossings") {
          crossingGroup.clearLayers();
          data.crossings.forEach(({ lat, lng }) => {
            const icon = L.divIcon({
              className: 'traffic-light-marker',
              html: [
                '<div style="background:linear-gradient(135deg,#2c3e50 0%,#34495e 100%);',
                'color:white;width:12px;height:20px;border-radius:2px;',
                'display:flex;flex-direction:column;align-items:center;justify-content:space-around;',
                'border:1px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);padding:1px;">',
                '<div style="width:5px;height:5px;background:#e74c3c;border-radius:50%;"></div>',
                '<div style="width:5px;height:5px;background:#f39c12;border-radius:50%;"></div>',
                '<div style="width:5px;height:5px;background:#27ae60;border-radius:50%;"></div>',
                '</div>'
              ].join(""),
              iconSize: [14, 22],
              iconAnchor: [7, 22]
            });
            L.marker([lat, lng], { icon }).addTo(crossingGroup);
          });
        } else if (data.type === "clearRoute") {
          polylineGroup.clearLayers();
          crossingGroup.clearLayers();
          if (startMarker) { map.removeLayer(startMarker); startMarker = null; }
          if (endMarker) { map.removeLayer(endMarker); endMarker = null; }
          isRouteFixed = false;
          isSearchingRoute = false;
          chunkedCoords = [];
          chunkedWaytypes = [];
        } else if (data.type === "setSearching") {
          isSearchingRoute = data.value;
        } else if (data.type === "moveToLocation") {
          map.setView([data.lat, data.lng], data.zoom || 16);
          if (userLocationMarker) {
            userLocationMarker.setLatLng([data.lat, data.lng]);
          } else {
            userLocationMarker = L.marker([data.lat, data.lng], { icon: userLocationIcon }).addTo(map);
          }
        }
      } catch (e) {
        Alert.alert("오류", "문제가 발생했습니다.");
      }
    }

    document.addEventListener("message", handleMessage);
    window.addEventListener("message", handleMessage);

    map.on("click", function(e) {
      const lat = e.latlng.lat, lng = e.latlng.lng;
      window.ReactNativeWebView.postMessage(JSON.stringify({ 
        type: "mapClick", 
        lat, 
        lng 
      }));
    });

    map.on("moveend", function() {
      const center = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({ 
        type: "mapCenter", 
        lat: center.lat, 
        lng: center.lng 
      }));
    });
  </script>
</body>
</html>
`;


const getBrandLogo = (brandName: string) => {
  switch(brandName) {
    case "카카오":
      return require("../../assets/images/kakao.jpg");
    case "쏘카":
      return require("../../assets/images/socar.png");
    case "지쿠(시간제)":
    case "지쿠(거리제)":
    case "지쿠":
      return require("../../assets/images/jiku.jpg");
    case "티맵":
      return require("../../assets/images/tmap.jpg");
    default:
      return null;
  }
};

interface SearchResult {
  type: "address" | "place";
  name: string;
  address: string;
  x: string;
  y: string;
}

const Explore: React.FC = () => {
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [preference, setPreference] = useState<"easiest" | "shortest" | "recommended">("recommended");
  const [hasRoute, setHasRoute] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [fareList, setFareList] = useState<any[]>([]);
  const [isRouteFixed, setIsRouteFixed] = useState(false);
  const [allRouteData, setAllRouteData] = useState<{[key: string]: any}>({});
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [routeStartTime, setRouteStartTime] = useState<Date | null>(null);
  const [isRideInProgress, setIsRideInProgress] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 37.497942, lng: 127.027621 });
  const [currentSearchPage, setCurrentSearchPage] = useState(0);
  const [searchError, setSearchError] = useState<string>("");
  
  const [isSelectingStart, setIsSelectingStart] = useState(false);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);
  
  const [startPointName, setStartPointName] = useState<string>("");
  const [endPointName, setEndPointName] = useState<string>("");
  
  const [showTopBars, setShowTopBars] = useState(true);
  
  const [routeError, setRouteError] = useState<string>("");
  
  const [hasNoSearchResults, setHasNoSearchResults] = useState(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const BOTTOM_SHEET_HEIGHTS = {
    INITIAL: 80,
    LOADING: 150,
    SEARCH_MIN: 80,
    SEARCH_MAX: 400,
    ROUTE_MIN: 80,
    ROUTE_MAX: 400,
  };
  const webViewRef = useRef<any>(null);
  const bottomSheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHTS.INITIAL)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const searchTranslateX = useRef(new Animated.Value(0)).current;
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);

  React.useEffect(() => {
    if (isLoading) {
      spinValue.setValue(0);
      scaleValue.setValue(1);
      
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      );
      
      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );
      
      spinAnimation.start();
      scaleAnimation.start();
      
      return () => {
        spinAnimation.stop();
        scaleAnimation.stop();
      };
    }
  }, [isLoading, spinValue, scaleValue]);

  const [routeTypes, setRouteTypes] = useState<{ key: string; label: string }[]>([]);

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setHasNoSearchResults(false);
      return;
    }

    Keyboard.dismiss();

    setIsSearching(true);
    setHasNoSearchResults(false);
    setSearchError("");
    
    try {
      webViewRef.current?.postMessage(JSON.stringify({ type: "getMapCenter" }));
      
      setTimeout(async () => {
        try {
          const accessToken = await SecureStore.getItemAsync("accessToken");
          
          if (!accessToken) {
            setSearchError("로그인이 필요합니다.");
            setSearchResults([]);
            setShowSearchResults(true);
            setHasNoSearchResults(true);
            
            Animated.spring(bottomSheetHeight, {
              toValue: BOTTOM_SHEET_HEIGHTS.SEARCH_MAX,
              useNativeDriver: false,
            }).start();
            setIsMinimized(false);
            return;
          }
          
          const apiUrl = `/api/v1/ors/search/?query=${encodeURIComponent(query)}&x=${mapCenter.lng}&y=${mapCenter.lat}`;
          const response = await apiGet(apiUrl, accessToken);
          
          if (response.success && response.data && response.data.results) {
            const results = response.data.results.slice(0, 8);
            
            if (results.length === 0) {
              setSearchResults([]);
              setShowSearchResults(true);
              setHasNoSearchResults(true);
              setCurrentSearchPage(0);
              
              Animated.spring(bottomSheetHeight, {
                toValue: BOTTOM_SHEET_HEIGHTS.SEARCH_MAX,
                useNativeDriver: false,
              }).start();
              setIsMinimized(false);
            } else {
              setSearchResults(results);
              setShowSearchResults(true);
              setHasNoSearchResults(false);
              setCurrentSearchPage(0);
              
              Animated.spring(bottomSheetHeight, {
                toValue: BOTTOM_SHEET_HEIGHTS.SEARCH_MAX,
                useNativeDriver: false,
              }).start();
              setIsMinimized(false);
            }
          } else {
            setSearchResults([]);
            setShowSearchResults(true);
            setHasNoSearchResults(true);
            setSearchError("검색 중 오류가 발생했습니다.");
            
            Animated.spring(bottomSheetHeight, {
              toValue: BOTTOM_SHEET_HEIGHTS.SEARCH_MAX,
              useNativeDriver: false,
            }).start();
            setIsMinimized(false);
          }
        } catch (error) {
          setSearchResults([]);
          setShowSearchResults(true);
          setHasNoSearchResults(true);
          setSearchError("네트워크 오류가 발생했습니다.");
          
          Animated.spring(bottomSheetHeight, {
            toValue: BOTTOM_SHEET_HEIGHTS.SEARCH_MAX,
            useNativeDriver: false,
          }).start();
          setIsMinimized(false);
        }
      }, 100);
    } catch (error) {
      setSearchResults([]);
      setShowSearchResults(true);
      setHasNoSearchResults(true);
      setSearchError("예상치 못한 오류가 발생했습니다.");
      
      Animated.spring(bottomSheetHeight, {
        toValue: BOTTOM_SHEET_HEIGHTS.SEARCH_MAX,
        useNativeDriver: false,
      }).start();
      setIsMinimized(false);
    } finally {
      setIsSearching(false);
    }
  };

  const startMapSelection = (type: 'start' | 'end') => {
    if (type === 'start') {
      if (isSelectingStart) {
        setIsSelectingStart(false);
      } else {
        setIsSelectingStart(true);
        setIsSelectingEnd(false);
      }
    } else {
      if (isSelectingEnd) {
        setIsSelectingEnd(false);
      } else {
        setIsSelectingEnd(true);
        setIsSelectingStart(false);
      }
    }
    setIsRouteFixed(false);
  };

  const completeMapSelection = () => {
    setIsSelectingStart(false);
    setIsSelectingEnd(false);
  };
  const setPointFromSearch = (result: SearchResult, type: 'start' | 'end') => {
    const point = {
      lat: parseFloat(result.y),
      lng: parseFloat(result.x)
    };

    if (type === 'start') {
      setStartPoint(point);
      setStartPointName(result.name);
      webViewRef.current?.postMessage(JSON.stringify({
        type: "setStartMarker",
        lat: point.lat,
        lng: point.lng,
        name: result.name
      }));
    } else {
      setEndPoint(point);
      setEndPointName(result.name);
      webViewRef.current?.postMessage(JSON.stringify({
        type: "setEndMarker",
        lat: point.lat,
        lng: point.lng,
        name: result.name
      }));
    }

    const newStartPoint = type === 'start' ? point : startPoint;
    const newEndPoint = type === 'end' ? point : endPoint;
    
    if (newStartPoint && newEndPoint) {
      setShowSearchResults(false);
      setHasNoSearchResults(false);
      Animated.spring(bottomSheetHeight, {
        toValue: BOTTOM_SHEET_HEIGHTS.LOADING,
        useNativeDriver: false,
      }).start(() => {
        drawAllRoutes(newStartPoint, newEndPoint);
      });
    } else {
      Animated.spring(bottomSheetHeight, {
        toValue: BOTTOM_SHEET_HEIGHTS.SEARCH_MIN,
        useNativeDriver: false,
      }).start();
      setIsMinimized(true);
    }
  };

  const handleSearchPageChange = (direction: 'left' | 'right') => {
    const totalPages = Math.ceil(searchResults.length / 4);
    let newPage = currentSearchPage;
    
    if (direction === 'left' && currentSearchPage > 0) {
      newPage = currentSearchPage - 1;
    } else if (direction === 'right' && currentSearchPage < totalPages - 1) {
      newPage = currentSearchPage + 1;
    }
    
    if (newPage !== currentSearchPage) {
      const slideDirection = direction === 'right' ? -1 : 1;
      
      Animated.timing(searchTranslateX, {
        toValue: slideDirection * screenWidth,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSearchPage(newPage);
        searchTranslateX.setValue(-slideDirection * screenWidth);
        Animated.timing(searchTranslateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleTouchStart = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    setTouchStart({ x: pageX, y: pageY });
  };

  const handleTouchMove = (event: GestureResponderEvent) => {
    if (!touchStart) return;

    const { pageX, pageY } = event.nativeEvent;
    const deltaX = pageX - touchStart.x;
    const deltaY = pageY - touchStart.y;

    if (showSearchResults && !hasNoSearchResults) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const maxTranslate = screenWidth * 0.3;
        const clampedDeltaX = Math.max(-maxTranslate, Math.min(maxTranslate, deltaX));
        searchTranslateX.setValue(clampedDeltaX);
      }
    }
    else if (hasRoute) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const maxTranslate = screenWidth * 0.3;
        const clampedDeltaX = Math.max(-maxTranslate, Math.min(maxTranslate, deltaX));
        contentTranslateX.setValue(clampedDeltaX);
      }
    }
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    if (!touchStart) return;

    const { pageX, pageY } = event.nativeEvent;
    const deltaX = pageX - touchStart.x;
    const deltaY = pageY - touchStart.y;

    const horizontalThreshold = 60;
    const verticalThreshold = 30;

    if (showSearchResults) {
      if (!hasNoSearchResults && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > horizontalThreshold) {
        if (deltaX > 0) {
          handleSearchPageChange('left');
        } else {
          handleSearchPageChange('right');
        }
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > verticalThreshold) {
        if (deltaY > 0) {
          setIsMinimized(true);
          Animated.spring(bottomSheetHeight, {
            toValue: 80,
            useNativeDriver: false,
          }).start();
        } else {
          setIsMinimized(false);
          Animated.spring(bottomSheetHeight, {
            toValue: 400,
            useNativeDriver: false,
          }).start();
        }
      }
      
      if (!hasNoSearchResults) {
        Animated.spring(searchTranslateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
    else if (hasRoute) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > horizontalThreshold) {
        if (deltaX > 0) {
          const newIndex = Math.max(0, currentRouteIndex - 1);
          changeRoute(newIndex);
        } else {
          const newIndex = Math.min(routeTypes.length - 1, currentRouteIndex + 1);
          changeRoute(newIndex);
        }
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > verticalThreshold) {
        if (deltaY > 0) {
          setIsMinimized(true);
          Animated.spring(bottomSheetHeight, {
            toValue: BOTTOM_SHEET_HEIGHTS.ROUTE_MIN,
            useNativeDriver: false,
          }).start();
        } else {
          setIsMinimized(false);
          Animated.spring(bottomSheetHeight, {
            toValue: BOTTOM_SHEET_HEIGHTS.ROUTE_MAX,
            useNativeDriver: false,
          }).start();
        }
      }

      Animated.spring(contentTranslateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }

    setTouchStart(null);
  };

  const changeRoute = (newIndex: number) => {
    if (newIndex !== currentRouteIndex && allRouteData && newIndex >= 0 && newIndex < routeTypes.length) {
      const direction = newIndex > currentRouteIndex ? -1 : 1;
      
      Animated.timing(contentTranslateX, {
        toValue: direction * screenWidth,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentRouteIndex(newIndex);
        const routeKey = routeTypes[newIndex].key;
        
        if (allRouteData[routeKey]) {
          displayRoute(allRouteData[routeKey]);
          setPreference(routeKey as "easiest" | "shortest" | "recommended");
        }
        
        contentTranslateX.setValue(-direction * screenWidth);
        Animated.timing(contentTranslateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const drawAllRoutes = async (start: any, end: any) => {
    setShowTopBars(false);
    webViewRef.current?.postMessage(JSON.stringify({ type: "setSearching", value: true }));
    setIsLoading(true);
    setRouteError("");
    setRouteStartTime(new Date());

    try {

      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }
      const response = await apiPost("/api/v1/ors/route/", {
        start: { lat: start.lat, lng: start.lng },
        end: { lat: end.lat, lng: end.lng }
      });

      if (!response.success || !response.data) {
        throw new Error("경로 탐색 API 응답 오류");
      }

      const { recommended, easiest, shortest } = response.data;
      
      if (!recommended && !easiest && !shortest) {
        throw new Error("경로를 찾을 수 없습니다");
      }

      const allData: { [key: string]: any } = {};

      const processRouteData = (routeData: any, routeType: string) => {
        if (!routeData) return;

        allData[routeType] = {
          coordinates: routeData.coordinates,
          waytypes: routeData.waytypes,
          crossings: routeData.crossings,
          info: routeData.info,
          fareList: routeData.fareList
        };
      };

      processRouteData(recommended, 'recommended');
      processRouteData(easiest, 'easiest');
      processRouteData(shortest, 'shortest');

      if (Object.keys(allData).length === 0) {
        throw new Error("유효한 경로를 찾을 수 없습니다");
      }

      const routeTypeLabels = {
        recommended: "추천 경로",
        easiest: "편한길 우선", 
        shortest: "최단 거리"
      };

      const newRouteTypes = Object.keys(allData).map(key => ({
        key,
        label: routeTypeLabels[key as keyof typeof routeTypeLabels] || key
      }));

      setAllRouteData(allData);
      setCurrentRouteIndex(0);
      setPreference(newRouteTypes[0].key as "easiest" | "shortest" | "recommended");
      displayRoute(allData[newRouteTypes[0].key]);

      setRouteTypes(newRouteTypes);

      setHasRoute(true);
      setIsRouteFixed(true);
      Animated.spring(bottomSheetHeight, {
        toValue: BOTTOM_SHEET_HEIGHTS.ROUTE_MIN, 
        useNativeDriver: false,
      }).start();
      setIsMinimized(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.includes("<")
            ? "서버 요청시간이 초과했습니다."
            : error.message
          : "경로 탐색 중 오류가 발생했습니다";
      setRouteError(message);
      setHasRoute(false);
      setIsRouteFixed(false);
      setRouteInfo(null);
      setFareList([]);
      
      Animated.spring(bottomSheetHeight, {
        toValue: BOTTOM_SHEET_HEIGHTS.SEARCH_MAX,
        useNativeDriver: false,
      }).start();
      setIsMinimized(false);
    } finally {
      webViewRef.current?.postMessage(JSON.stringify({ type: "setSearching", value: false }));
      setIsLoading(false);
    }
  };

  const displayRoute = async (routeData: any) => {
    const { coordinates, waytypes, crossings } = routeData;

    if (Platform.OS === "ios") {
      const chunkSize = 100;
      for (let i = 0; i < coordinates.length; i += chunkSize) {
        const chunkCoords = coordinates.slice(i, i + chunkSize);
        const chunkWaytypes = waytypes.slice(i, i + chunkSize);

        await new Promise((res) => setTimeout(res, 30));

        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "drawRouteChunk",
            coordinates: chunkCoords,
            waytypes: chunkWaytypes,
          })
        );
      }

      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "drawRouteComplete",
        })
      );
    } else {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "drawRoute",
          coordinates,
          waytypes,
        })
      );
    }

    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "drawCrossings",
        crossings,
      })
    );

    setRouteInfo(routeData.info);
    setFareList(routeData.fareList);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === "mapCenter") {
        setMapCenter({ lat: data.lat, lng: data.lng });
        return;
      }
      
      if (data.type === "mapClick") {
        const clickedPoint = { lat: data.lat, lng: data.lng };
        
        if (isSelectingStart) {
          setStartPoint(clickedPoint);
          setStartPointName("지도에서 선택한 출발지");
          setIsSelectingStart(false);
          
          webViewRef.current?.postMessage(JSON.stringify({
            type: "setStartMarker",
            lat: clickedPoint.lat,
            lng: clickedPoint.lng,
            name: "지도에서 선택한 출발지"
          }));
          
        } else if (isSelectingEnd) {
          setEndPoint(clickedPoint);
          setEndPointName("지도에서 선택한 도착지");
          setIsSelectingEnd(false);
          
          webViewRef.current?.postMessage(JSON.stringify({
            type: "setEndMarker",
            lat: clickedPoint.lat,
            lng: clickedPoint.lng,
            name: "지도에서 선택한 도착지"
          }));
        }
        
        const newStartPoint = isSelectingStart ? clickedPoint : startPoint;
        const newEndPoint = isSelectingEnd ? clickedPoint : endPoint;
        
        if (newStartPoint && newEndPoint) {
          setShowSearchResults(false);
          setHasNoSearchResults(false);
          Animated.spring(bottomSheetHeight, {
            toValue: BOTTOM_SHEET_HEIGHTS.LOADING,
            useNativeDriver: false,
          }).start(() => {
            drawAllRoutes(newStartPoint, newEndPoint);
          });
        }
        return;
      }
    } catch (err) {
      Alert.alert("오류", "문제가 발생했습니다.");
    }
  };

  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '위치 권한이 필요합니다.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setUserLocation({ lat: latitude, lng: longitude });

      webViewRef.current?.postMessage(JSON.stringify({
        type: 'moveToLocation',
        lat: latitude,
        lng: longitude,
        zoom: 16
      }));
    } catch (error) {
      Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
    } finally {
      setIsLocating(false);
    }
  };

  const resetRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setStartPointName("");
    setEndPointName("");
    setHasRoute(false);
    setIsRouteFixed(false);
    setRouteInfo(null);
    setFareList([]);
    setAllRouteData({});
    setCurrentRouteIndex(0);
    setIsMinimized(true);
    setIsLoading(false);
    setShowSearchResults(false);
    setHasNoSearchResults(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    setRouteError("");
    setIsSelectingStart(false);
    setIsSelectingEnd(false);
    setShowTopBars(true);
    setSelectedProvider(null);
    setRouteStartTime(null);
    setIsRideInProgress(false);
    setHasArrived(false);
    
    webViewRef.current?.postMessage(JSON.stringify({ type: "clearRoute" }));
    
    Animated.spring(bottomSheetHeight, {
      toValue: BOTTOM_SHEET_HEIGHTS.INITIAL,
      useNativeDriver: false,
    }).start();
  };

  const toggleMinimize = () => {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);
    
    let targetHeight;
    if (showSearchResults) {
      targetHeight = newMinimizedState ? BOTTOM_SHEET_HEIGHTS.SEARCH_MIN : BOTTOM_SHEET_HEIGHTS.SEARCH_MAX;
    } else if (hasRoute) {
      targetHeight = newMinimizedState ? BOTTOM_SHEET_HEIGHTS.ROUTE_MIN : BOTTOM_SHEET_HEIGHTS.ROUTE_MAX;
    } else {
      targetHeight = BOTTOM_SHEET_HEIGHTS.INITIAL;
    }
    
    Animated.spring(bottomSheetHeight, {
      toValue: targetHeight,
      useNativeDriver: false,
    }).start();
  };

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}분 ${secs}초`;
  };

  const getCurrentPageResults = () => {
    const startIndex = currentSearchPage * 4;
    return searchResults.slice(startIndex, startIndex + 4);
  };

  const selectProvider = (providerName: string) => {
    setSelectedProvider(providerName);
    setIsRideInProgress(true);
  };

  const handleArrival = async () => {
    if (!selectedProvider || !routeStartTime || !routeInfo) {
      return;
    }
    setHasArrived(true);
    const endTime = new Date();
    const actualDurationMinutes = (endTime.getTime() - routeStartTime.getTime()) / (1000 * 60);
    const expectedDurationMinutes = routeInfo.adjustedTimeMin;
    const timeDifferenceMinutes = Math.abs(actualDurationMinutes - expectedDurationMinutes);

    let scoreChange = 0;
    let message = "";
    
    if (timeDifferenceMinutes <= 3) {
      scoreChange = 1;
      message = "훌륭합니다! 예상 시간에 정확히 도착했어요!";
    } else if (timeDifferenceMinutes <= 7) {
      scoreChange = 0;
      message = "괜찮네요! 조금 더 정확하게 도착해보세요!";
    } else {
      scoreChange = -1;
      message = "다음엔 더 정확한 시간에 도착해보세요!";
    }

    const maxFare = Math.max(...fareList.map(f => f.fare));
    const selectedFare = fareList.find(f => f.name === selectedProvider)?.fare || 0;
    const savedMoney = maxFare - selectedFare;

    try {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (!accessToken) {
        return;
      }

      await apiPost("/api/v1/auth/rides/", {
        distance_km: routeInfo.distance / 1000,
        duration_seconds: actualDurationMinutes * 60,
        started_at: routeStartTime.toISOString(),
        ended_at: endTime.toISOString(),
        provider: selectedProvider,
        saved_money: savedMoney
      }, accessToken);

      await apiPost("/api/v1/auth/me/update-data/", {
        saved_money: savedMoney,
        distance_km: routeInfo.distance / 1000,
        score_delta: scoreChange
      }, accessToken);
    } catch (error) {
      Alert.alert("오류", "문제가 발생했습니다.");
    }
  };
  const getDynamicSavings = () => {
    if (!selectedProvider || fareList.length === 0) {
      const maxFare = Math.max(...fareList.map(f => f.fare));
      const minFare = Math.min(...fareList.map(f => f.fare));
      return maxFare - minFare;
    }
    
    const maxFare = Math.max(...fareList.map(f => f.fare));
    const selectedFare = fareList.find(f => f.name === selectedProvider)?.fare || 0;
    return maxFare - selectedFare;
  };

  return (
    <View style={styles.container}>
      {showTopBars && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="장소나 주소를 검색하세요"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => searchPlaces(searchQuery)}
              returnKeyType="search"
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => searchPlaces(searchQuery)}
              disabled={isSearching}
            >
              <Text style={styles.searchButtonText}>
                {isSearching ? "..." : "검색"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showTopBars && (
        <View style={styles.pointSelectionContainer}>
          <View style={styles.pointSelectionBar}>
            <View style={styles.pointRow}>
              <Text style={styles.pointLabel}>출발지</Text>
              <Text style={styles.pointText}>
                {startPoint ? startPointName || "위치 설정됨" : "설정되지 않음"}
              </Text>
              <TouchableOpacity 
                style={[
                  styles.mapSelectButton1, 
                  isSelectingStart && styles.mapSelectButtonActive
                ]}
                onPress={() => startMapSelection('start')}
              >
                <Text style={[
                  styles.mapSelectButtonText,
                  isSelectingStart && styles.mapSelectButtonTextActive
                ]}>
                  {isSelectingStart ? "선택 취소" : "지도선택"}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pointDivider} />
            
            <View style={styles.pointRow}>
              <Text style={styles.pointLabel}>도착지</Text>
              <Text style={styles.pointText}>
                {endPoint ? endPointName || "위치 설정됨" : "설정되지 않음"}
              </Text>
              <TouchableOpacity 
                style={[
                  styles.mapSelectButton2, 
                  isSelectingEnd && styles.mapSelectButtonActive
                ]}
                onPress={() => startMapSelection('end')}
              >
                <Text style={[
                  styles.mapSelectButtonText,
                  isSelectingEnd && styles.mapSelectButtonTextActive
                ]}>
                  {isSelectingEnd ? "선택 취소" : "지도선택"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: LEAFLET_HTML }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        mixedContentMode="always"
      />

      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={getCurrentLocation}
        disabled={isLocating}
      >
        {isLocating ? (
          <ActivityIndicator size="small" color="#4CAF50" />
        ) : (
          <View style={styles.myLocationIcon}>
            <View style={styles.myLocationIconOuter} />
            <View style={styles.myLocationIconInner} />
            <View style={styles.myLocationIconCrossH} />
            <View style={styles.myLocationIconCrossV} />
          </View>
        )}
      </TouchableOpacity>

      <Animated.View 
        style={[styles.bottomSheet, { height: bottomSheetHeight }]}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {showSearchResults ? (
          <Animated.View 
            style={[
              styles.bottomSheetContent,
              {
                transform: [{ translateX: searchTranslateX }]
              }
            ]}
          >
            <View style={styles.searchResultsState}>
              <View style={styles.header}>
                <View style={styles.dragHandle} />
                <View style={styles.searchResultsInfo}>
                  <Text style={styles.searchResultsTitle}>
                    {hasNoSearchResults ? "검색 결과 없음" : "검색 결과"}
                  </Text>
                  <Text style={styles.searchResultsCount}>
                    {hasNoSearchResults ? "검색된 결과가 없습니다" : `총 ${searchResults.length}개 결과`}
                  </Text>
                  {!hasNoSearchResults && (
                    <View style={styles.searchResultsIndicators}>
                      {Array.from({ length: Math.ceil(searchResults.length / 4) }).map((_, index) => (
                        <View 
                          key={index} 
                          style={[
                            styles.routeIndicator, 
                            index === currentSearchPage && styles.activeIndicator
                          ]} 
                        />
                      ))}
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.resetButton} onPress={resetRoute}>
                  <Text style={styles.resetButtonText}>초기화</Text>
                </TouchableOpacity>
              </View>

              {!isMinimized && (
                <View style={styles.searchResultsContainer}>
                  {hasNoSearchResults ? (
                    <View style={styles.noResultsContainer}>
                      <View style={styles.noResultsIcon}>
                        <Text style={styles.noResultsIconText}>🔍</Text>
                      </View>
                      <Text style={styles.noResultsTitle}>검색 결과가 없습니다</Text>
                      <Text style={styles.noResultsSubtitle}>
                        {searchError || "다른 키워드로 다시 검색해보세요"}
                      </Text>
                      <View style={styles.noResultsTips}>
                        <Text style={styles.noResultsTipText}>• 정확한 장소명이나 주소를 입력해보세요</Text>
                        <Text style={styles.noResultsTipText}>• 지역명을 함께 입력해보세요</Text>
                        <Text style={styles.noResultsTipText}>• 지도에서 직접 위치를 선택해보세요</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.searchResultsGrid}>
                      {getCurrentPageResults().map((result, index) => (
                        <View key={index} style={styles.searchResultItem}>
                          <View style={styles.resultInfo}>
                            <Text style={styles.resultName}>{result.name}</Text>
                            <Text style={styles.resultAddress}>{result.address}</Text>
                          </View>
                          <View style={styles.resultButtons}>
                            <TouchableOpacity 
                              style={[styles.setPointButton, styles.startPointButton]}
                              onPress={() => setPointFromSearch(result, 'start')}
                            >
                              <Text style={styles.setPointButtonText}>출발지</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.setPointButton, styles.endPointButton]}
                              onPress={() => setPointFromSearch(result, 'end')}
                            >
                              <Text style={styles.setPointButtonText}>도착지</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </Animated.View>
        ) : (
          <Animated.View 
            style={[
              styles.bottomSheetContent,
              {
                transform: [{ translateX: contentTranslateX }]
              }
            ]}
          >
            {isLoading ? (
              <View style={styles.loadingState}>
                <View style={styles.loadingAnimation}>
                  <View style={styles.loadingSpinnerContainer}>
                    <View style={styles.loadingSpinnerBase} />
                    <Animated.View 
                      style={[
                        styles.loadingSpinnerActive,
                        {
                          transform: [{
                            rotate: spinValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg']
                            })
                          }]
                        }
                      ]} 
                    >
                      <View style={styles.loadingSpinnerSegment} />
                    </Animated.View>
                  </View>
                </View>
                <Text style={styles.loadingText}>경로를 탐색중입니다...</Text>
                <Text style={styles.loadingSubText}>잠시만 기다려주세요</Text>
              </View>
            ) : !hasRoute && !routeError ? (
              <View style={styles.initialState}>
                <Text style={styles.instructionText}>
                  출발지와 도착지를 설정하세요
                </Text>
              </View>
            ) : routeError ? (
              <View style={styles.errorState}>
                <View style={styles.header}>
                  <View style={styles.dragHandle} />
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeTypeLabel}>경로 탐색 실패</Text>
                  </View>
                  <TouchableOpacity style={styles.resetButton} onPress={resetRoute}>
                    <Text style={styles.resetButtonText}>초기화</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.errorContainer}>
                  <View style={styles.errorIcon}>
                    <Text style={styles.errorIconText}>⚠️</Text>
                  </View>
                  <Text style={styles.errorText}>{routeError}</Text>
                  <Text style={styles.errorSubText}>
                    문제가 반복되다면 더 짧은 경로로 검색해보세요.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.routeState}>
                <View style={styles.header}>
                  <View style={styles.dragHandle} />
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeTypeLabel}>
                      {routeTypes[currentRouteIndex]?.label}
                    </Text>
                    <View style={styles.routeMetrics}>
                      <Text style={styles.distanceText}>
                        {routeInfo ? (routeInfo.distance / 1000).toFixed(2) : '0.0'}km
                      </Text>
                      <Text style={styles.timeText}>
                        {routeInfo ? formatTime(routeInfo.adjustedTimeMin) : '0분 0초'}
                      </Text>
                    </View>
                    <View style={styles.routeIndicators}>
                      {routeTypes.map((_, index) => (
                        <View 
                          key={index} 
                          style={[
                            styles.routeIndicator, 
                            index === currentRouteIndex && styles.activeIndicator
                          ]} 
                        />
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity style={styles.resetButton} onPress={resetRoute}>
                    <Text style={styles.resetButtonText}>초기화</Text>
                  </TouchableOpacity>
                </View>

                {!isMinimized && routeInfo && fareList.length > 0 && (
                  <>
                    <View style={styles.detailsContainer}>
                      <Text style={styles.detailsTitle}>경로 상세</Text>
                      <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>경사도 {routeInfo.avgSlope}%</Text>
                          <View style={styles.graphContainer}>
                            <View 
                              style={[styles.graphBar, { 
                                width: `${Math.min((routeInfo.avgSlope / 10) * 100, 100)}%`,
                                backgroundColor: routeInfo.avgSlope > 5 ? '#FF5722' : routeInfo.avgSlope > 3 ? '#FF9800' : '#4CAF50'
                              }]} 
                            />
                          </View>
                        </View>

                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>신호등 {routeInfo.crossingCount}개</Text>
                          <View style={styles.graphContainer}>
                            <View 
                              style={[styles.graphBar, { 
                                width: `${Math.min((routeInfo.crossingCount / 20) * 100, 100)}%`,
                                backgroundColor: routeInfo.crossingCount > 10 ? '#FF5722' : routeInfo.crossingCount > 5 ? '#FF9800' : '#4CAF50'
                              }]} 
                            />
                          </View>
                        </View>

                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>자전거도로 {routeInfo.bikeLaneRatio}%</Text>
                          <View style={styles.graphContainer}>
                            <View 
                              style={[styles.graphBar, { 
                                width: `${routeInfo.bikeLaneRatio}%`,
                                backgroundColor: routeInfo.bikeLaneRatio > 70 ? '#4CAF50' : routeInfo.bikeLaneRatio > 40 ? '#FF9800' : '#FF5722'
                              }]} 
                            />
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.fareContainer}>
                      <Text style={styles.fareTitle}>요금 비교</Text>
                      <View style={styles.fareGrid}>
                        <View style={styles.fareRow}>
                          {fareList.slice(0, 2).map((item, index) => {
                            const minFare = Math.min(...fareList.map(f => f.fare));
                            const maxFare = Math.max(...fareList.map(f => f.fare));
                            const range = maxFare - minFare;
                            const fillPercentage = range === 0 ? 0 : ((item.fare - minFare) / range) * 100;
                            
                            let fillColor = '#E6F3FF';
                            if (item.fare === minFare) {
                              fillColor = 'transparent';
                            } else if (item.fare === maxFare) {
                              fillColor = '#FFD6D6';
                            }
                            const isSelected = selectedProvider === item.name;
                            const isDisabled = selectedProvider && !isSelected;

                            return (
                              <View key={index} style={[
                                styles.fareGridItem, 
                                item.isRecommended && styles.recommendedGridItem,
                                isSelected && styles.selectedGridItem,
                                isDisabled && styles.disabledGridItem
                              ]}>
                                <View style={styles.fareBackground}>
                                  <View 
                                    style={[
                                      styles.fareFillBar,
                                      {
                                        height: `${fillPercentage}%`,
                                        backgroundColor: fillColor
                                      }
                                    ]}
                                  />
                                </View>
                                <View style={styles.fareContent}>
                                  <Image 
                                    source={getBrandLogo(item.name)} 
                                    style={[styles.brandLogo, isDisabled && styles.disabledImage]}
                                    resizeMode="contain"
                                  />
                                  <Text style={[styles.brandName, isDisabled && styles.disabledText]}>
                                    {item.name}
                                  </Text>
                                  <Text style={[styles.brandPrice, isDisabled && styles.disabledText]}>
                                    {item.fare.toLocaleString()}원
                                  </Text>
                                  {isSelected ? (
                                    <TouchableOpacity 
                                      style={[styles.arrivalButton, hasArrived && styles.disabledButton]}
                                      onPress={handleArrival}
                                      disabled={hasArrived}
                                    >
                                      <Text style={[styles.arrivalButtonText, hasArrived && styles.disabledButtonText]}>
                                        {hasArrived ? "도착 완료" : "목적지 도착"}
                                      </Text>
                                    </TouchableOpacity>
                                  ) : (
                                    <TouchableOpacity 
                                      style={[
                                        styles.gridSelectButton, 
                                        item.isRecommended && styles.recommendedGridButton,
                                        isDisabled && styles.disabledButton
                                      ]}
                                      onPress={() => !isDisabled && selectProvider(item.name)}
                                      disabled={isDisabled}
                                    >
                                      <Text style={[
                                        styles.gridSelectText, 
                                        item.isRecommended && styles.recommendedGridText,
                                        isDisabled && styles.disabledButtonText
                                      ]}>
                                        선택
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                          <View style={styles.adGridItem}>
                            <Text style={styles.adTitle}>비용 절감!</Text>
                            <Text style={styles.adSavings}>
                              최대{' '}
                              <Text style={styles.adSavingsAmount}>
                                {getDynamicSavings()}원
                              </Text>
                            </Text>
                            <Text style={styles.adSubtext}>절약</Text>
                          </View>
                        </View>
                        <View style={styles.fareRow}>
                          {fareList.slice(2, 5).map((item, index) => {
                            const minFare = Math.min(...fareList.map(f => f.fare));
                            const maxFare = Math.max(...fareList.map(f => f.fare));
                            const range = maxFare - minFare;
                            const fillPercentage = range === 0 ? 0 : ((item.fare - minFare) / range) * 100;
                            
                            let fillColor = '#E6F3FF';
                            if (item.fare === minFare) {
                              fillColor = 'transparent';
                            } else if (item.fare === maxFare) {
                              fillColor = '#FFD6D6';
                            }
                            const isSelected = selectedProvider === item.name;
                            const isDisabled = selectedProvider && !isSelected;
                            return (
                              <View key={index + 2} style={[
                                styles.fareGridItem, 
                                item.isRecommended && styles.recommendedGridItem,
                                isSelected && styles.selectedGridItem,
                                isDisabled && styles.disabledGridItem
                              ]}>
                                <View style={styles.fareBackground}>
                                  <View 
                                    style={[
                                      styles.fareFillBar,
                                      {
                                        height: `${fillPercentage}%`,
                                        backgroundColor: fillColor
                                      }
                                    ]}
                                  />
                                </View>
                                <View style={styles.fareContent}>
                                  <Image 
                                    source={getBrandLogo(item.name)} 
                                    style={[styles.brandLogo, isDisabled && styles.disabledImage]}
                                    resizeMode="contain"
                                  />
                                  <Text style={[styles.brandName, isDisabled && styles.disabledText]}>{item.name}</Text>
                                  <Text style={[styles.brandPrice, isDisabled && styles.disabledText]}>{item.fare.toLocaleString()}원</Text>
                                  {isSelected ? (
                                    <TouchableOpacity 
                                      style={[styles.arrivalButton, hasArrived && styles.disabledButton]}
                                      onPress={handleArrival}
                                      disabled={hasArrived}
                                    >
                                      <Text style={[styles.arrivalButtonText, hasArrived && styles.disabledButtonText]}>
                                        {hasArrived ? "도착 완료" : "목적지 도착"}
                                      </Text>
                                    </TouchableOpacity>
                                  ) : (
                                    <TouchableOpacity 
                                      style={[
                                        styles.gridSelectButton, 
                                        item.isRecommended && styles.recommendedGridButton,
                                        isDisabled && styles.disabledButton
                                      ]}
                                      onPress={() => !isDisabled && selectProvider(item.name)}
                                      disabled={isDisabled}
                                    >
                                      <Text style={[
                                        styles.gridSelectText, 
                                        item.isRecommended && styles.recommendedGridText,
                                        isDisabled && styles.disabledButtonText
                                      ]}>
                                        선택
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </View>
            )}
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    position: 'absolute',
    top: Constants.statusBarHeight - 15,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: 44,
    fontFamily: 'Cafe24',
    color: '#2c3e50',
    paddingRight: 12,
  },
  searchButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#80a0c7ff',
    borderRadius: 12,
  },
  searchButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  pointSelectionContainer: {
    position: 'absolute',
    top: Constants.statusBarHeight + 45,
    left: 20,
    right: 20,
    zIndex: 999,
  },
  pointSelectionBar: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  pointLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    width: 40,
  },
  pointContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointText: {
    fontSize: 10,
    color: '#333',
    flex: 1,
    marginRight: 6,
  },
  pointDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 2,
  },
  mapSelectButton1: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    minWidth: 50,
  },
  mapSelectButton2: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: '#FF9800',
    borderRadius: 5,
    minWidth: 50,
  },
  mapSelectButtonActive: {
    backgroundColor: '#999',
  },
  mapSelectButtonText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  mapSelectButtonTextActive: {
    color: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  bottomSheetContent: {
    flex: 1,
  },
  searchResultsState: {
    flex: 1,
  },
  searchResultsInfo: {
    flex: 1,
    alignItems: 'center',
  },
  searchResultsTitle: {
    fontSize: 15,
    fontFamily: 'Cafe24',
    color: '#666',
    marginBottom: 2,
  },
  searchResultsCount: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  searchResultsIndicators: {
    flexDirection: 'row',
    gap: 6,
  },
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  searchResultsGrid: {
    gap: 12,
  },
  searchResultItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
    marginRight: 8,
  },
  resultName: {
    fontSize: 14,
    fontFamily: 'Cafe24',
    color: '#2c3e50',
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 12,
    color: '#666',
  },
  resultButtons: {
    flexDirection: 'column',
    gap: 2,
  },
  setPointButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 40,
  },
  startPointButton: {
    backgroundColor: '#4CAF50',
  },
  endPointButton: {
    backgroundColor: '#FF9800',
  },
  setPointButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsIcon: {
    marginBottom: 16,
  },
  noResultsIconText: {
    fontSize: 48,
    opacity: 0.5,
  },
  noResultsTitle: {
    fontSize: 18,
    fontFamily: 'Cafe24',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  noResultsTips: {
    alignItems: 'flex-start',
  },
  noResultsTipText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'left',
  },
  initialState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    height: 20,
    fontFamily: 'Cafe24',
    color: '#2c3e50',
    textAlign: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stepText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  routeState: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginRight: 15,
  },
  routeInfo: {
    flex: 1,
    alignItems: 'center',
  },
  routeTypeLabel: {
    fontSize: 15,
    fontFamily: 'Cafe24',
    color: '#666',
    marginBottom: 4,
  },
  routeMetrics: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 6,
  },
  routeIndicators: {
    flexDirection: 'row',
    gap: 6,
  },
  routeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ddd',
  },
  activeIndicator: {
    backgroundColor: '#4CAF50',
  },
  resetButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  toggleIcon: {
    fontSize: 16,
  },
  routeOptionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  routeOptionsContent: {
    gap: 12,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  activeOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeOptionText: {
    color: '#ffffff',
  },
  detailsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  detailsTitle: {
    fontSize: 13,
    fontFamily: 'Cafe24',
    color: '#2c3e50',
    marginTop: 8,
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 3,
    textAlign: 'center',
  },
  graphContainer: {
    height: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  graphBar: {
    height: '100%',
    borderRadius: 2.5,
  },
  fareContainer: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  fareTitle: {
    fontSize: 13,
    fontFamily: 'Cafe24',
    color: '#2c3e50',
    marginTop: 8,
    marginBottom: 10,
  },
  fareGrid: {
    gap: 8,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  fareGridItem: {
    width: (screenWidth - 40 - 16) / 3,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden',
  },
  recommendedGridItem: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  fareBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
  },
  fareFillBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 8,
  },
  fareContent: {
    padding: 8,
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  adGridItem: {
    width: (screenWidth - 40 - 16) / 3,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden',
  },
  brandLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 4,
  },
  brandLogoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandLogoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  brandName: {
    fontSize: 12,
    fontFamily: 'Cafe24',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  brandPrice: {
    fontSize: 8,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  gridSelectButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recommendedGridButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  gridSelectText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#666',
  },
  recommendedGridText: {
    color: '#ffffff',
  },
  adTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  adSavings: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  adSavingsAmount: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFD700',
  },
  adSubtext: {
    fontSize: 8,
    color: '#ffffff',
    textAlign: 'center',
  },
  fareChartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fareInfo: {
    flex: 2,
    minWidth: 70,
  },
  fareBarContainer: {
    flex: 3,
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fareBar: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cheapestBar: {
    backgroundColor: '#4CAF50',
  },
  expensiveBar: {
    backgroundColor: '#FF5722',
  },
  normalBar: {
    backgroundColor: '#87CEEB',
  },
  selectButton: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectButtonText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#666',
  },
  fareName: {
    fontSize: 10,
    fontWeight: '500',
    color: '#333',
  },
  farePrice: {
    fontSize: 9,
    fontWeight: '700',
    color: '#333',
  },
  cheapestText: {
    color: '#4CAF50',
  },
  expensiveText: {
    color: '#FF5722',
  },
  normalText: {
    color: '#666',
  },
  cheapestButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  cheapestButtonText: {
    color: '#ffffff',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingAnimation: {
    marginBottom: 16,
  },
  loadingSpinnerContainer: {
    width: 40,
    height: 40,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinnerBase: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    position: 'absolute',
  },
  loadingSpinnerActive: {
    width: 40,
    height: 40,
    position: 'absolute',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  loadingSpinnerSegment: {
    width: 6,
    height: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 3,
    marginTop: 2,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Cafe24',
    color: '#2c3e50',
    marginBottom: 4,
  },
  loadingSubText: {
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorState: {
    flex: 1,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorIconText: {
    fontSize: 48,
    opacity: 0.8,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Cafe24',
    color: '#FF5722',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  selectedGridItem: {
    backgroundColor: '#fff3e0',
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  disabledGridItem: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  disabledImage: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999',
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  disabledButtonText: {
    color: '#ccc',
  },
  arrivalButton: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#FF9800',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  arrivalButtonText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  myLocationIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myLocationIconOuter: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  myLocationIconInner: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  myLocationIconCrossH: {
    position: 'absolute',
    width: 24,
    height: 2,
    backgroundColor: '#4CAF50',
  },
  myLocationIconCrossV: {
    position: 'absolute',
    width: 2,
    height: 24,
    backgroundColor: '#4CAF50',
  },
});

export default Explore;