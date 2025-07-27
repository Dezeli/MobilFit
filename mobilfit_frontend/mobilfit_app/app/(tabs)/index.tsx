import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect, useRouter } from "expo-router";
import { apiPost, apiGet } from "../../lib/api";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { isAuthenticated, isLoading, user, logout: clearAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated) {
        setDataLoading(false);
        return;
      }

      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (!accessToken) {
          console.log("액세스 토큰이 없습니다");
          setDataLoading(false);
          return;
        }

        console.log("API 호출 시작");
        const res = await apiGet("/api/v1/auth/user/mypage/", accessToken);
        console.log("API 응답:", res);
        
        if (res && res.data && res.data.result) {
          setUserData(res.data.result);
          console.log("사용자 데이터 설정 완료:", res.data.result);
        }
      } catch (error: any) {
        console.log("사용자 데이터 가져오기 실패:", error);
        console.log("에러 상세:", error.message);
      } finally {
        setDataLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated]);

  if (isLoading || dataLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="bicycle" size={60} color="#52C41A" />
        <Text style={styles.loadingText}>MobilFit 로딩 중...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  const handleLogout = async () => {
    Alert.alert(
      "로그아웃",
      "정말 로그아웃하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "로그아웃",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const refreshToken = await SecureStore.getItemAsync("refreshToken");

              if (refreshToken) {
                await apiPost("/api/v1/auth/logout/", { refresh: refreshToken });
              }

              await SecureStore.deleteItemAsync("accessToken");
              await SecureStore.deleteItemAsync("refreshToken");

              clearAuth();
            } catch (error: any) {
              Alert.alert("에러", error.message || "로그아웃 실패");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Header */}
      <LinearGradient
        colors={['#52C41A', '#73D13D']}
        style={styles.welcomeHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.welcomeContent}>
          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>안녕하세요!</Text>
            <Text style={styles.userName}>{userData?.nickname || user?.nickname || '라이더'}님</Text>
            <Text style={styles.welcomeSubtext}>오늘도 친환경 라이딩 준비되셨나요?</Text>
          </View>
          <View style={styles.weatherCard}>
            <Ionicons name="sunny" size={24} color="#FFA940" />
            <Text style={styles.weatherText}>22°C</Text>
            <Text style={styles.weatherDesc}>라이딩 좋음</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.quickStatsContainer}>
        <Text style={styles.sectionTitle}>오늘의 현황</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#52C41A', '#73D13D']}
              style={styles.statIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="bicycle" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.statValue}>{userData?.ride_score || 0} 점</Text>
            <Text style={styles.statLabel}>주행 점수</Text>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#FA8C16', '#FF7875']}
              style={styles.statIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="leaf" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.statValue}>
              {userData ? Math.round((userData.total_saved_money / 1500) * 2.3) : 2.3}kg
            </Text>
            <Text style={styles.statLabel}>CO₂ 절약</Text>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#1890FF', '#40A9FF']}
              style={styles.statIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="wallet" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.statValue}>
              {userData?.total_saved_money ? userData.total_saved_money.toLocaleString() : '12,500'}원
            </Text>
            <Text style={styles.statLabel}>절약 금액</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>빠른 메뉴</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient
              colors={['#52C41A', '#73D13D']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="navigate" size={32} color="#FFFFFF" />
              <Text style={styles.actionTitle}>경로 찾기</Text>
              <Text style={styles.actionDesc}>자전거 도로 안내</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient
              colors={['#FA8C16', '#FF7875']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="location" size={32} color="#FFFFFF" />
              <Text style={styles.actionTitle}>근처 정거장</Text>
              <Text style={styles.actionDesc}>대여소 찾기</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient
              colors={['#1890FF', '#40A9FF']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="analytics" size={32} color="#FFFFFF" />
              <Text style={styles.actionTitle}>라이딩 기록</Text>
              <Text style={styles.actionDesc}>통계 보기</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient
              colors={['#722ED1', '#B37FEB']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="people" size={32} color="#FFFFFF" />
              <Text style={styles.actionTitle}>커뮤니티</Text>
              <Text style={styles.actionDesc}>라이더 모임</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentActivityContainer}>
        <Text style={styles.sectionTitle}>최근 활동</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Ionicons name="time-outline" size={20} color="#52C41A" />
            <Text style={styles.activityTitle}>
              {userData?.app_usage_count > 0 ? `${userData.app_usage_count}회 앱 사용` : '아직 기록이 없습니다'}
            </Text>
          </View>
          <Text style={styles.activityDesc}>
            {userData?.app_usage_count > 0 ? '꾸준한 라이딩으로 환경을 지켜주셔서 감사합니다!' : '첫 라이딩을 시작해보세요!'}
          </Text>
          <TouchableOpacity style={styles.startRidingButton}>
            <Text style={styles.startRidingText}>라이딩 시작하기</Text>
            <Ionicons name="arrow-forward" size={16} color="#52C41A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Environmental Impact */}
      <View style={styles.environmentContainer}>
        <Text style={styles.sectionTitle}>환경 기여도</Text>
        <View style={styles.environmentCard}>
          <View style={styles.environmentHeader}>
            <Ionicons name="earth" size={32} color="#52C41A" />
            <View style={styles.environmentContent}>
              <Text style={styles.environmentTitle}>이번 주 환경 보호 효과</Text>
              <Text style={styles.environmentDesc}>자전거로 지구를 지켜주셔서 감사합니다!</Text>
            </View>
          </View>
          <View style={styles.environmentStats}>
            <View style={styles.envStat}>
              <Text style={styles.envStatValue}>
                {userData ? Math.round((userData.total_saved_money / 1500) * 2.3 * 7) : 15.2}kg
              </Text>
              <Text style={styles.envStatLabel}>CO₂ 절약</Text>
            </View>
            <View style={styles.envStat}>
              <Text style={styles.envStatValue}>
                {userData ? Math.round(userData.app_usage_count * 0.8) : 3.8}L
              </Text>
              <Text style={styles.envStatLabel}>연료 절약</Text>
            </View>
            <View style={styles.envStat}>
              <Text style={styles.envStatValue}>
                {userData ? Math.round(userData.app_usage_count * 3.2) : 25}km
              </Text>
              <Text style={styles.envStatLabel}>친환경 이동</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Emergency Logout (Hidden) */}
      <View style={styles.hiddenSection}>
        <TouchableOpacity
          onPress={handleLogout}
          disabled={loading}
          style={styles.hiddenLogoutButton}
        >
          <Text style={styles.hiddenLogoutText}>
            {loading ? "로그아웃 중..." : "로그아웃"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#52C41A',
    fontWeight: '600',
  },
  welcomeHeader: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  weatherCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  weatherText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  weatherDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginTop: 2,
  },
  quickStatsContainer: {
    paddingHorizontal: 24,
    marginTop: -10,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
    textAlign: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 72) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  recentActivityContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 8,
  },
  activityDesc: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
    lineHeight: 20,
  },
  startRidingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6FFED',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D9F7BE',
  },
  startRidingText: {
    color: '#52C41A',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  environmentContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  environmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  environmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  environmentContent: {
    marginLeft: 12,
    flex: 1,
  },
  environmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  environmentDesc: {
    fontSize: 13,
    color: '#6C757D',
    fontWeight: '500',
  },
  environmentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  envStat: {
    alignItems: 'center',
  },
  envStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#52C41A',
    marginBottom: 4,
  },
  envStatLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  hiddenSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  hiddenLogoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  hiddenLogoutText: {
    fontSize: 12,
    color: '#ADB5BD',
    fontWeight: '500',
  },
});