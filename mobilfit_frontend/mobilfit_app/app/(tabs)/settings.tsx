import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../contexts/AuthContext";

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const { setUser } = useAuth();

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
            await SecureStore.deleteItemAsync("accessToken");
            await SecureStore.deleteItemAsync("refreshToken");
            setUser(null);
            router.replace("/auth/login");
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#52C41A', '#73D13D']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Ionicons name="settings" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>설정</Text>
          <Text style={styles.headerSubtitle}>앱 환경을 개인화하세요</Text>
        </View>
      </LinearGradient>

      {/* Settings Sections */}
      <View style={styles.sectionsContainer}>
        
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 관리</Text>
          
          <TouchableOpacity
            onPress={() => router.push("/settings/change-password")}
            style={styles.settingItem}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FFF7E6' }]}>
                <Ionicons name="key-outline" size={20} color="#FA8C16" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>비밀번호 변경</Text>
                <Text style={styles.settingDescription}>보안을 위해 주기적으로 변경하세요</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#F6FFED' }]}>
                <Ionicons name="person-outline" size={20} color="#52C41A" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>프로필 수정</Text>
                <Text style={styles.settingDescription}>닉네임 및 개인정보 변경</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FFF2F0' }]}>
                <Ionicons name="trash-outline" size={20} color="#FF4D4F" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>회원 탈퇴</Text>
                <Text style={styles.settingDescription}>계정을 영구적으로 삭제합니다</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
          </TouchableOpacity>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 설정</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#E6F7FF' }]}>
                <Ionicons name="notifications-outline" size={20} color="#1890FF" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>알림 설정</Text>
                <Text style={styles.settingDescription}>푸시 알림 및 소리 설정</Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <View style={styles.switchContainer}>
                <View style={styles.switchOn}>
                  <View style={styles.switchKnob} />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FFF7E6' }]}>
                <Ionicons name="map-outline" size={20} color="#FA8C16" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>지도 설정</Text>
                <Text style={styles.settingDescription}>지도 스타일 및 표시 옵션</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#F9F0FF' }]}>
                <Ionicons name="language-outline" size={20} color="#722ED1" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>언어 설정</Text>
                <Text style={styles.settingDescription}>한국어</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
          </TouchableOpacity>
        </View>

        {/* Data & Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>데이터 및 개인정보</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#F6FFED' }]}>
                <Ionicons name="analytics-outline" size={20} color="#52C41A" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>데이터 사용량</Text>
                <Text style={styles.settingDescription}>앱 데이터 사용 현황 확인</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push("/settings/conditions")}
            style={styles.settingItem}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#E6F7FF' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#1890FF" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>개인정보 처리방침</Text>
                <Text style={styles.settingDescription}>개인정보 보호 정책 확인</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>고객 지원</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FFF7E6' }]}>
                <Ionicons name="help-circle-outline" size={20} color="#FA8C16" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>도움말</Text>
                <Text style={styles.settingDescription}>자주 묻는 질문 및 사용법</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#E6F7FF' }]}>
                <Ionicons name="chatbubble-outline" size={20} color="#1890FF" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>문의하기</Text>
                <Text style={styles.settingDescription}>1:1 문의 및 피드백 보내기</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#F6FFED' }]}>
                <Ionicons name="information-circle-outline" size={20} color="#52C41A" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>앱 정보</Text>
                <Text style={styles.settingDescription}>버전 1.0.0</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E9AAF" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MobilFit v1.0.0</Text>
          <Text style={styles.footerSubText}>친환경 자전거 네비게이션</Text>
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
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  sectionsContainer: {
    paddingHorizontal: 24,
    marginTop: -10,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    marginLeft: 4,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6C757D',
    fontWeight: '500',
  },
  settingRight: {
    marginLeft: 12,
  },
  switchContainer: {
    marginRight: 8,
  },
  switchOn: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#52C41A',
    justifyContent: 'center',
    paddingHorizontal: 2,
    alignItems: 'flex-end',
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FF4D4F',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
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