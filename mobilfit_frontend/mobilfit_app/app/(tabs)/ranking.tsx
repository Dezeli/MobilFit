import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect } from "expo-router";
import { apiGet } from "../../lib/api";
import { formatTime } from "../../lib/utils";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from "expo-secure-store";

const { width } = Dimensions.get('window');

type PeriodType = 'today' | 'month' | 'all';
type RankingType = 'distance' | 'max_distance' | 'count' | 'total_time' | 'max_time';

export default function RankingScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('today');
  const [selectedRanking, setSelectedRanking] = useState<RankingType>('distance');
  const [selectedRankingIndex, setSelectedRankingIndex] = useState(0);
  const [rankingData, setRankingData] = useState<any>(null);
  const [myRank, setMyRank] = useState<any>(null);
  const [myData, setMyData] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const periodOptions = [
    { key: 'today', label: '오늘', icon: 'today' },
    { key: 'month', label: '이번 달', icon: 'calendar' },
    { key: 'all', label: '전체', icon: 'trophy' },
  ];

  const rankingTypes = [
    { key: 'distance', label: '총 거리', icon: 'speedometer', unit: 'km', color: '#4CAF50' },
    { key: 'max_distance', label: '최장 거리', icon: 'trending-up', unit: 'km', color: '#2196F3' },
    { key: 'count', label: '라이딩 횟수', icon: 'flag', unit: '회', color: '#FF9800' },
    { key: 'total_time', label: '총 시간', icon: 'time', unit: '초', color: '#9C27B0' },
    { key: 'max_time', label: '최장 시간', icon: 'timer', unit: '초', color: '#E91E63' },
  ];

  const changeRankingType = (direction: 'left' | 'right') => {
    let newIndex = selectedRankingIndex;
    
    if (direction === 'right' && selectedRankingIndex < rankingTypes.length - 1) {
      newIndex = selectedRankingIndex + 1;
    } else if (direction === 'left' && selectedRankingIndex > 0) {
      newIndex = selectedRankingIndex - 1;
    }
    
    if (newIndex !== selectedRankingIndex) {
      setSelectedRankingIndex(newIndex);
      setSelectedRanking(rankingTypes[newIndex].key as RankingType);
    }
  };

  const fetchRankingData = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (!accessToken) {
        return;
      }

      try {
        const meRes = await apiGet("/api/v1/auth/me/", accessToken);
        setUserInfo(meRes?.data?.result || meRes?.data || {});
      } catch (error) {
        setUserInfo({});
      }

      try {
        const myPageRes = await apiGet("/api/v1/auth/user/mypage/", accessToken);
        setMyData(myPageRes?.data?.result || myPageRes?.data || {});
      } catch (error) {
        setMyData({});
      }

      try {
        const rankingRes = await apiGet(`/api/v1/auth/rankings/?period=${selectedPeriod}`, accessToken);
        const rankingResult = rankingRes?.data?.result || rankingRes?.data || {};
        setRankingData(rankingResult);
      } catch (rankingError) {
        setRankingData({});
      }

      try {
        const myRankRes = await apiGet(`/api/v1/auth/me/rank/?period=${selectedPeriod}`, accessToken);
        setMyRank(myRankRes?.data?.result || myRankRes?.data || {});
      } catch (myRankError) {
        setMyRank({});
      }

    } catch (error) {
      setMyRank({});
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setDataLoading(true);
      fetchRankingData();
    }
  }, [isAuthenticated, selectedPeriod]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRankingData();
    setRefreshing(false);
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '초') {
      return formatTime(value);
    }
    if (unit === 'km') {
      return `${value.toFixed(1)}${unit}`;
    }
    return `${value}${unit}`;
  };


  const isMyRanking = (nickname: string) => {
    return userInfo?.nickname && nickname === userInfo.nickname;
  };

  if (isLoading || dataLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>랭킹 정보 로딩 중...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  const currentRankingType = rankingTypes[selectedRankingIndex];
  const myCurrentRank = myRank?.ranks?.[selectedRanking]?.rank || null;
  const myCurrentValue = myRank?.ranks?.[selectedRanking]?.value || 0;

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
            <Text style={styles.userName}>당신의 기록을 확인해보세요!</Text>
            <Text style={styles.welcomeSubtext}>최고의 라이더는 누구일까요?</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.selectionContainer}>
        <View style={styles.periodSection}>
          <Text style={[styles.sectionTitle, {marginBottom:15}]}>기간 선택</Text>
          <View style={styles.periodButtons}>
            {periodOptions.map((period) => (
              <TouchableOpacity
                key={period.key}
                onPress={() => setSelectedPeriod(period.key as PeriodType)}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.key && styles.periodButtonActive
                ]}
              >
                <Ionicons 
                  name={period.icon as any} 
                  size={16} 
                  color={selectedPeriod === period.key ? "#FFFFFF" : "#4CAF50"} 
                />
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {rankingData && currentRankingType && (
        <View style={styles.rankingContainer}>
          <View style={styles.rankingHeaderContainer}>
            <View style={styles.rankingTitleContainer}>
              <TouchableOpacity
                onPress={() => changeRankingType('left')}
                style={[
                  styles.arrowButton,
                  selectedRankingIndex === 0 && styles.arrowButtonDisabled
                ]}
                disabled={selectedRankingIndex === 0}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={20} 
                  color={selectedRankingIndex === 0 ? "#ccc" : "#4CAF50"} 
                />
              </TouchableOpacity>

              <View style={styles.titleWrapper}>
                <Text style={styles.sectionTitle}>{currentRankingType.label} 순위</Text>
              </View>

              <TouchableOpacity
                onPress={() => changeRankingType('right')}
                style={[
                  styles.arrowButton,
                  selectedRankingIndex === rankingTypes.length - 1 && styles.arrowButtonDisabled
                ]}
                disabled={selectedRankingIndex === rankingTypes.length - 1}
              >
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={selectedRankingIndex === rankingTypes.length - 1 ? "#ccc" : "#4CAF50"} 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dotsContainer}>
              {rankingTypes.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedRankingIndex(index);
                    setSelectedRanking(rankingTypes[index].key as RankingType);
                  }}
                >
                  <View
                    style={[
                      styles.dot,
                      index === selectedRankingIndex && styles.activeDot
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.rankingCard}>
            {(() => {
              const categoryData = rankingData[currentRankingType.key];
              
              if (Array.isArray(categoryData) && categoryData.length > 0) {
                return (
                  <>
                    {categoryData.map((item: any, index: number) => (
                      <View 
                        key={index} 
                        style={[
                          styles.rankingItem,
                          isMyRanking(item.nickname) && styles.myRankingItem
                        ]}
                      >
                        <View style={styles.rankingLeft}>
                          <Text style={styles.rankingRankText}>
                            {item.rank}위
                          </Text>
                          <Text style={[
                            styles.rankingNickname,
                            isMyRanking(item.nickname) && styles.myRankingNickname
                          ]}>
                            {item.nickname}{isMyRanking(item.nickname) && " (나)"}
                          </Text>
                        </View>
                        <Text style={styles.rankingValue}>
                          {formatValue(item.value, currentRankingType.unit)}
                        </Text>
                      </View>
                    ))}

                    {myCurrentRank && (
                      <>
                        <View style={styles.rankingSeparator} />
                        <View style={[styles.rankingItem, styles.myRankingItem, styles.rankingItemLast]}>
                          <View style={styles.rankingLeft}>
                            <Text style={styles.rankingRankText}>
                              {myCurrentRank}위
                            </Text>
                            <Text style={[styles.rankingNickname, styles.myRankingNickname]}>
                              {userInfo?.nickname || "나"} (나)
                            </Text>
                          </View>
                          <Text style={styles.rankingValue}>
                            {formatValue(myCurrentValue, currentRankingType.unit)}
                          </Text>
                        </View>
                      </>
                    )}
                  </>
                );
              } else {
                return (
                  <View style={styles.noDataContainer}>
                    <Ionicons name="information-circle-outline" size={24} color="#8E9AAF" />
                    <Text style={styles.noDataText}>
                      {typeof categoryData === 'string' 
                        ? categoryData 
                        : "이 기간에는 랭킹 데이터가 없습니다"
                      }
                    </Text>
                    {myCurrentRank && (
                      <>
                        <View style={styles.rankingSeparator} />
                        <View style={[styles.rankingItem, styles.myRankingItem, styles.rankingItemLast]}>
                          <View style={styles.rankingLeft}>
                            <Text style={styles.rankingRankText}>
                              {myCurrentRank}위
                            </Text>
                            <Text style={[styles.rankingNickname, styles.myRankingNickname]}>
                              {userInfo?.nickname || "나"} (나)
                            </Text>
                          </View>
                          <Text style={styles.rankingValue}>
                            {formatValue(myCurrentValue, currentRankingType.unit)}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                );
              }
            })()}
          </View>
        </View>
      )}

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
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Cafe24',
    color: '#2c3e50',
    fontWeight: '600',
    marginTop: 12,
  },
  welcomeHeader: {
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  welcomeContent: {
    paddingTop: 5,
    paddingHorizontal: 15,
  },
  greetingSection: {
    alignItems: 'center',
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
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  selectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cafe24',
    color: '#2c3e50',
    textAlign: 'center',
  },
  periodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  periodButtonActive: {
    backgroundColor: '#4CAF50',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  rankingContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  rankingHeaderContainer: {
    marginBottom: 12,
  },
  rankingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  arrowButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  activeDot: {
    backgroundColor: '#4CAF50',
  },
  rankingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rankingItemLast: {
    borderBottomWidth: 0,
  },
  myRankingItem: {
    backgroundColor: '#f8fff8',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  rankingSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankingRankText: {
    fontSize: 14,
    fontFamily: 'Cafe24',
    color: '#2c3e50',
    minWidth: 40,
    marginHorizontal: 12,
  },
  rankingNickname: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  myRankingNickname: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  rankingValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#8E9AAF',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 16,
  },
});