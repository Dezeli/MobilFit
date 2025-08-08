import { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Image, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect, useRouter } from "expo-router";
import { apiPost, apiGet } from "../../lib/api";
import * as SecureStore from "expo-secure-store";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from "react";

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const { isAuthenticated, setUser } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [idFocused, setIdFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loginError, setLoginError] = useState("");

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

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  const handleLogin = async () => {
    setLoginError("");

    if (!loginId || !password) {
      setLoginError("아이디와 비밀번호를 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost("/api/v1/auth/login/", {
        username: loginId,
        password,
      });

      const accessToken = res.data.result.access;
      const refreshToken = res.data.result.refresh;

      await SecureStore.setItemAsync("accessToken", accessToken);
      await SecureStore.setItemAsync("refreshToken", refreshToken);

      const userInfo = await apiGet("/api/v1/auth/me/", accessToken);
      setUser(userInfo);

      router.replace("/(tabs)");
    } catch (error: any) {
      setLoginError(error.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };
  
  const validateId = (id) => {
    return id.trim().length >= 3;
  };

  const isFormValid = loginId && password && validateId(loginId);

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
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/images/mobilfit_logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.formContainer}>
                
                <View style={styles.inputGroup}>
                  <TouchableOpacity 
                    style={[
                      styles.inputContainer,
                      idFocused && styles.inputContainerFocused,
                      loginId && !validateId(loginId) && styles.inputContainerError
                    ]}
                    activeOpacity={1}
                  >
                    <Ionicons 
                      name="person-outline" 
                      size={20} 
                      color={idFocused ? "#52C41A" : "#8E9AAF"} 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="아이디를 입력하세요"
                      placeholderTextColor="#A0A0A0"
                      value={loginId}
                      onChangeText={(text) => {
                        setLoginId(text);
                        if (loginError) setLoginError("");
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onFocus={() => setIdFocused(true)}
                      onBlur={() => setIdFocused(false)}
                      style={styles.textInput}
                    />
                    {loginId && validateId(loginId) && (
                      <Ionicons name="checkmark-circle" size={20} color="#52C41A" />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <TouchableOpacity 
                    style={[
                      styles.inputContainer,
                      passwordFocused && styles.inputContainerFocused
                    ]}
                    activeOpacity={1}
                  >
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color={passwordFocused ? "#52C41A" : "#8E9AAF"} 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="비밀번호를 입력하세요"
                      placeholderTextColor="#A0A0A0"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (loginError) setLoginError("");
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      onSubmitEditing={handleLogin}
                      style={styles.textInput}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-outline" : "eye-off-outline"} 
                        size={20} 
                        color="#8E9AAF" 
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                  {loginId && !validateId(loginId) && (
                    <Text style={styles.errorText}>아이디는 3자 이상 입력하세요</Text>
                  )}
                  {loginError && (
                    <Text style={styles.errorText}>{loginError}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading || !isFormValid}
                  style={[
                    styles.loginButton,
                    (!isFormValid || loading) && styles.loginButtonDisabled
                  ]}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      !isFormValid || loading 
                        ? ['#E0E0E0', '#BDBDBD'] 
                        : ['#52C41A', '#73D13D']
                    }
                    style={styles.loginButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <View style={styles.loadingSpinner} />
                        <Text style={styles.loginButtonText}>로그인 중...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.loginButtonText}>로그인</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>또는</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.linkButtonsContainer}>
                  <TouchableOpacity
                    onPress={() => router.push("/auth/signup")}
                    style={styles.linkButton}
                    activeOpacity={0.7}
                  >
                    <View style={styles.linkButtonContent}>
                      <Ionicons name="person-add-outline" size={18} color="#52C41A" />
                      <Text style={styles.linkButtonText}>아직 계정이 없으신가요? 회원가입</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.actionLinksContainer}>
                    <TouchableOpacity
                      onPress={() => router.push("/auth/find-id")}
                      style={styles.actionLink}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="search-outline" size={16} color="#FA8C16" />
                      <Text style={styles.actionLinkText}>아이디 찾기</Text>
                    </TouchableOpacity>

                    <View style={styles.actionLinkDivider} />

                    <TouchableOpacity 
                      onPress={() => router.push("/auth/reset-password")}
                      style={styles.actionLink}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="key-outline" size={16} color="#FA8C16" />
                      <Text style={styles.actionLinkText}>비밀번호 초기화</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
    paddingTop: height * 0.12,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: width * 0.8,
    height: width * 0.30,
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
    marginBottom: width * 0.25,
  },
  inputGroup: {
    marginBottom: 14,
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
  eyeIcon: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#FF4D4F',
    marginTop: 6,
    fontWeight: '500',
    marginLeft: 2,
  },
  loginButton: {
    marginTop: 10,
    marginBottom: 10,
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
  loginButtonDisabled: {
    shadowColor: '#BDBDBD',
    shadowOpacity: 0.1,
    elevation: 2,
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
    marginVertical: 14,
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
    color: '#52C41A',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'center',
  },
  actionLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  actionLinkText: {
    color: '#FA8C16',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  actionLinkDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 16,
  },
});