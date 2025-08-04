import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect } from "expo-router";
import { apiGet } from "../../lib/api";
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
        console.log("❌ 액세스 토큰이 없습니다");
        return;
      }

      console.log("🌟 랭킹 API 호출 시작 - period:", selectedPeriod);

      // 사용자 정보 가져오기
      try {
        const meRes = await apiGet("/api/v1/auth/me/", accessToken);
        console.log("🌟 /me/ 응답:", meRes);
        setUserInfo(meRes?.data?.result || meRes?.data || {});
      } catch (error) {
        console.log("사용자 정보 로드 실패:", error);
        setUserInfo({});
      }

      // 마이페이지 데이터 (내 실제 값들)
      try {
        const myPageRes = await apiGet("/api/v1/auth/user/mypage/", accessToken);
        console.log("🌟 /mypage/ 응답:", myPageRes);
        setMyData(myPageRes?.data?.result || myPageRes?.data || {});
      } catch (error) {
        console.log("마이페이지 데이터 로드 실패:", error);
        setMyData({});
      }

      // 전체 랭킹 Top10 데이터
      try {
        const rankingRes = await apiGet(`/api/v1/auth/rankings/?period=${selectedPeriod}`, accessToken);
        console.log("🌟 전체 랭킹 응답:", rankingRes);
        console.log("🌟 전체 랭킹 데이터:", rankingRes?.data);
        const rankingResult = rankingRes?.data?.result || rankingRes?.data || {};
        console.log("🌟 파싱된 랭킹 데이터:", rankingResult);
        setRankingData(rankingResult);
      } catch (rankingError) {
        console.log("❌ 전체 랭킹 API 호출 실패:", rankingError);
        console.log("❌ 에러 상세:", rankingError.message);
        setRankingData({});
      }

      // 내 순위 데이터
      try {
        const myRankRes = await apiGet(`/api/v1/auth/me/rank/?period=${selectedPeriod}`, accessToken);
        console.log("🌟 내 순위 응답:", myRankRes);
        setMyRank(myRankRes?.data?.result || myRankRes?.data || {});
      } catch (myRankError) {
        console.log("❌ 내 순위 API 호출 실패:", myRankError);
        console.log("❌ 에러 상세:", myRankError.message);
        setMyRank({});
      }

    } catch (error) {
      console.log("❌ 랭킹 데이터 로드 실패:", error);
      console.log("❌ 에러 상세:", error.message);
      Alert.alert("오류", `랭킹 데이터를 불러오는데 실패했습니다.\n${error.message}`);
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
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

  const getMyValue = (rankingType: string) => {
    if (!myData) return 0;
    
    switch (rankingType) {
      case 'distance':
        return myData.total_distance_km || 0;
      case 'max_distance':
        return myData.max_distance_km || 0;
      case 'count':
        return myData.ride_count || 0;
      case 'total_time':
        return myData.total_time_seconds || 0;
      case 'max_time':
        return myData.max_time_seconds || 0;
      default:
        return 0;
    }
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
  const myCurrentRank = myRank?.ranks?.[selectedRanking];
  const myCurrentValue = getMyValue(selectedRanking);

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
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

      {/* Period Selection */}
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

      {/* Ranking List */}
      {rankingData && currentRankingType && (
        <View style={styles.rankingContainer}>
          {/* 랭킹 제목과 네비게이션 */}
          <View style={styles.rankingHeaderContainer}>
            <View style={styles.rankingTitleContainer}>
              {/* 왼쪽 화살표 */}
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

              {/* 제목 */}
              <View style={styles.titleWrapper}>
                <Text style={styles.sectionTitle}>{currentRankingType.label} 순위</Text>
              </View>

              {/* 오른쪽 화살표 */}
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
            
            {/* 도트 인디케이터 */}
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
              console.log(`🌟 ${currentRankingType.key} 카테고리 데이터:`, categoryData);
              
              if (Array.isArray(categoryData) && categoryData.length > 0) {
                return (
                  <>
                    {/* Top 10 랭킹 표시 */}
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

                    {/* 내 순위를 항상 맨 밑에 표시 */}
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
                    {/* 데이터가 없어도 내 순위가 있으면 표시 */}
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