import { useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, StatusBar, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function TermsPrivacyScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' or 'privacy'

  const handleTabPress = (tab: 'terms' | 'privacy') => {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };


  const renderTermsContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.headerSection}>
        <Ionicons name="document-text" size={32} color="#52C41A" />
        <Text style={styles.documentTitle}>모빌핏 이용약관</Text>
        <Text style={styles.documentDate}>최종 수정일: 2025년 8월 1일</Text>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>제1조 (목적)</Text>
        <Text style={styles.articleContent}>
          이 약관은 모빌리티메이트(이하 "회사")가 제공하는 '모빌핏' 앱 이용과 관련하여 회사와 회원 간의 권리, 의무, 책임사항을 규정합니다.
        </Text>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>제2조 (회원가입 및 자격)</Text>
        <View style={styles.bulletContainer}>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>회원은 이메일, 비밀번호, 닉네임으로 가입합니다.</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>만 14세 미만은 법정대리인의 동의가 필요합니다.</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>허위 정보 입력, 타인 정보 도용 시 계정이 제한될 수 있습니다.</Text>
          </View>
        </View>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>제3조 (서비스 내용)</Text>
        <View style={styles.bulletContainer}>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>모빌핏은 위치 기반 전기자전거 요금 비교, 지도 정보 등을 제공합니다.</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>일부 정보는 외부 API로부터 수집되며 정확성이나 실시간성은 보장되지 않을 수 있습니다.</Text>
          </View>
        </View>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>제4조 (회원의 의무)</Text>
        <View style={styles.bulletContainer}>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>관련 법령 및 약관 준수</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>타인의 권리를 침해하거나 시스템을 방해하는 행위 금지</Text>
          </View>
        </View>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>제5조 (계정 탈퇴 및 삭제)</Text>
        <View style={styles.bulletContainer}>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>사용자는 언제든지 탈퇴 가능하며 탈퇴 시 개인정보는 즉시 파기됩니다.</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>단, 관련 법령에 따라 일부 정보는 보관될 수 있습니다.</Text>
          </View>
        </View>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>제6조 (서비스 변경 및 중단)</Text>
        <View style={styles.bulletContainer}>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>회사는 사전 공지를 통해 서비스 일부를 변경 또는 중단할 수 있습니다.</Text>
          </View>
        </View>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>제7조 (책임의 제한)</Text>
        <View style={styles.bulletContainer}>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>회사는 고의 또는 중대한 과실이 없는 한, 서비스 이용 중 발생한 손해에 대해 책임지지 않습니다.</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>요금 정보나 위치 정보는 100% 실시간 반영되지 않을 수 있습니다.</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPrivacyContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.headerSection}>
        <Ionicons name="shield-checkmark" size={32} color="#1890FF" />
        <Text style={styles.documentTitle}>모빌핏 개인정보처리방침</Text>
        <Text style={styles.documentDate}>시행일자: 2025년 7월 26일</Text>
      </View>

      <View style={styles.introContainer}>
        <Text style={styles.introText}>
          모빌리티메이트(이하 "회사")는 개인정보 보호법 등 관련 법령을 준수하며, 회원님의 개인정보를 안전하게 보호하고자 아래와 같은 처리방침을 운영합니다.
        </Text>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>1. 수집하는 개인정보 항목</Text>
        <View style={styles.subSection}>
          <Text style={styles.subTitle}>필수항목</Text>
          <View style={styles.bulletContainer}>
            <View style={styles.bulletItem}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>이메일, 비밀번호, 닉네임</Text>
            </View>
          </View>
        </View>
        <View style={styles.subSection}>
          <Text style={styles.subTitle}>자동수집항목</Text>
          <View style={styles.bulletContainer}>
            <View style={styles.bulletItem}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>이용기록, 접속로그, 기기정보</Text>
            </View>
          </View>
        </View>
        <View style={styles.subSection}>
          <Text style={styles.subTitle}>선택항목</Text>
          <View style={styles.bulletContainer}>
            <View style={styles.bulletItem}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>위치정보 (서비스 이용 시 동의 필요)</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>2. 개인정보 수집 및 이용 목적</Text>
        <View style={styles.bulletContainer}>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>회원가입 및 로그인</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>요금 비교 및 지도 기반 위치 정보 제공</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>맞춤형 서비스 및 통계 분석</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>부정 이용 방지</Text>
          </View>
        </View>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>3. 보유 및 이용 기간</Text>
        <View style={styles.bulletContainer}>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>회원 탈퇴 시까지</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>법령에 따라 보관이 필요한 경우 예외</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>거래기록: 5년</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>접속기록: 3개월</Text>
          </View>
        </View>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>4. 제3자 제공</Text>
        <Text style={styles.articleContent}>
          회사는 이용자의 사전 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 법령에 따른 제공은 예외입니다.
        </Text>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>5. 위탁 처리</Text>
        <Text style={styles.articleContent}>
          서비스 제공을 위해 외부 업체에 위탁할 수 있으며, 위탁 시 고지 및 동의를 받습니다.
        </Text>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>6. 이용자의 권리</Text>
        <View style={styles.bulletContainer}>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>개인정보 조회, 수정, 삭제, 처리정지 요청 가능</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>이메일: mobilfit5684@gmail.com 또는 앱 내 설정 메뉴 이용</Text>
          </View>
        </View>
      </View>

      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>7. 위치정보 수집</Text>
        <View style={styles.bulletContainer}>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>위치기반 기능은 별도 동의 후 활성화</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>위치정보는 전기자전거 요금/위치 안내에만 사용</Text>
          </View>
        </View>
      </View>

      <View style={styles.contactContainer}>
        <Text style={styles.contactTitle}>개인정보 보호책임자</Text>
        <View style={styles.contactInfo}>
          <Text style={styles.contactText}>연락처: mobilfit5684@gmail.com</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>약관 및 정책</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => handleTabPress('terms')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={activeTab === 'terms' ? ['#52C41A', '#73D13D'] : ['transparent', 'transparent']}
            style={styles.tabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons 
              name="document-text-outline" 
              size={20} 
              color={activeTab === 'terms' ? '#FFFFFF' : '#8E9AAF'} 
            />
            <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
              이용약관
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
          onPress={() => handleTabPress('privacy')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={activeTab === 'privacy' ? ['#1890FF', '#40A9FF'] : ['transparent', 'transparent']}
            style={styles.tabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons 
              name="shield-checkmark-outline" 
              size={20} 
              color={activeTab === 'privacy' ? '#FFFFFF' : '#8E9AAF'} 
            />
            <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
              개인정보처리방침
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        ref={scrollRef}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'terms' ? renderTermsContent() : renderPrivacyContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 36,
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
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  activeTab: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#8E9AAF',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 50,
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
  articleContainer: {
    paddingHorizontal: 40,
    paddingVertical: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 14,
  },
  articleContent: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
    marginBottom: 5,
  },
  bulletContainer: {
    marginTop: 2,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#52C41A',
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    flex: 1,
  },
  subSection: {
    marginTop: 0,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  contactContainer: {
    backgroundColor: '#F6FFED',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#52C41A',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#52C41A',
    marginBottom: 12,
  },
  contactInfo: {
    gap: 6,
  },
  contactText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
});