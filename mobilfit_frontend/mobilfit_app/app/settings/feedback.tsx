import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, TextInput, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect, useRouter } from "expo-router";
import { apiPost } from "../../lib/api";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from "expo-secure-store";

export default function FeedbackScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [feedbackText, setFeedbackText] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const router = useRouter();

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert("알림", "피드백 내용을 입력해주세요.");
      return;
    }

    setSendingFeedback(true);
    try {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      await apiPost("/api/v1/auth/feedback/", { message: feedbackText }, accessToken);
      
      Alert.alert("완료", "피드백이 성공적으로 전송되었습니다.", [
        {
          text: "확인",
          onPress: () => {
            setFeedbackText("");
            router.back();
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert("오류", "피드백 전송에 실패했습니다.");
    } finally {
      setSendingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#52C41A" />
        <Text style={styles.loadingText}>로딩 중...</Text>
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
          <Text style={styles.headerTitle}>피드백 보내기</Text>
          <Text style={styles.documentDate}>여러분의 소중한 피드백을 기다립니다</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          <View style={styles.introContainer}>
            <Text style={styles.introText}>
              이런 피드백을 기다려요 !
            </Text>
            <View>
              <View style={styles.categoryRow}>
                <View style={styles.categoryItem}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#F6FFED' }]}>
                    <Ionicons name="bug-outline" size={14} color="#FF4D4F" />
                  </View>
                  <Text style={styles.categoryText}>버그 및 오류 신고</Text>
                </View>
                <View style={styles.categoryItem}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#F6FFED' }]}>
                    <Ionicons name="megaphone-outline" size={14} color="#FA8C16" />
                  </View>
                  <Text style={styles.categoryText}>새로운 기능 제안</Text>
                </View>
              </View>
              <View style={styles.categoryRow}>
                <View style={styles.categoryItem}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#F6FFED' }]}>
                    <Ionicons name="trending-up-outline" size={14} color="#1890FF" />
                  </View>
                  <Text style={styles.categoryText}>사용성 개선 의견</Text>
                </View>
                <View style={styles.categoryItem}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#F6FFED' }]}>
                    <Ionicons name="heart-outline" size={14} color="#52C41A" />
                  </View>
                  <Text style={styles.categoryText}>서비스 칭찬 및 응원</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>피드백 내용</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder={`개선 의견이나 버그 리포트를 자세히 작성해주세요.

예시:
• 지도 경로 위치가 부정확해요
• 요금 정보가 실시간으로 업데이트되지 않아요
• 새로운 기능을 제안하고 싶어요`}
                placeholderTextColor="#8E9AAF"
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline={true}
                numberOfLines={8}
                textAlignVertical="top"
                maxLength={1000}
              />
              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>
                  {feedbackText.length} / 1000자
                </Text>
              </View>
            </View>

            <View style={styles.buttonSection}>
              <TouchableOpacity
                onPress={handleSendFeedback}
                disabled={sendingFeedback || !feedbackText.trim()}
                style={[
                  styles.sendButton,
                  (!feedbackText.trim() || sendingFeedback) && styles.sendButtonDisabled
                ]}
              >
                <LinearGradient
                  colors={
                    !feedbackText.trim() || sendingFeedback 
                      ? ['#E0E0E0', '#BDBDBD'] 
                      : ['#52C41A', '#73D13D']
                  }
                  style={styles.sendButtonGradient}
                >
                  {sendingFeedback ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.sendButtonText}>전송 중...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="send" size={16} color="#FFFFFF" />
                      <Text style={styles.sendButtonText}>피드백 전송</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
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
    paddingVertical: 20,
    marginBottom: 16,
    backgroundColor: '#E6F7FF',
  },
  introText: {
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  categoryItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Cafe24',
    color: '#2C3E50',
    marginTop: 8,
    marginLeft: 12,
    marginBottom: 18,
  },
  feedbackInput: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    minHeight: 200,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: '#8E9AAF',
    fontWeight: '500',
  },
  buttonSection: {
    marginTop: 0,
  },
  sendButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#52C41A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});