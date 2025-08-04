import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect, useRouter } from "expo-router";
import { apiGet } from "../../lib/api";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from "expo-secure-store";

const { width } = Dimensions.get('window');

export default function RideLogsScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [rideLogs, setRideLogs] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchRideLogs = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (!accessToken) return;

      // 주행 기록 리스트 가져오기
      try {
        const logsRes = await apiGet("/api/v1/auth/rides/list/", accessToken);
        console.log("🌟 주행 기록 응답:", logsRes);
        const logs = logsRes?.data?.result || logsRes?.data || [];
        setRideLogs(logs);
      } catch (error) {
        console.log("❌ 주행 기록 API 호출 실패:", error);
        setRideLogs([]);
      }

    } catch (error) {
      console.log("❌ 주행 기록 로드 실패:", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRideLogs();
    }
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRideLogs();
    setRefreshing(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${month}/${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  if (isLoading || dataLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#52C41A" />
        <Text style={styles.loadingText}>주행 기록 로딩 중...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#52C41A', '#73D13D']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="bicycle" size={32} color="#FFFFFF" />
            <Text style={styles.headerTitle}>주행 기록</Text>
            <Text style={styles.headerSubtitle}>나의 라이딩 히스토리</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Ride Logs List */}
      <View style={styles.logsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>주행 기록 목록</Text>
          <Text style={styles.sectionSubtext}>최근 2주간의 기록을 제공합니다</Text>
        </View>
        
        {rideLogs.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="bicycle-outline" size={48} color="#8E9AAF" />
            <Text style={styles.noDataTitle}>최근 2주간 주행 기록이 없습니다</Text>
            <Text style={styles.noDataText}>첫 번째 라이딩을 시작해보세요!</Text>
          </View>
        ) : (
          rideLogs.map((log, index) => (
            <View key={index} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logDate}>
                  <Ionicons name="calendar-outline" size={16} color="#52C41A" />
                  <Text style={styles.logDateText}>
                    {log.created_at}
                  </Text>
                </View>
                {log.provider && (
                  <View style={styles.providerBadge}>
                    <Text style={styles.providerText}>{log.provider}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.logStats}>
                <View style={styles.logStat}>
                  <Ionicons name="speedometer-outline" size={16} color="#1890FF" />
                  <Text style={styles.logStatLabel}>거리</Text>
                  <Text style={styles.logStatValue}>{log.distance_km?.toFixed(1) || 0}km</Text>
                </View>
                
                <View style={styles.logStat}>
                  <Ionicons name="time-outline" size={16} color="#FA8C16" />
                  <Text style={styles.logStatLabel}>시간</Text>
                  <Text style={styles.logStatValue}>{log.duration_display || formatTime(log.duration_seconds || 0)}</Text>
                </View>
                
                <View style={styles.logStat}>
                  <Ionicons name="wallet-outline" size={16} color="#52C41A" />
                  <Text style={styles.logStatLabel}>절약</Text>
                  <Text style={styles.logStatValue}>{(log.saved_money || 0).toLocaleString()}원</Text>
                </View>
                
                <View style={styles.logStat}>
                  <Ionicons name="trending-up-outline" size={16} color="#722ED1" />
                  <Text style={styles.logStatLabel}>평균 속도</Text>
                  <Text style={styles.logStatValue}>
                    {log.distance_km && log.duration_seconds 
                      ? ((log.distance_km / (log.duration_seconds / 3600))).toFixed(1)
                      : 0
                    }km/h
                  </Text>
                </View>
              </View>
              
              <View style={styles.logTime}>
                <Text style={styles.logTimeText}>
                  {formatDateTime(log.started_at)} - {formatDateTime(log.ended_at)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
    marginTop: 12,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  logsContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 14,
    color: '#8E9AAF',
    fontWeight: '500',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#8E9AAF',
    fontWeight: '500',
    textAlign: 'center',
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 6,
  },
  providerBadge: {
    backgroundColor: '#F6FFED',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#D9F7BE',
  },
  providerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52C41A',
  },
  logStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  logStat: {
    alignItems: 'center',
    flex: 1,
  },
  logStatLabel: {
    fontSize: 11,
    color: '#8E9AAF',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 2,
  },
  logStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  logTime: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  logTimeText: {
    fontSize: 12,
    color: '#8E9AAF',
    fontWeight: '500',
    textAlign: 'center',
  },
});