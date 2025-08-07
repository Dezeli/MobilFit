import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect, useRouter } from "expo-router";
import { apiGet, apiPost, API_BASE_URL } from "../../lib/api";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from "expo-secure-store";

const { width } = Dimensions.get('window');

export default function MyPageScreen() {
  const { isAuthenticated, isLoading, setUser } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [myPageData, setMyPageData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchUserData = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (!accessToken) return;

      // 사용자 기본 정보 (닉네임)
      const meRes = await apiGet("/api/v1/auth/me/", accessToken);
      console.log("🌟 /me/ 응답:", meRes);
      setUserInfo(meRes?.data?.result || meRes?.data || {});

      // 마이페이지 데이터 (마지막 사용 시간)
      const myPageRes = await apiGet("/api/v1/auth/user/mypage/", accessToken);
      console.log("🌟 /mypage/ 응답:", myPageRes);
      setMyPageData(myPageRes?.data?.result || myPageRes?.data || {});

    } catch (error) {
      console.log("사용자 정보 로드 실패:", error);
      setUserInfo({});
      setMyPageData({});
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const handleChangePassword = () => {
    router.push("/settings/change-password");
  };

  const handlePrivacyPolicy = () => {
    router.push("/settings/conditions");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "회원 탈퇴",
      "정말로 회원 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴",
          style: "destructive",
          onPress: async () => {
            try {
              const accessToken = await SecureStore.getItemAsync("accessToken");
              const deleteRes = await fetch(`${API_BASE_URL}/api/v1/auth/me/delete/`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              });
              
              if (deleteRes.ok) {
                await SecureStore.deleteItemAsync("accessToken");
                await SecureStore.deleteItemAsync("refreshToken");
                setUser(null);
                Alert.alert("완료", "회원 탈퇴가 완료되었습니다.");
                router.replace("/auth/login");
              } else {
                throw new Error("회원 탈퇴 요청이 실패했습니다.");
              }
            } catch (error: any) {
              Alert.alert("오류", error.message || "회원 탈퇴에 실패했습니다.\nmobilfit5684@gmail.com으로 문의부탁드립니다.");
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "로그아웃",
      "정말 로그아웃하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "로그아웃",
          style: "destructive",
          onPress: async () => {
            try {
              const refreshToken = await SecureStore.getItemAsync("refreshToken");
              if (refreshToken) {
                await apiPost("/api/v1/auth/logout/", { refresh: refreshToken });
              }
              await SecureStore.deleteItemAsync("accessToken");
              await SecureStore.deleteItemAsync("refreshToken");
              setUser(null);
              router.replace("/auth/login");
            } catch (error: any) {
              Alert.alert("오류", error.message || "로그아웃에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

  const getJoinedText = () => {
    if (!userInfo?.date_joined) return "MobilFit과 함께하고 있습니다";
    
    const joinDate = new Date(userInfo.date_joined);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const year = joinDate.getFullYear();
    const month = joinDate.getMonth() + 1;
    const day = joinDate.getDate();
    
    return `${year}년 ${month}월 ${day}일부터 ${diffDays}일째 함께하고 있습니다`;
  };

  if (isLoading || dataLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#52C41A" />
        <Text style={styles.loadingText}>마이페이지 로딩 중...</Text>
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
      {/* Header with 닉네임 */}
      <LinearGradient
        colors={['#52C41A', '#73D13D']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Ionicons name="person-circle" size={40} color="#FFFFFF" />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{userInfo?.nickname || "라이더"}님</Text>
            <Text style={styles.headerEmail}>{userInfo?.email || ""}</Text>
            <Text style={styles.headerSubtext}>{getJoinedText()}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* 앱 사용 정보 */}
      <View style={styles.infoContainer}>
        <View style={styles.sectionTitleContainer}>
          <View style={[styles.sectionIconContainer, { backgroundColor: '#F6FFED' }]}>
            <Ionicons name="analytics-outline" size={24} color="#52C41A" />
          </View>
          <Text style={styles.sectionTitle}>앱 사용 정보</Text>
        </View>
        <View style={styles.infoCard}>
          <View style={[styles.menuIcon, { backgroundColor: '#F6FFED' }]}>
            <Ionicons name="time-outline" size={20} color="#52C41A" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>마지막 사용</Text>
            <Text style={styles.menuDesc}>경로를 탐색한 최신 기록입니다</Text>
          </View>
          <Text style={styles.infoValue}>{myPageData?.last_used_at || "기록 없음"}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("settings/ride-logs")}
          style={styles.menuItem}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#F6FFED' }]}>
              <Ionicons name="bicycle-outline" size={20} color="#52C41A" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>주행 기록</Text>
              <Text style={styles.menuDesc}>나의 라이딩 히스토리를 확인합니다</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
        </TouchableOpacity>
      </View>

      {/* 고객 지원 */}
      <View style={styles.menuContainer}>
        <View style={styles.sectionTitleContainer}>
          <View style={[styles.sectionIconContainer, { backgroundColor: '#E6F7FF' }]}>
            <Ionicons name="help-circle-outline" size={24} color="#1890FF" />
          </View>
          <Text style={styles.sectionTitle}>고객 지원</Text>
        </View>
        <TouchableOpacity
          onPress={handlePrivacyPolicy}
          style={styles.menuItem}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#E6F7FF' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#1890FF" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>이용약관 & 개인정보처리방침</Text>
              <Text style={styles.menuDesc}>약관과 방침을 확인하세요</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/settings/feedback")}
          style={styles.menuItem}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#E6F7FF' }]}>
              <Ionicons name="chatbubble-outline" size={20} color="#1890FF" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>피드백 제출</Text>
              <Text style={styles.menuDesc}>개선 의견을 보내주세요</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
        </TouchableOpacity>
      </View>

      {/* 계정 관리 */}
      <View style={styles.menuContainer}>
        <View style={styles.sectionTitleContainer}>
          <View style={[styles.sectionIconContainer, { backgroundColor: '#FFF7E6' }]}>
            <Ionicons name="settings-outline" size={24} color="#FA8C16" />
          </View>
          <Text style={styles.sectionTitle}>계정 관리</Text>
        </View>
        <TouchableOpacity
          onPress={handleChangePassword}
          style={styles.menuItem}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#FFF7E6' }]}>
              <Ionicons name="key-outline" size={20} color="#FA8C16" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>비밀번호 변경</Text>
              <Text style={styles.menuDesc}>보안을 위해 주기적으로 변경하세요</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={styles.menuItem}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#FFF2F0' }]}>
              <Ionicons name="trash-outline" size={20} color="#FF4D4F" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>회원 탈퇴</Text>
              <Text style={styles.menuDesc}>계정을 영구적으로 삭제합니다</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <LinearGradient
            colors={['#FF4D4F', '#FF7875']}
            style={styles.logoutButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    fontFamily: 'Cafe24',
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
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  headerName: {
    fontSize: 20,
    fontFamily: 'Cafe24',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 8,
  },
  headerEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  infoContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E9AAF',
  },
  menuContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    marginTop: 4,
    marginBottom: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Cafe24',
    color: '#2C3E50',
    paddingBottom: 6,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  menuDesc: {
    fontSize: 13,
    color: '#8E9AAF',
    fontWeight: '500',
  },
  logoutContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  logoutButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF4D4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8E9AAF',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubText: {
    fontSize: 12,
    color: '#ADB5BD',
    fontWeight: '500',
  },
});