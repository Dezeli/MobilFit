import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function LandingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    setCurrentPage(page);
  };

  const renderCard1 = () => (
    <View style={[styles.card, { backgroundColor: '#f8fffe' }]}>
      <View style={styles.decorativeShape}>
        <LinearGradient
          colors={['#52C41A', '#73d13d']}
          style={styles.gradientShape}
        />
      </View>
      
      <View style={styles.comingSoonHeader}>
        <Text style={styles.cardTitle}>스마트 추천과 환경 가치</Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.featureRowItem}>
          <View style={styles.featureImageContainer}>
            <Image 
              source={require('../assets/images/landing1.jpg')} 
              style={styles.featureImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureName}>경로 기반{'\n'}전기자전거 추천</Text>
            <Text 
              style={styles.featureDesc}
              allowFontScaling={false}
            >신호등, 자전거도로, 언덕 정보를 분석하여 가장 효율적인 전기 자전거 브랜드를 추천합니다.</Text>
          </View>
        </View>

        <View style={styles.featureRowItem}>
          <View style={styles.featureContent}>
            <Text style={styles.featureName}>환경/경제{'\n'}기여도 시각화</Text>
            <Text 
              style={styles.featureDesc}
              allowFontScaling={false}
            >내가 달린 거리와 절약한 금액을 바탕으로 친환경 가치를 실감할 수 있어요.</Text>
          </View>
          <View style={styles.featureImageContainer}>
            <Image 
              source={require('../assets/images/landing2.jpg')} 
              style={styles.featureImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderCard2 = () => (
    <View style={[styles.card, { backgroundColor: '#f0f9ff' }]}>
      <View style={styles.decorativeCircle}>
        <LinearGradient
          colors={['#1890ff', '#69c0ff']}
          style={styles.gradientCircle}
        />
      </View>
      
      <View style={styles.decorativeCircle2}>
        <LinearGradient
          colors={['#52C41A', '#73d13d']}
          style={styles.gradientCircle}
        />
      </View>
      
      <View style={styles.decorativeCircle3}>
        <LinearGradient
          colors={['#faad14', '#ffd666']}
          style={styles.gradientCircle}
        />
      </View>
      
      <View style={styles.comingSoonHeader}>
        <Text style={styles.cardTitle}>라이딩 데이터 관리</Text>
      </View>
      
      <View style={styles.featuresContainer}>
        <View style={styles.featureRowItem}>
          <View style={styles.featureImageContainer}>
            <Image 
              source={require('../assets/images/landing3.jpg')} 
              style={styles.featureImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureName}>라이딩 기록 관리</Text>
            <Text 
              style={styles.featureDesc}
              allowFontScaling={false}
            >라이딩 정보를 자동으로 저장하고 거리, 시간, 절약 금액 등을 확인할 수 있어요.</Text>
          </View>
        </View>

        <View style={styles.featureRowItem}>
          <View style={styles.featureContent}>
            <Text style={styles.featureName}>라이딩 랭킹 시스템</Text>
            <Text 
              style={styles.featureDesc}
              allowFontScaling={false}
            >다른 사용자들과 순위를 비교하고 최고의 라이더가 되어보세요.</Text>
          </View>
          <View style={styles.featureImageContainer}>
            <Image 
              source={require('../assets/images/landing4.jpg')} 
              style={styles.featureImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderCard3 = () => (
    <View style={[styles.card, { backgroundColor: '#f6ffed', paddingHorizontal:40,}]}>
      <View style={styles.decorativeWave}>
        <LinearGradient
          colors={['#52C41A', '#95de64']}
          style={styles.gradientWave}
        />
      </View>
      
      <View style={styles.decorativeWave2}>
        <LinearGradient
          colors={['#1890ff', '#69c0ff']}
          style={styles.gradientWave}
        />
      </View>
      
      <View style={styles.decorativeWave3}>
        <LinearGradient
          colors={['#faad14', '#ffd666']}
          style={styles.gradientWave}
        />
      </View>
      
      <Text style={[styles.cardTitle, { marginTop:20,}]}>실제 사용자 후기</Text>
      
      <View style={styles.reviewItem}>
        <View style={styles.ribbonContainer}>
          <View style={[styles.ribbonBadge, { backgroundColor: '#1890ff' }]}>
            <Text style={styles.medalIcon}>🏅</Text>
            <Text style={styles.ribbonText}>편의성</Text>
          </View>
          <View style={styles.ribbonTail} />
        </View>
        <LinearGradient
          colors={['#e6f7ff', '#ffffff']}
          style={styles.reviewGradient}
        >
          <Text style={styles.reviewText}>"교내 이동할 때 어떤 브랜드가 더 저렴한지 한눈에 보여서 정말 편해요!"</Text>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewPersonIcon}>- 👩‍🎓</Text>
            <Text style={styles.reviewName}>대학생 김 ○ ○</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.reviewItem}>
        <View style={styles.ribbonContainer}>
          <View style={[styles.ribbonBadge, { backgroundColor: '#52C41A' }]}>
            <Text style={styles.medalIcon}>🥇</Text>
            <Text style={styles.ribbonText}>경제성</Text>
          </View>
          <View style={styles.ribbonTail} />
        </View>
        <LinearGradient
          colors={['#f6ffed', '#ffffff']}
          style={styles.reviewGradient}
        >
          <Text style={styles.reviewText}>"택시비가 부담스러웠는데, 이제 브랜드별 요금까지 비교해서 정말 알뜰하게 이용해요!"</Text>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewPersonIcon}>- 🧑‍💼</Text>
            <Text style={styles.reviewName}>자취생 박 ☆ ☆</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.reviewItem}>
        <View style={styles.ribbonContainer}>
          <View style={[styles.ribbonBadge, { backgroundColor: '#73d13d' }]}>
            <Text style={styles.medalIcon}>🏆</Text>
            <Text style={styles.ribbonText}>친환경성</Text>
          </View>
          <View style={styles.ribbonTail} />
        </View>
        <LinearGradient
          colors={['#fff2e8', '#ffffff']}
          style={styles.reviewGradient}
        >
          <Text style={styles.reviewText}>"환경도 생각하고 효율적으로 이동할 수 있어서 일석이조예요!"</Text>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewPersonIcon}>- 👨‍💻</Text>
            <Text style={styles.reviewName}>직장인 이 △ △</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );

  const renderCard4 = () => (
    <View style={[styles.card, { backgroundColor: '#fff9f0' }]}>
      <View style={styles.decorativeStar}>
        <LinearGradient
          colors={['#faad14', '#ffd666']}
          style={styles.gradientStar}
        />
      </View>
      
      <View style={styles.decorativeStar2}>
        <LinearGradient
          colors={['#52C41A', '#73d13d']}
          style={styles.gradientStar}
        />
      </View>
      
      <View style={styles.decorativeStar3}>
        <LinearGradient
          colors={['#1890ff', '#69c0ff']}
          style={styles.gradientStar}
        />
      </View>

      <View style={styles.decorativeStar4}>
        <LinearGradient
          colors={['#ff4d4f', '#ff7875']}
          style={styles.gradientStar}
        />
      </View>

      <View style={styles.decorativeStar5}>
        <LinearGradient
          colors={['#722ed1', '#b37feb']}
          style={styles.gradientStar}
        />
      </View>

      <View style={styles.decorativeStar6}>
        <LinearGradient
          colors={['#13c2c2', '#5cdbd3']}
          style={styles.gradientStar}
        />
      </View>
      <View style={styles.decorativeStar7}>
        <LinearGradient
          colors={['#f759ab', '#ffadd6']}
          style={styles.gradientStar}
        />
      </View>

      
      <Image 
        source={require('../assets/images/mobilfit_logo.png')} 
        style={styles.logoInCard}
        resizeMode="contain"
      />
      
      <Text style={styles.cardTitle}>지금 시작해보세요!</Text>
      
      <View style={styles.ctaContent}>
        <Text style={styles.ctaSubtitle}>
          가장 저렴하고 친환경적인{'\n'}
          전기자전거 여행을 시작하세요
        </Text>
        
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={() => router.push("/auth/login")}
        >
          <LinearGradient
            colors={['#52C41A', '#73d13d']}
            style={styles.buttonGradient}
          >
            <Text style={styles.loginButtonText}>로그인하기</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.signupButton} 
          onPress={() => router.push("/auth/signup")}
        >
          <Text style={styles.signupButtonText}>회원가입하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.cardsContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollViewWithBorder}
        >
          {renderCard1()}
          {renderCard2()}
          {renderCard3()}
          {renderCard4()}
        </ScrollView>

        <View style={styles.pageIndicator}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentPage === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push("/settings/conditions")}>
            <Text style={styles.footerText}>약관 및 정책 보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  cardsContainer: {
    flex: 1,
    paddingTop: 100,
    paddingBottom: 60,
  },
  card: {
    width: width,
    flex: 1,
    paddingVertical: 32,
    justifyContent: 'center',
    zIndex: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontFamily: 'Cafe24',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  featureRowItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden',
    height: 170,
  },
  featureImageContainer: {
    width: 150,
    height: 170,
  },
  featureImage: {
    width: '100%',
    height: '100%',
  },
  featureContent: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  comingSoonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  featureName: {
    fontSize: 16,
    fontFamily: 'Cafe24',
    color: '#2c3e50',
    marginBottom: 10,
    marginLeft: 2,
  },
  featureDesc: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#5a6c7d',
    lineHeight: 20,
  },
  reviewItem: {
    marginBottom: 16,
    overflow: 'visible',
  },
  reviewGradient: {
    padding: 20,
    borderRadius: 16,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    paddingLeft: 80,
    marginLeft: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: -2,
  },
  reviewPersonIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  reviewIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  reviewName: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#2c3e50',
  },
  reviewCategory: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#52C41A',
    marginTop: 2,
  },
  reviewText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#5a6c7d',
    lineHeight: 16,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  ribbonContainer: {
    position: 'absolute',
    left: -20,
    top: 16,
    zIndex: 2,
  },
  ribbonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  ribbonTail: {
    position: 'absolute',
    left: 0,
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderLeftColor: 'transparent',
    borderTopWidth: 8,
    borderTopColor: 'rgba(0,0,0,0.2)',
  },
  medalIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  ribbonText: {
    fontSize: 14,
    fontFamily: 'Cafe24',
    color: '#ffffff',
    marginBottom: 2,
  },
  ctaContent: {
    alignItems: 'center',
  },
  ctaSubtitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-Regular',
    color: '#5a6c7d',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  loginButton: {
    borderRadius: 25,
    marginBottom: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 25,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  signupButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#52C41A',
    minWidth: 200,
  },
  signupButtonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#52C41A',
    textAlign: 'center',
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#52C41A',
  },
  inactiveDot: {
    backgroundColor: '#d1d5db',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#9ca3af',
    textDecorationLine: 'underline',
  },
  decorativeShape: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.1,
  },
  gradientShape: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  decorativeCircle: {
    position: 'absolute',
    top: 40,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.15,
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 120,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.12,
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.1,
  },
  gradientCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  decorativeWave: {
    position: 'absolute',
    bottom: -10,
    right: -40,
    width: 120,
    height: 60,
    borderRadius: 30,
    opacity: 0.1,
    transform: [{ rotate: '25deg' }],
  },
  decorativeWave2: {
    position: 'absolute',
    top: 60,
    left: -50,
    width: 80,
    height: 40,
    borderRadius: 20,
    opacity: 0.08,
    transform: [{ rotate: '-15deg' }],
  },
  decorativeWave3: {
    position: 'absolute',
    top: 200,
    right: 10,
    width: 100,
    height: 50,
    borderRadius: 25,
    opacity: 0.12,
    transform: [{ rotate: '45deg' }],
  },
  gradientWave: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  decorativeStar: {
    position: 'absolute',
    top: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.2,
    transform: [{ rotate: '45deg' }],
  },
  decorativeStar2: {
    position: 'absolute',
    top: 120,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.15,
    transform: [{ rotate: '-30deg' }],
  },
  decorativeStar3: {
    position: 'absolute',
    bottom: 80,
    right: -10,
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.18,
    transform: [{ rotate: '60deg' }],
  },
  decorativeStar4: {
    position: 'absolute',
    top: 200,
    left: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.12,
    transform: [{ rotate: '90deg' }],
  },
  decorativeStar5: {
    position: 'absolute',
    bottom: 150,
    left: -30,
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.14,
    transform: [{ rotate: '-45deg' }],
  },
  decorativeStar6: {
    position: 'absolute',
    top: 80,
    right: -25,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    opacity: 0.16,
    transform: [{ rotate: '120deg' }],
  },
  decorativeStar7: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    marginLeft: 10,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    opacity: 0.15,
    transform: [{ rotate: '-60deg' }],
  },
  gradientStar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  scrollViewWithBorder: {
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderColor: '#ffd66630',
  },
  logoInCard: {
    width: 150,
    height: 150,
    alignSelf: 'center',
  },
});