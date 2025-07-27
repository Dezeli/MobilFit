import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from "expo-secure-store";
import { apiGet } from "../../lib/api";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get('window');

export default function MyPageScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (!accessToken) throw new Error("로그인이 필요합니다.");

        const res = await apiGet("/api/v1/auth/user/mypage/", accessToken);
        setData(res.data.result);
      } catch (error: any) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="bicycle" size={60} color="#52C41A" />
          <ActivityIndicator size="large" color="#52C41A" style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF4D4F" />
        <Text style={styles.errorText}>데이터를 불러올 수 없습니다.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <LinearGradient
        colors={['#52C41A', '#73D13D']}
        style={styles.profileHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.nickname}>{data.nickname}</Text>
          <Text style={styles.subtitle}>친환경 라이더</Text>
        </View>
        
        {/* Eco Badge */}
        <View style={styles.ecoBadge}>
          <Ionicons name="leaf" size={16} color="#52C41A" />
          <Text style={styles.ecoBadgeText}>ECO</Text>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {/* Ride Score Card */}
        <View style={styles.statCard}>
          <LinearGradient
            colors={['#52C41A', '#73D13D']}
            style={styles.statIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="trophy" size={24} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{data.ride_score} 점</Text>
            <Text style={styles.statLabel}>주행 점수</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statBadgeText}>우수</Text>
          </View>
        </View>

        {/* App Usage Card */}
        <View style={styles.statCard}>
          <LinearGradient
            colors={['#FA8C16', '#FF7875']}
            style={styles.statIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="bicycle" size={24} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{data.app_usage_count} 회</Text>
            <Text style={styles.statLabel}>앱 사용 횟수</Text>
          </View>
          <View style={styles.statProgress}>
            <View style={[styles.progressBar, { width: `${Math.min((data.app_usage_count / 100) * 100, 100)}%` }]} />
          </View>
        </View>

        {/* Money Saved Card */}
        <View style={styles.statCard}>
          <LinearGradient
            colors={['#1890FF', '#40A9FF']}
            style={styles.statIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="wallet" size={24} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{data.total_saved_money.toLocaleString()} 원</Text>
            <Text style={styles.statLabel}>총 절약 금액</Text>
          </View>
          <View style={styles.savingsIndicator}>
            <Ionicons name="trending-up" size={16} color="#52C41A" />
            <Text style={styles.savingsText}>+12%</Text>
          </View>
        </View>
      </View>

      {/* Environmental Impact */}
      <View style={styles.environmentSection}>
        <Text style={styles.sectionTitle}>환경 기여도</Text>
        <View style={styles.environmentCard}>
          <View style={styles.environmentItem}>
            <Ionicons name="leaf-outline" size={32} color="#52C41A" />
            <Text style={styles.environmentValue}>
              {Math.round((data.total_saved_money / 1500) * 2.3)} kg
            </Text>
            <Text style={styles.environmentLabel}>CO₂ 절약</Text>
          </View>
          <View style={styles.environmentDivider} />
          <View style={styles.environmentItem}>
            <Ionicons name="water-outline" size={32} color="#1890FF" />
            <Text style={styles.environmentValue}>
              {Math.round(data.app_usage_count * 0.8)} L
            </Text>
            <Text style={styles.environmentLabel}>연료 절약</Text>
          </View>
          <View style={styles.environmentDivider} />
          <View style={styles.environmentItem}>
            <Ionicons name="earth-outline" size={32} color="#73D13D" />
            <Text style={styles.environmentValue}>
              {Math.round(data.app_usage_count * 3.2)} km
            </Text>
            <Text style={styles.environmentLabel}>친환경 이동</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>빠른 메뉴</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/settings/change-password')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="key-outline" size={24} color="#52C41A" />
            </View>
            <Text style={styles.actionText}>비밀번호 변경</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <Ionicons name="map-outline" size={24} color="#FA8C16" />
            </View>
            <Text style={styles.actionText}>경로 기록</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <Ionicons name="analytics-outline" size={24} color="#1890FF" />
            </View>
            <Text style={styles.actionText}>통계 보기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <Ionicons name="settings-outline" size={24} color="#8E9AAF" />
            </View>
            <Text style={styles.actionText}>설정</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Achievement Badge */}
      <View style={styles.achievementSection}>
        <View style={styles.achievementCard}>
          <LinearGradient
            colors={['#FFD591', '#FFA940']}
            style={styles.achievementBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="medal" size={24} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.achievementContent}>
            <Text style={styles.achievementTitle}>친환경 챔피언</Text>
            <Text style={styles.achievementDescription}>
              이번 달 {data.app_usage_count}회 사용으로 환경 보호에 기여했습니다!
            </Text>
          </View>
        </View>
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
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#FF4D4F',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#52C41A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 24,
    position: 'relative',
  },
  profileContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nickname: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  ecoBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ecoBadgeText: {
    color: '#52C41A',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginTop: -20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  statBadge: {
    backgroundColor: '#F6FFED',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statBadgeText: {
    color: '#52C41A',
    fontSize: 12,
    fontWeight: '600',
  },
  statProgress: {
    width: 60,
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#FA8C16',
    borderRadius: 2,
  },
  savingsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingsText: {
    color: '#52C41A',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  environmentSection: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  environmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  environmentItem: {
    flex: 1,
    alignItems: 'center',
  },
  environmentValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 8,
    marginBottom: 4,
  },
  environmentLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
    textAlign: 'center',
  },
  environmentDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  actionsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: (width - 72) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    textAlign: 'center',
  },
  achievementSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
});