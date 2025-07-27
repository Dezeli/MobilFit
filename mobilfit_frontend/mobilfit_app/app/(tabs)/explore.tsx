import React, { useState, useRef } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Animated, Dimensions, ScrollView, GestureResponderEvent, Image, PanGestureHandler, PanGestureHandlerGestureEvent } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import axios from "axios";
import Constants from "expo-constants";
import { getDistance } from "geolib";

const { width: screenWidth } = Dimensions.get('window');

const ORS_API_KEY = Constants.expoConfig?.extra?.orsApiKey;
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleApiKey;


const calculateAvgSlopePercent = (elevations: number[], coords: number[][]): number => {
  if (elevations.length < 2 || coords.length < 2) return 0;
  const latlngCoords = coords.map(([lng, lat]) => [lat, lng]);

  let uphill = 0;
  for (let i = 1; i < elevations.length; i++) {
    if (elevations[i] > elevations[i - 1]) {
      uphill += elevations[i] - elevations[i - 1];
    }
  }

  let totalDist = 0;
  for (let i = 1; i < latlngCoords.length; i++) {
    totalDist += getDistance(
      { latitude: latlngCoords[i - 1][0], longitude: latlngCoords[i - 1][1] },
      { latitude: latlngCoords[i][0], longitude: latlngCoords[i][1] }
    );
  }

  if (totalDist === 0) return 0;
  return Number(((uphill / totalDist) * 100).toFixed(2));
};

const calculateElevationWeight = (elevations: number[], coords: number[][]): number => {
  let uphill = 0;
  for (let i = 1; i < elevations.length; i++) {
    if (elevations[i] > elevations[i - 1]) {
      uphill += elevations[i] - elevations[i - 1];
    }
  }

  let totalDist = 0;
  for (let i = 1; i < coords.length; i++) {
    totalDist += getDistance(
      { latitude: coords[i - 1][1], longitude: coords[i - 1][0] },
      { latitude: coords[i][1], longitude: coords[i][0] }
    );
  }

  const gradient = uphill / totalDist;
  return gradient * 5 + 1;
};

const getBBoxFromCoordinates = (coords: number[][]): [number, number, number, number] => {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  coords.forEach(([lng, lat]) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });
  return [minLat, minLng, maxLat, maxLng];
};

const fetchCrossingsInBBox = async (bbox: [number, number, number, number]) => {
  const [south, west, north, east] = bbox;
  const query = `
    [out:json];
    (
      node["highway"="crossing"](${south},${west},${north},${east});
    );
    out body;
  `;
  try {
    const response = await axios.post("https://overpass-api.de/api/interpreter", query, {
      headers: { "Content-Type": "text/plain" },
    });
    return response.data?.elements || [];
  } catch (err) {
    console.error("Overpass API 오류:", err);
    return [];
  }
};

const filterNearbyCrossings = (
  crossings: { lat: number; lon: number }[],
  routeCoords: number[][],
  threshold = 10
): { lat: number; lng: number }[] => {
  return crossings
    .filter((crossing) =>
      routeCoords.some(([lng, lat]) => {
        const dist = getDistance(
          { latitude: crossing.lat, longitude: crossing.lon },
          { latitude: lat, longitude: lng }
        );
        return dist <= threshold;
      })
    )
    .map((c) => ({ lat: c.lat, lng: c.lon }));
};

const deduplicateCloseCrossings = (
  crossings: { lat: number; lng: number }[],
  threshold = 30
): { lat: number; lng: number; count: number }[] => {
  const clusters: { lat: number; lng: number; count: number }[] = [];
  crossings.forEach((crossing) => {
    const cluster = clusters.find((c) => {
      const dist = getDistance(
        { latitude: c.lat, longitude: c.lng },
        { latitude: crossing.lat, longitude: crossing.lng }
      );
      return dist <= threshold;
    });
    if (cluster) {
      cluster.lat = (cluster.lat * cluster.count + crossing.lat) / (cluster.count + 1);
      cluster.lng = (cluster.lng * cluster.count + crossing.lng) / (cluster.count + 1);
      cluster.count += 1;
    } else {
      clusters.push({ lat: crossing.lat, lng: crossing.lng, count: 1 });
    }
  });
  return clusters;
};

const getBrandLogo = (brandName: string) => {
  switch(brandName) {
    case "카카오":
      return require("../../assets/images/kakao.jpg");
    case "쏘카":
      return require("../../assets/images/socar.png");
    case "지쿠(시간제)":
    case "지쿠(거리제)":
      return require("../../assets/images/jiku.jpg");
    case "티맵":
      return require("../../assets/images/tmap.jpg");
    default:
      return null;
  }
};

const calculateBikeFareList = (
  adjustedTimeMin: number,
  distanceKm: number
): { name: string; fare: number; isRecommended?: boolean }[] => {
  const bikes = [
    { name: "카카오", base: 500, perMin: 160, perKm: 0 },
    { name: "쏘카", base: 600, perMin: 150, perKm: 0 },
    { name: "지쿠(시간제)", base: 600, perMin: 180, perKm: 0 },
    { name: "티맵", base: 1000, perMin: 130, perKm: 0 },
    { name: "지쿠(거리제)", base: 0, perMin: 30, perKm: 600 },
  ];

  const fares = bikes.map((bike) => {
    const fare =
      (bike.base ?? 0) +
      (bike.perMin ?? 0) * adjustedTimeMin +
      (bike.perKm ?? 0) * distanceKm;
    return { name: bike.name, fare: Math.round(fare) };
  });

  fares.sort((a, b) => a.fare - b.fare);
  if (fares.length > 0) fares[0].isRecommended = true;
  return fares;
};

const Explore: React.FC = () => {
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [preference, setPreference] = useState<"fastest" | "shortest" | "recommended">("recommended");
  const [hasRoute, setHasRoute] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [fareList, setFareList] = useState<any[]>([]);
  const [isRouteFixed, setIsRouteFixed] = useState(false);
  const [allRouteData, setAllRouteData] = useState<{[key: string]: any}>({});
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const webViewRef = useRef<any>(null);
  const bottomSheetHeight = useRef(new Animated.Value(80)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);

  // 스피너 애니메이션
  React.useEffect(() => {
    if (isLoading) {
      const spin = () => {
        spinValue.setValue(0);
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          if (isLoading) spin();
        });
      };
      spin();
    }
  }, [isLoading, spinValue]);

  const routeTypes = [
    { key: "recommended", label: "추천 경로" },
    { key: "fastest", label: "최단 시간" },
    { key: "shortest", label: "최단 거리" }
  ];

  const handleTouchStart = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    setTouchStart({ x: pageX, y: pageY });
  };

  const handleTouchMove = (event: GestureResponderEvent) => {
    if (!touchStart || !hasRoute) return;

    const { pageX, pageY } = event.nativeEvent;
    const deltaX = pageX - touchStart.x;
    const deltaY = pageY - touchStart.y;

    // 수평 스와이프가 더 큰 경우에만 처리
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 경계값 설정 (화면의 30%까지만 이동)
      const maxTranslate = screenWidth * 0.3;
      const clampedDeltaX = Math.max(-maxTranslate, Math.min(maxTranslate, deltaX));
      
      contentTranslateX.setValue(clampedDeltaX);
    }
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    if (!touchStart) return;

    const { pageX, pageY } = event.nativeEvent;
    const deltaX = pageX - touchStart.x;
    const deltaY = pageY - touchStart.y;

    // 임계값 설정
    const horizontalThreshold = 60;
    const verticalThreshold = 30;

    // 수평 스와이프가 더 큰 경우 (경로 변경)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > horizontalThreshold) {
      if (deltaX > 0) {
        // 오른쪽 스와이프 - 이전 경로
        const newIndex = Math.max(0, currentRouteIndex - 1);
        changeRoute(newIndex);
      } else {
        // 왼쪽 스와이프 - 다음 경로
        const newIndex = Math.min(routeTypes.length - 1, currentRouteIndex + 1);
        changeRoute(newIndex);
      }
    }
    // 수직 스와이프가 더 큰 경우 (펼치기/접기)
    else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > verticalThreshold) {
      if (deltaY > 0) {
        // 아래로 스와이프 - 접기
        setIsMinimized(true);
        Animated.spring(bottomSheetHeight, {
          toValue: 80,
          useNativeDriver: false,
        }).start();
      } else {
        // 위로 스와이프 - 펼치기
        setIsMinimized(false);
        Animated.spring(bottomSheetHeight, {
          toValue: 400,
          useNativeDriver: false,
        }).start();
      }
    }

    // 내용을 원래 위치로 복원
    Animated.spring(contentTranslateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    setTouchStart(null);
  };

  const changeRoute = (newIndex: number) => {
    if (newIndex !== currentRouteIndex && allRouteData && newIndex >= 0 && newIndex < routeTypes.length) {
      const direction = newIndex > currentRouteIndex ? -1 : 1; // -1은 왼쪽으로, 1은 오른쪽으로
      
      // 현재 내용을 반대 방향으로 슬라이드 아웃
      Animated.timing(contentTranslateX, {
        toValue: direction * screenWidth,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // 경로 데이터 변경
        setCurrentRouteIndex(newIndex);
        const routeKey = routeTypes[newIndex].key;
        
        if (allRouteData[routeKey]) {
          displayRoute(allRouteData[routeKey]);
          setPreference(routeKey as "fastest" | "shortest" | "recommended");
        }
        
        // 새 내용을 반대쪽에서 슬라이드 인
        contentTranslateX.setValue(-direction * screenWidth);
        Animated.timing(contentTranslateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const fetchRoute = async (start: any, end: any, selectedPreference: string) => {
    if (!ORS_API_KEY) return null;
    try {
      const response = await axios.post(
        "https://api.openrouteservice.org/v2/directions/cycling-regular/geojson",
        {
          coordinates: [
            [start.lng, start.lat],
            [end.lng, end.lat],
          ],
          preference: selectedPreference,
          instructions: true,
          geometry_simplify: false,
          extra_info: ["waytype"],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: ORS_API_KEY,
          },
        }
      );
      const feature = response.data.features?.[0];
      const coordinates = feature?.geometry?.coordinates;
      const waytypeInfo = feature?.properties?.extras?.waytype?.values;
      const duration = feature?.properties?.summary?.duration;
      const distance = feature?.properties?.summary?.distance;
      if (!coordinates || !Array.isArray(waytypeInfo)) return null;

      const waytypes = new Array(coordinates.length - 1).fill(0);
      waytypeInfo.forEach(([startIdx, endIdx, type]: [number, number, number]) => {
        for (let i = startIdx; i < endIdx; i++) {
          waytypes[i] = type;
        }
      });

      return { coordinates, waytypes, duration, distance };
    } catch {
      return null;
    }
  };

  const getGoogleElevations = async (coords: number[][]): Promise<number[]> => {
    if (!GOOGLE_API_KEY) return [];
    const locationsParam = coords.map(([lng, lat]) => `${lat},${lng}`).join("|");
    const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${encodeURIComponent(locationsParam)}&key=${GOOGLE_API_KEY}`;
    try {
      const response = await axios.get(url);
      return response.data.results?.map((r: any) => r.elevation) || [];
    } catch {
      return [];
    }
  };

  const expandBottomSheet = () => {
    Animated.spring(bottomSheetHeight, {
      toValue: 430,
      useNativeDriver: false,
    }).start();
  };

  const drawAllRoutes = async (start: any, end: any) => {
    setIsLoading(true);
    
    const routeTypes = ["recommended", "fastest", "shortest"];
    const allData: {[key: string]: any} = {};
    
    try {
      for (const routeType of routeTypes) {
        const routeResult = await fetchRoute(start, end, routeType);
        if (routeResult) {
          const { coordinates, waytypes, duration, distance } = routeResult;
          
          const elevations = await getGoogleElevations(coordinates);
          const elevationWeight = calculateElevationWeight(elevations, coordinates);
          const avgSlope = calculateAvgSlopePercent(elevations, coordinates);

          const bbox = getBBoxFromCoordinates(coordinates);
          const rawCrossings = await fetchCrossingsInBBox(bbox);
          const filtered = filterNearbyCrossings(rawCrossings, coordinates);
          const deduped = deduplicateCloseCrossings(filtered);

          const bikeLaneRatio = waytypes.filter(w => w === 6).length / waytypes.length;
          const nonBikeLaneRatio = 1 - bikeLaneRatio;
          const bikeAdjustedTimeSec = (bikeLaneRatio * duration * 0.9) + (nonBikeLaneRatio * duration);

          let crossingDelayMin = 0;
          for (const c of deduped) {
            const count = c.count;
            crossingDelayMin += count >= 4 ? 1.0 : count === 3 ? 0.9 : count === 2 ? 0.7 : count === 1 ? 0.4 : 0;
          }

          const adjustedTimeMin = (bikeAdjustedTimeSec / 60) * elevationWeight + crossingDelayMin;
          const distanceKm = distance / 1000;
          const fareList = calculateBikeFareList(adjustedTimeMin, distanceKm);

          allData[routeType] = {
            coordinates,
            waytypes,
            crossings: deduped.map(({ lat, lng }) => ({ lat, lng })),
            info: {
              distance: Math.round(distance),
              adjustedTimeMin: Number(adjustedTimeMin.toFixed(2)),
              avgSlope,
              crossingCount: deduped.length,
              bikeLaneRatio: Number((bikeLaneRatio * 100).toFixed(1))
            },
            fareList
          };
        }
      }
      
      setAllRouteData(allData);
      setCurrentRouteIndex(0);
      
      if (allData.recommended) {
        displayRoute(allData.recommended);
        setHasRoute(true);
        setIsRouteFixed(true);
        Animated.spring(bottomSheetHeight, {
          toValue: 80,
          useNativeDriver: false,
        }).start();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const displayRoute = (routeData: any) => {
    webViewRef.current?.postMessage(JSON.stringify({ 
      type: "drawRoute", 
      coordinates: routeData.coordinates, 
      waytypes: routeData.waytypes 
    }));

    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "drawCrossings",
        crossings: routeData.crossings,
      })
    );

    setRouteInfo(routeData.info);
    setFareList(routeData.fareList);
  };

  const handlePreferenceChange = (newPreference: any) => {
    const newIndex = routeTypes.findIndex(route => route.key === newPreference);
    if (newIndex !== -1) {
      changeRoute(newIndex);
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const clickedPoint = { lat: data.lat, lng: data.lng };
      
      if (isRouteFixed) {
        return;
      }
      
      if (data.clickCount === 1) {
        setStartPoint(clickedPoint);
        setEndPoint(null);
        setHasRoute(false);
        Animated.spring(bottomSheetHeight, {
          toValue: 80,
          useNativeDriver: false,
        }).start();
      } else if (data.clickCount === 2) {
        setEndPoint(clickedPoint);
        if (startPoint) {
          Animated.spring(bottomSheetHeight, {
            toValue: 150,
            useNativeDriver: false,
          }).start();
          drawAllRoutes(startPoint, clickedPoint);
        }
      }
    } catch (err) {
      console.error("메시지 처리 오류:", err);
    }
  };

  const resetRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setHasRoute(false);
    setIsRouteFixed(false);
    setRouteInfo(null);
    setFareList([]);
    setAllRouteData({});
    setCurrentRouteIndex(0);
    setIsMinimized(true);
    setIsLoading(false);
    webViewRef.current?.postMessage(JSON.stringify({ type: "clearRoute" }));
    Animated.spring(bottomSheetHeight, {
      toValue: 80,
      useNativeDriver: false,
    }).start();
  };

  const toggleMinimize = () => {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);
    Animated.spring(bottomSheetHeight, {
      toValue: newMinimizedState ? 80 : 430,
      useNativeDriver: false,
    }).start();
  };

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}분 ${secs}초`;
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={require("../../assets/leaflet/leaflet.html")}
        onMessage={handleMessage}
        style={styles.webview}
      />
      
      <Animated.View 
        style={[styles.bottomSheet, { height: bottomSheetHeight }]}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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
                <Animated.View 
                  style={[
                    styles.loadingSpinner,
                    {
                      transform: [{
                        rotate: spinValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }
                  ]} 
                />
              </View>
              <Text style={styles.loadingText}>경로를 탐색중입니다...</Text>
              <Text style={styles.loadingSubText}>잠시만 기다려주세요</Text>
            </View>
          ) : !hasRoute ? (
            <View style={styles.initialState}>
              <Text style={styles.instructionText}>
                지도를 터치해서 출발지와 도착지를 설정하세요
              </Text>
              <View style={styles.stepContainer}>
                <Text style={styles.stepText}>첫 번째 터치: 출발지</Text>
                <Text style={styles.stepText}>두 번째 터치: 도착지</Text>
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

                          return (
                            <View key={index} style={[styles.fareGridItem, item.isRecommended && styles.recommendedGridItem]}>
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
                                  style={styles.brandLogo}
                                  resizeMode="contain"
                                />
                                <Text style={styles.brandName}>{item.name}</Text>
                                <Text style={styles.brandPrice}>{item.fare.toLocaleString()}원</Text>
                                <TouchableOpacity 
                                  style={[styles.gridSelectButton, item.isRecommended && styles.recommendedGridButton]}
                                  onPress={() => {/* 선택 로직 추가 */}}
                                >
                                  <Text style={[styles.gridSelectText, item.isRecommended && styles.recommendedGridText]}>
                                    선택
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                        <View style={styles.adGridItem}>
                          <Text style={styles.adTitle}>비용 절감!</Text>
                          <Text style={styles.adSavings}>
                            최대{' '}
                            <Text style={styles.adSavingsAmount}>
                              {Math.max(...fareList.map(f => f.fare)) - Math.min(...fareList.map(f => f.fare))}원
                            </Text>
                          </Text>
                          <Text style={styles.adSubtext}>차이</Text>
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

                          return (
                            <View key={index + 2} style={[styles.fareGridItem, item.isRecommended && styles.recommendedGridItem]}>
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
                                  style={styles.brandLogo}
                                  resizeMode="contain"
                                />
                                <Text style={styles.brandName}>{item.name}</Text>
                                <Text style={styles.brandPrice}>{item.fare.toLocaleString()}원</Text>
                                <TouchableOpacity 
                                  style={[styles.gridSelectButton, item.isRecommended && styles.recommendedGridButton]}
                                  onPress={() => {/* 선택 로직 추가 */}}
                                >
                                  <Text style={[styles.gridSelectText, item.isRecommended && styles.recommendedGridText]}>
                                    선택
                                  </Text>
                                </TouchableOpacity>
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
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  initialState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
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
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  timeText: {
    fontSize: 16,
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
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 6,
    marginBottom: 6,
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
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 8,
    marginBottom: 8,
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
    fontWeight: '600',
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
    fontWeight: '700',
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
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#f0f0f0',
    borderTopColor: '#4CAF50',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  loadingSubText: {
    fontSize: 12,
    color: '#666',
  },
});

export default Explore;