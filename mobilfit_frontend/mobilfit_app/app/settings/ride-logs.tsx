import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert, ActivityIndicator, RefreshControl, SafeAreaView, StatusBar } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect, useRouter } from "expo-router";
import { apiGet } from "../../lib/api";
import { formatTime } from "../../lib/utils";
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

      try {
        const logsRes = await apiGet("/api/v1/auth/rides/list/", accessToken);
        const logs = logsRes?.data?.result || logsRes?.data || [];
        setRideLogs(logs);
      } catch (error) {
        setRideLogs([]);
      }

    } catch (error) {
      setDataLoading(false);
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>주행 기록</Text>
          <Text style={styles.documentDate}>최근 2주간의 기록을 제공합니다</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        <View style={styles.introContainer}>
          <Text style={styles.introText}>
            최근 2주간 {rideLogs.length}회의 주행 기록이 있습니다.
          </Text>
        </View>

        <View style={styles.contentContainer}>
          {rideLogs.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Ionicons name="bicycle-outline" size={48} color="#8E9AAF" />
              <Text style={styles.noDataTitle}>최근 2주간 주행 기록이 없습니다</Text>
              <Text style={styles.noDataText}>첫 번째 라이딩을 시작해보세요!</Text>
            </View>
          ) : (
            <View style={styles.recordsContainer}>
              {rideLogs.map((log, index) => (
                <View key={index} style={[styles.recordCard, { borderLeftWidth: 4, borderLeftColor: '#52C41A' }]}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordTitleContainer}>
                      <Ionicons name="bicycle-outline" size={20} color="#52C41A" style={styles.recordHeaderIcon} />
                      <View style={styles.recordTitleInfo}>
                        <Text style={styles.recordTitle}>라이딩 #{rideLogs.length - index}</Text>
                        <Text style={styles.recordDate}>{log.created_at}</Text>
                      </View>
                    </View>
                    {log.provider && (
                      <View style={styles.providerBadge}>
                        <Text style={styles.providerText}>{log.provider}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.recordStats}>
                    <View style={styles.recordStat}>
                      <Ionicons name="speedometer-outline" size={16} color="#1890FF" style={styles.recordIcon}/>
                      <View style={styles.statContent}>
                        <Text style={styles.statLabel}>거리</Text>
                        <Text style={styles.statValue}>{log.distance_km?.toFixed(1) || 0}km</Text>
                      </View>
                    </View>
                    
                    <View style={styles.recordStat}>
                      <Ionicons name="time-outline" size={16} color="#FA8C16" style={styles.recordIcon}/>
                      <View style={styles.statContent}>
                        <Text style={styles.statLabel}>시간</Text>
                        <Text style={styles.statValue}>{log.duration_display || formatTime(log.duration_seconds || 0)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.recordStat}>
                      <Ionicons name="wallet-outline" size={16} color="#52C41A" style={styles.recordIcon}/>
                      <View style={styles.statContent}>
                        <Text style={styles.statLabel}>절약</Text>
                        <Text style={styles.statValue}>{(log.saved_money || 0).toLocaleString()}원</Text>
                      </View>
                    </View>
                    
                    <View style={styles.recordStat}>
                      <Ionicons name="trending-up-outline" size={16} color="#722ED1" style={styles.recordIcon}/>
                      <View style={styles.statContent}>
                        <Text style={styles.statLabel}>평균 속도</Text>
                        <Text style={styles.statValue}>
                          {log.distance_km && log.duration_seconds 
                            ? ((log.distance_km / (log.duration_seconds / 3600))).toFixed(1)
                            : 0
                          }km/h
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.recordTimeContainer}>
                    <Text style={styles.recordTimeText}>
                      {formatDateTime(log.started_at)} - {formatDateTime(log.ended_at)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#2C3E50',
    fontFamily: 'Cafe24',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Cafe24',
    color: '#2C3E50',
  },
  headerText: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  documentTitle: {
    fontSize: 20,
    fontFamily: 'Cafe24',
    color: '#2C3E50',
    marginTop: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  documentDate: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  introContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: '#F6FFED',
  },
  introText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
    textAlign: 'center',
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
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
  recordsContainer: {
    paddingHorizontal: 20,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  recordTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordHeaderIcon: {
    marginRight: 16,
  },
  recordIcon: {
    marginRight: 8,
  },
  recordTitleInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 13,
    color: '#8E9AAF',
    fontWeight: '500',
  },
  recordStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recordStat: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E9AAF',
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  recordTimeContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  recordTimeText: {
    fontSize: 12,
    color: '#8E9AAF',
    fontWeight: '500',
    textAlign: 'center',
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
});