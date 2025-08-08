import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions, Image, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect } from "expo-router";
import { apiGet, API_BASE_URL } from "../../lib/api";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userGrade, setUserGrade] = useState<any>(null);
  const [myPageData, setMyPageData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllData = async () => {
    if (!isAuthenticated) {
      setDataLoading(false);
      return;
    }

    try {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (!accessToken) {
        setDataLoading(false);
        return;
      }

      try {
        const noticeRes = await fetch(`${API_BASE_URL}/api/v1/auth/notices/`);
        const noticeData = await noticeRes.json();
        setNotices(noticeData?.data?.result || noticeData?.data || []);
      } catch (error) {
        setNotices([]);
      }

      try {
        const meRes = await apiGet("/api/v1/auth/me/", accessToken);
        setUserInfo(meRes?.data?.result || meRes?.data || {});
      } catch (error) {
        setUserInfo({});
      }

      try {
        const gradeRes = await apiGet("/api/v1/auth/me/grade/", accessToken);
        setUserGrade(gradeRes?.data?.result || gradeRes?.data || {});
      } catch (error) {
        setUserGrade({});
      }

      try {
        const myPageRes = await apiGet("/api/v1/auth/user/mypage/", accessToken);
        setMyPageData(myPageRes?.data?.result || myPageRes?.data || {});
      } catch (error) {
        setMyPageData({});
      }

    } catch (error) {
      setDataLoading(false);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const formatNoticeDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const parts = dateString.split(' ');
      if (parts.length !== 2) return dateString;
      
      const datePart = parts[0];
      const timePart = parts[1];
      
      const [year, month, day] = datePart.split('-');
      const [hour, minute] = timePart.split(':');
      
      const shortYear = year;
      
      return `${shortYear}-${month}-${day}  ${hour}:${minute}`;
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading || dataLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image 
          source={require('../../assets/images/mobilfit_logo.png')} 
          style={styles.loadingLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#4CAF50" style={styles.spinner} />
        <Text style={styles.loadingText}>MobilFit 로딩 중...</Text>
      </View>
    );
  }

  if (isAuthenticated === false) {
    return <Redirect href="/auth/login" />;
  }

  const getEnvironmentData = () => {
    if (!myPageData) return { co2Saved: 0, treeEquivalent: 0, coffeeCount: 0 };
    
    const totalDistance = myPageData.total_distance_km || 0;
    const totalSaving = myPageData.total_saved_money || 0;

    const co2Saved = Math.round(totalDistance * 0.21);
    const treeEquivalent = Math.floor(co2Saved / 22);
    const coffeeCount = Math.floor(totalSaving / 5000);
    
    return { co2Saved, treeEquivalent, coffeeCount };
  };

  const environmentData = getEnvironmentData();

  
  const renderFiveIconProgress = (
    current: number,
    unit: number,
    iconName: string
  ) => {
    const totalIcons = 5;
    const progress = Math.min(current / unit, totalIcons);
    const fullCount = Math.floor(progress);
    const hasHalf = progress % 1 >= 0.5;

    const FULL_COLOR = '#2E7D32';
    const HALF_COLOR = '#A5D6A7';
    const EMPTY_COLOR = '#E0E0E0';

    const icons = [];

    for (let i = 0; i < totalIcons; i++) {
      let iconColor = EMPTY_COLOR;

      if (i < fullCount) {
        iconColor = FULL_COLOR;
      } else if (i === fullCount && hasHalf) {
        iconColor = HALF_COLOR;
      }

      icons.push(
        <Ionicons
          key={i}
          name={iconName}
          size={22}
          color={iconColor}
          style={{ marginHorizontal: 2 }}
        />
      );
    }

    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        {icons}
      </View>
    );
  };

  const getGradeEmoji = (grade: string) => {
    switch(grade?.toLowerCase()) {
      case '플래티넘': return '💎';
      case '골드': return '🥇';
      case '실버': return '🥈';
      case '브론즈': return '🥉';
      default: return '🥉';
    }
  };
  const formatKoreanAmount = (amount: number) => {
    if (amount >= 10000) {
      const man = Math.floor(amount / 10000);
      return `약 ${man}만원`;
    } else if (amount >= 1000) {
      const cheon = Math.floor(amount / 1000);
      return `약 ${cheon}천원`;
    }
    return `약 ${amount}원`;
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#4CAF50', '#66BB6A']}
        style={styles.welcomeHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.welcomeContent}>
          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>안녕하세요!</Text>
            <Text style={styles.userName}>{userInfo?.nickname || "라이더"}님 🚴‍♂️</Text>
            <Text style={styles.welcomeSubtext}>오늘도 친환경 라이딩 준비되셨나요?</Text>
          </View>
          <View style={styles.gradeCard}>
            <Text style={styles.gradeEmoji}>{getGradeEmoji(userGrade?.grade)}</Text>
            <Text style={styles.gradeText}>{userGrade?.grade || "브론즈"}</Text>
          </View>
        </View>
      </LinearGradient>

      {notices.length > 0 && (
        <View style={styles.noticeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.noticeScrollContainer}>
            {notices.slice(0, 3).map((notice, index) => (
              <View key={`notice-${index}`} style={[styles.noticeCard, index === notices.slice(0, 3).length - 1 && styles.lastNoticeCard]}>
                <LinearGradient
                  colors={['rgba(255, 152, 0, 0.1)', 'rgba(255, 224, 178, 0.05)']}
                  style={styles.noticeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.noticeCardTitle} numberOfLines={1}>
                  {notice.title}
                </Text>
                <Text style={styles.noticeContent} numberOfLines={2}>
                  {notice.content}
                </Text>
                <Text style={styles.noticeDate}>
                  {formatNoticeDate(notice.created_at)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>나의 라이딩 현황</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#4CAF50', '#66BB6A']}
              style={styles.statIcon}
            >
              <Ionicons name="speedometer" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.statValue}>{myPageData?.ride_score || 80}점</Text>
            <Text style={styles.statLabel}>주행 점수</Text>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#FF9800', '#FFB74D']}
              style={styles.statIcon}
            >
              <Ionicons name="wallet" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.statValue}>{formatKoreanAmount(myPageData?.total_saved_money || 0)}</Text>
            <Text style={styles.statLabel}>절약 금액</Text>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#80a0c7ff', '#9fb8d1']}
              style={styles.statIcon}
            >
              <Ionicons name="bicycle" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.statValue}>{(myPageData?.total_distance_km || 0).toFixed(1)}km</Text>
            <Text style={styles.statLabel}>주행 거리</Text>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#666', '#888']}
              style={styles.statIcon}
            >
              <Ionicons name="rocket" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.statValue}>{myPageData?.app_usage_count || 0}회</Text>
            <Text style={styles.statLabel}>앱 사용</Text>
          </View>
        </View>
      </View>

      <View style={styles.environmentContainer}>
        <Text style={styles.sectionTitle}>나의 친환경 기록</Text>
        <View style={styles.environmentGrid}>
          <View style={styles.envCard}>
            {renderFiveIconProgress(environmentData.treeEquivalent, 1, 'leaf')}
            <Text style={styles.envInfoLine}>{environmentData.treeEquivalent}그루 / {environmentData.co2Saved}kg CO₂ 절감</Text>
          </View>

          <View style={styles.envCard}>
            {renderFiveIconProgress(environmentData.coffeeCount, 2, 'cafe')}
            <Text style={styles.envInfoLine}>{environmentData.coffeeCount}잔 / {(myPageData?.total_saved_money || 0).toLocaleString()}원 절약</Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 40,
  },
  loadingLogo: {
    width: 160,
    height: 100,
    marginBottom: 30,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Cafe24',
    color: '#2c3e50',
    fontWeight: '600',
  },
  welcomeHeader: {
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 5,
    paddingHorizontal: 15,
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Cafe24',
    color: '#ffffff',
    marginVertical: 6,
  },
  welcomeSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  gradeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    minWidth: 90,
  },
  gradeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  gradeText: {
    fontSize: 12,
    fontFamily: 'Cafe24',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  noticeContainer: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeTitle: {
    fontSize: 16,
    fontFamily: 'Cafe24',
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  noticeCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: width - 40,
    borderWidth: 2,
    borderColor: '#FFE0B2',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 6,
  },
  lastNoticeCard: {
    marginRight: 0,
  },
  noticeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  noticeCardTitle: {
    fontSize: 14,
    fontFamily: 'Cafe24',
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 4,
    position: 'relative',
    zIndex: 1,
  },
  noticeContent: {
    fontSize: 13,
    color: '#F57C00',
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 18,
    position: 'relative',
    zIndex: 1,
  },
  noticeDate: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '500',
    position: 'relative',
    zIndex: 1,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cafe24',
    color: '#2c3e50',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },
  environmentContainer: {
    paddingHorizontal: 20,
  },
  environmentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  envCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  envHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  envTitle: {
    fontSize: 12,
    fontFamily: 'Cafe24',
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  envValue: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  visualSection: {
    marginBottom: 4,
  },
  visualLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  visualContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginVertical: 6,
  },
  visualIcon: {
    fontSize: 16,
  },
  moreText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginRight: 6,
  },
  iconRowContainer: {
    flexDirection: 'row',
  },
  envInfoLine: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
});