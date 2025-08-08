import { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Image, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { apiPost } from "../../lib/api";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from "react";

const { width, height } = Dimensions.get('window');

export default function FindIdScreen() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const [email, setEmail] = useState("");
  const [foundUsername, setFoundUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      },
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFindId = async () => {
    setErrorMessage("");
    
    if (!email) {
      setErrorMessage("이메일을 입력하세요.");
      return;
    }
    
    if (!validateEmail(email)) {
      setErrorMessage("올바른 이메일 형식을 입력하세요.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiPost("/api/v1/auth/find-id/", { email });

      if (res.data?.result?.masked_username) {
        setFoundUsername(res.data.result.masked_username);
        setErrorMessage("");
      } else {
        setErrorMessage("아이디를 찾을 수 없습니다.");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "아이디 찾기에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email && validateEmail(email);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={keyboardVisible ? styles.scrollContainerWithKeyboard : styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          scrollEnabled={keyboardVisible}
        >
          <View style={styles.container}>
            <View style={styles.headerSection}>
              <TouchableOpacity 
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#2C3E50" />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/images/mobilfit_logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              
              <View style={styles.titleContainer}>
                <Text style={styles.pageTitle}>아이디 찾기</Text>
                <Text style={styles.pageSubtitle}>가입 시 사용한 이메일을 입력하세요</Text>
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.formContainer}>
                
                {foundUsername ? (
                  <View style={styles.successContainer}>
                    <View style={styles.successIconContainer}>
                      <Ionicons name="checkmark-circle" size={60} color="#52C41A" />
                    </View>
                    
                    <Text style={styles.successTitle}>아이디를 찾았습니다!</Text>
                    <Text style={styles.successSubtitle}>가입하신 아이디:</Text>
                    
                    <View style={styles.foundIdContainer}>
                      <Text style={styles.foundIdText}>{foundUsername}</Text>
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => router.replace("/auth/login")}
                      style={styles.loginButton}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#52C41A', '#73D13D']}
                        style={styles.loginButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <View style={styles.buttonContent}>
                          <Text style={styles.loginButtonText}>로그인 화면으로 이동</Text>
                          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <TouchableOpacity 
                        style={[
                          styles.inputContainer,
                          emailFocused && styles.inputContainerFocused,
                          email && !validateEmail(email) && styles.inputContainerError
                        ]}
                        activeOpacity={1}
                      >
                        <Ionicons 
                          name="mail-outline" 
                          size={20} 
                          color={emailFocused ? "#52C41A" : "#8E9AAF"} 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          placeholder="가입 시 이메일을 입력하세요"
                          placeholderTextColor="#A0A0A0"
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                            if (errorMessage) setErrorMessage("");
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => setEmailFocused(false)}
                          onSubmitEditing={handleFindId}
                          style={styles.textInput}
                        />
                        {email && validateEmail(email) && (
                          <Ionicons name="checkmark-circle" size={20} color="#52C41A" />
                        )}
                      </TouchableOpacity>
                      {email && !validateEmail(email) && (
                        <Text style={styles.errorText}>올바른 이메일 형식을 입력하세요</Text>
                      )}
                      {errorMessage && (
                        <Text style={styles.errorText}>{errorMessage}</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={handleFindId}
                      disabled={loading || !isFormValid}
                      style={[
                        styles.findButton,
                        (!isFormValid || loading) && styles.findButtonDisabled
                      ]}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={
                          !isFormValid || loading 
                            ? ['#E0E0E0', '#BDBDBD'] 
                            : ['#52C41A', '#73D13D']
                        }
                        style={styles.findButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {loading ? (
                          <View style={styles.loadingContainer}>
                            <View style={styles.loadingSpinner} />
                            <Text style={styles.findButtonText}>찾는 중...</Text>
                          </View>
                        ) : (
                          <View style={styles.buttonContent}>
                            <Text style={styles.findButtonText}>아이디 찾기</Text>
                            <Ionicons name="search" size={20} color="#FFFFFF" />
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {!foundUsername && (
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>다른 옵션</Text>
                    <View style={styles.dividerLine} />
                  </View>
                )}

                {!foundUsername && (
                  <View style={styles.linkButtonsContainer}>
                    <TouchableOpacity
                      onPress={() => router.push("/auth/reset-password")}
                      style={styles.linkButton}
                      activeOpacity={0.7}
                    >
                      <View style={styles.linkButtonContent}>
                        <Ionicons name="key-outline" size={18} color="#FA8C16" />
                        <Text style={styles.linkButtonText}>비밀번호를 잊으셨나요? 초기화</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => router.push("/auth/signup")}
                      style={styles.signupLinkButton}
                      activeOpacity={0.7}
                    >
                      <View style={styles.linkButtonContent}>
                        <Ionicons name="person-add-outline" size={18} color="#52C41A" />
                        <Text style={styles.signupLinkButtonText}>아직 계정이 없으신가요? 회원가입</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    height: height,
  },
  scrollContainerWithKeyboard: {
    flexGrow: 1,
    minHeight: height,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerSection: {
    paddingTop: height * 0.10,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: height * 0.06 + 10,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: width * 0.6,
    height: width * 0.24,
  },
  titleContainer: {
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: 'Cafe24',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    fontWeight: '500',
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 27,
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: width * 0.30,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#52C41A',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 20,
    textAlign: 'center',
  },
  foundIdContainer: {
    backgroundColor: '#F6FFED',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D9F7BE',
    width: '100%',
    alignItems: 'center',
  },
  foundIdText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#52C41A',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    height: 52,
  },
  inputContainerFocused: {
    borderColor: '#52C41A',
    backgroundColor: '#FFFFFF',
    shadowColor: '#52C41A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  inputContainerError: {
    borderColor: '#FF4D4F',
    backgroundColor: '#FFF7F7',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '500',
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#FF4D4F',
    marginTop: 6,
    fontWeight: '500',
    marginLeft: 2,
  },
  findButton: {
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#52C41A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  findButtonDisabled: {
    shadowColor: '#BDBDBD',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  findButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#52C41A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  findButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#FFFFFF',
    marginRight: 10,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    fontSize: 14,
    color: '#8E9AAF',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  linkButtonsContainer: {
    gap: 14,
  },
  linkButton: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#FFD591',
    height: 50,
    justifyContent: 'center',
  },
  signupLinkButton: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F6FFED',
    borderWidth: 1,
    borderColor: '#D9F7BE',
    height: 50,
    justifyContent: 'center',
  },
  linkButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    color: '#FA8C16',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'center',
  },
  signupLinkButtonText: {
    color: '#52C41A',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'center',
  },
});