import { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Image, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { apiPost } from "../../lib/api";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from "react";

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
  const router = useRouter();
  const scrollViewRef = useRef(null);

  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [allTermsAgreed, setAllTermsAgreed] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [nicknameFocused, setNicknameFocused] = useState(false);
  
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const validateUsername = (username) => {
    return username.trim().length >= 3;
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateConfirmPassword = (confirmPassword) => {
    return confirmPassword === password && password.length >= 6;
  };

  const validateNickname = (nickname) => {
    return nickname.trim().length >= 2;
  };

  const validateCode = (code) => {
    return code.trim().length >= 4;
  };

  const clearErrors = () => {
    if (errorMessage) setErrorMessage("");
  };

  // 인증 코드 전송
  const handleSendCode = async () => {
    setErrorMessage("");
    
    if (!email) {
      setErrorMessage("이메일을 입력하세요.");
      return;
    }
    
    if (!validateEmail(email)) {
      setErrorMessage("올바른 이메일 형식을 입력하세요.");
      return;
    }
    
    setSending(true);
    try {
      await apiPost("/api/v1/auth/email-verify/send/", { email });
      setCodeSent(true);
      setSuccessMessage("인증 코드가 이메일로 전송되었습니다.");
      setErrorMessage("");
    } catch (error: any) {
      setErrorMessage(error.message || "인증 코드 전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  // 인증 코드 확인
  const handleVerifyCode = async () => {
    setErrorMessage("");
    
    if (!emailCode) {
      setErrorMessage("인증 코드를 입력하세요.");
      return;
    }
    
    if (!validateCode(emailCode)) {
      setErrorMessage("인증 코드를 확인해주세요.");
      return;
    }
    
    setVerifying(true);
    try {
      await apiPost("/api/v1/auth/email-verify/confirm/", {
        email,
        code: emailCode,
      });
      setEmailVerified(true);
      setSuccessMessage("이메일 인증이 완료되었습니다.");
      setErrorMessage("");
    } catch (error: any) {
      setErrorMessage(error.message || "인증에 실패했습니다.");
    } finally {
      setVerifying(false);
    }
  };

  // 회원가입
  const handleSignup = async () => {
    setErrorMessage("");
    
    if (!allTermsAgreed) {
      setErrorMessage("이용약관 및 개인정보처리방침에 동의해주세요.");
      return;
    }
    
    if (!emailVerified) {
      setErrorMessage("이메일 인증을 완료해주세요.");
      return;
    }
    
    if (!username || !password || !confirmPassword || !nickname) {
      setErrorMessage("모든 항목을 입력하세요.");
      return;
    }
    
    if (!validateUsername(username)) {
      setErrorMessage("아이디는 3자 이상 입력하세요.");
      return;
    }
    
    if (!validatePassword(password)) {
      setErrorMessage("비밀번호는 6자 이상 입력하세요.");
      return;
    }
    
    if (!validateConfirmPassword(confirmPassword)) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }
    
    if (!validateNickname(nickname)) {
      setErrorMessage("닉네임은 2자 이상 입력하세요.");
      return;
    }
    
    setLoading(true);
    try {
      await apiPost("/api/v1/auth/signup/", {
        username,
        password,
        nickname,
        email,
      });
      setSuccessMessage("회원가입이 완료되었습니다!");
      setTimeout(() => {
        router.replace("/auth/login");
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = allTermsAgreed && emailVerified && username && password && confirmPassword && nickname && 
                     validateUsername(username) && 
                     validatePassword(password) && 
                     validateConfirmPassword(confirmPassword) &&
                     validateNickname(nickname);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          scrollEnabled={true}
        >
          <View style={styles.container}>
            {/* Header Section */}
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
                <Text style={styles.pageTitle}>회원가입</Text>
                <Text style={styles.pageSubtitle}>새로운 계정을 만들어 시작하세요</Text>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.formContainer}>
                
                {/* Success Message */}
                {successMessage && (
                  <View style={styles.successMessageContainer}>
                    <Ionicons name="checkmark-circle" size={18} color="#52C41A" />
                    <Text style={styles.successMessageText}>{successMessage}</Text>
                  </View>
                )}

                {/* Email Section */}
                <View style={styles.sectionContainer}>
                  
                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <TouchableOpacity 
                      style={[
                        styles.inputContainer,
                        emailFocused && styles.inputContainerFocused,
                        email && !validateEmail(email) && styles.inputContainerError,
                        emailVerified && styles.inputContainerSuccess
                      ]}
                      activeOpacity={1}
                    >
                      <Ionicons 
                        name="mail-outline" 
                        size={18} 
                        color={emailVerified ? "#52C41A" : emailFocused ? "#52C41A" : "#8E9AAF"} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        placeholder="이메일"
                        placeholderTextColor="#A0A0A0"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          clearErrors();
                        }}
                        editable={!emailVerified}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        style={[styles.textInput, emailVerified && styles.textInputDisabled]}
                      />
                      {emailVerified && (
                        <Ionicons name="checkmark-circle" size={18} color="#52C41A" />
                      )}
                    </TouchableOpacity>
                    {/* Email 에러 메시지 */}
                    {errorMessage && !codeSent && (
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    )}
                  </View>

                  {!emailVerified && (
                    <>
                      {/* Send Code Button */}
                      <TouchableOpacity
                        onPress={handleSendCode}
                        disabled={sending || !email || !validateEmail(email)}
                        style={[
                          styles.verifyButton,
                          (sending || !email || !validateEmail(email)) && styles.verifyButtonDisabled
                        ]}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={
                            sending || !email || !validateEmail(email)
                              ? ['#E0E0E0', '#BDBDBD'] 
                              : ['#FA8C16', '#FF7875']
                          }
                          style={styles.verifyButtonGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          {sending ? (
                            <View style={styles.loadingContainer}>
                              <View style={styles.loadingSpinner} />
                              <Text style={styles.verifyButtonText}>전송 중...</Text>
                            </View>
                          ) : (
                            <View style={styles.buttonContent}>
                              <Text style={styles.verifyButtonText}>인증 코드 보내기</Text>
                              <Ionicons name="send" size={16} color="#FFFFFF" />
                            </View>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Verification Code Input - 코드 전송 성공 시에만 표시 */}
                      {codeSent && (
                        <>
                          <View style={styles.inputGroup}>
                            <TouchableOpacity 
                              style={[
                                styles.inputContainer,
                                codeFocused && styles.inputContainerFocused,
                                emailCode && !validateCode(emailCode) && styles.inputContainerError
                              ]}
                              activeOpacity={1}
                            >
                              <Ionicons 
                                name="shield-checkmark-outline" 
                                size={18} 
                                color={codeFocused ? "#52C41A" : "#8E9AAF"} 
                                style={styles.inputIcon}
                              />
                              <TextInput
                                placeholder="인증 코드"
                                placeholderTextColor="#A0A0A0"
                                value={emailCode}
                                onChangeText={(text) => {
                                  setEmailCode(text);
                                  clearErrors();
                                }}
                                keyboardType="numeric"
                                returnKeyType="done"
                                onFocus={() => setCodeFocused(true)}
                                onBlur={() => setCodeFocused(false)}
                                onSubmitEditing={handleVerifyCode}
                                style={styles.textInput}
                              />
                              {emailCode && validateCode(emailCode) && (
                                <Ionicons name="checkmark-circle" size={18} color="#52C41A" />
                              )}
                            </TouchableOpacity>
                            {/* 인증 코드 에러 메시지 */}
                            {errorMessage && codeSent && (
                              <Text style={styles.errorText}>{errorMessage}</Text>
                            )}
                          </View>

                          {/* Verify Code Button */}
                          <TouchableOpacity
                            onPress={handleVerifyCode}
                            disabled={verifying || !emailCode || !validateCode(emailCode)}
                            style={[
                              styles.confirmButton,
                              (verifying || !emailCode || !validateCode(emailCode)) && styles.confirmButtonDisabled
                            ]}
                            activeOpacity={0.8}
                          >
                            <LinearGradient
                              colors={
                                verifying || !emailCode || !validateCode(emailCode)
                                  ? ['#E0E0E0', '#BDBDBD'] 
                                  : ['#52C41A', '#73D13D']
                              }
                              style={styles.confirmButtonGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                            >
                              {verifying ? (
                                <View style={styles.loadingContainer}>
                                  <View style={styles.loadingSpinner} />
                                  <Text style={styles.confirmButtonText}>확인 중...</Text>
                                </View>
                              ) : (
                                <View style={styles.buttonContent}>
                                  <Text style={styles.confirmButtonText}>인증 확인</Text>
                                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                </View>
                              )}
                            </LinearGradient>
                          </TouchableOpacity>
                        </>
                      )}
                    </>
                  )}
                </View>

                {/* Account Info Section */}
                <View style={styles.sectionContainer}>
                  
                  {/* Username Input */}
                  <View style={styles.inputGroup}>
                    <TouchableOpacity 
                      style={[
                        styles.inputContainer,
                        usernameFocused && styles.inputContainerFocused,
                        username && !validateUsername(username) && styles.inputContainerError
                      ]}
                      activeOpacity={1}
                    >
                      <Ionicons 
                        name="person-outline" 
                        size={18} 
                        color={usernameFocused ? "#52C41A" : "#8E9AAF"} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        placeholder="아이디"
                        placeholderTextColor="#A0A0A0"
                        value={username}
                        onChangeText={(text) => {
                          setUsername(text);
                          clearErrors();
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        onFocus={() => setUsernameFocused(true)}
                        onBlur={() => setUsernameFocused(false)}
                        style={styles.textInput}
                      />
                      {username && validateUsername(username) && (
                        <Ionicons name="checkmark-circle" size={18} color="#52C41A" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <TouchableOpacity 
                      style={[
                        styles.inputContainer,
                        passwordFocused && styles.inputContainerFocused,
                        password && !validatePassword(password) && styles.inputContainerError
                      ]}
                      activeOpacity={1}
                    >
                      <Ionicons 
                        name="lock-closed-outline" 
                        size={18} 
                        color={passwordFocused ? "#52C41A" : "#8E9AAF"} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        placeholder="비밀번호"
                        placeholderTextColor="#A0A0A0"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          clearErrors();
                        }}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        style={styles.textInput}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                          size={18} 
                          color="#8E9AAF" 
                        />
                      </TouchableOpacity>
                      {password && validatePassword(password) && (
                        <Ionicons name="checkmark-circle" size={18} color="#52C41A" style={styles.passwordCheck} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.inputGroup}>
                    <TouchableOpacity 
                      style={[
                        styles.inputContainer,
                        confirmPasswordFocused && styles.inputContainerFocused,
                        confirmPassword && !validateConfirmPassword(confirmPassword) && styles.inputContainerError
                      ]}
                      activeOpacity={1}
                    >
                      <Ionicons 
                        name="lock-closed-outline" 
                        size={18} 
                        color={confirmPasswordFocused ? "#52C41A" : "#8E9AAF"} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        placeholder="비밀번호 확인"
                        placeholderTextColor="#A0A0A0"
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          clearErrors();
                        }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        onFocus={() => setConfirmPasswordFocused(true)}
                        onBlur={() => setConfirmPasswordFocused(false)}
                        style={styles.textInput}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-outline" : "eye-off-outline"} 
                          size={18} 
                          color="#8E9AAF" 
                        />
                      </TouchableOpacity>
                      {confirmPassword && validateConfirmPassword(confirmPassword) && (
                        <Ionicons name="checkmark-circle" size={18} color="#52C41A" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Nickname Input */}
                  <View style={styles.inputGroup}>
                    <TouchableOpacity 
                      style={[
                        styles.inputContainer,
                        nicknameFocused && styles.inputContainerFocused,
                        nickname && !validateNickname(nickname) && styles.inputContainerError
                      ]}
                      activeOpacity={1}
                    >
                      <Ionicons 
                        name="person-circle-outline" 
                        size={18} 
                        color={nicknameFocused ? "#52C41A" : "#8E9AAF"} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        placeholder="닉네임"
                        placeholderTextColor="#A0A0A0"
                        value={nickname}
                        onChangeText={(text) => {
                          setNickname(text);
                          clearErrors();
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onFocus={() => setNicknameFocused(true)}
                        onBlur={() => setNicknameFocused(false)}
                        onSubmitEditing={handleSignup}
                        style={styles.textInput}
                      />
                      {nickname && validateNickname(nickname) && (
                        <Ionicons name="checkmark-circle" size={18} color="#52C41A" />
                      )}
                    </TouchableOpacity>
                    {/* 회원가입 관련 에러 메시지 */}
                    {errorMessage && emailVerified && allTermsAgreed && (
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    )}
                  </View>

                  {/* Terms Agreement Section */}
                  <View style={styles.agreementSection}>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => setAllTermsAgreed(!allTermsAgreed)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, allTermsAgreed && styles.checkboxChecked]}>
                        {allTermsAgreed && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                      <View style={styles.agreementTextContainer}>
                        <Text style={styles.agreementText}>
                          <Text style={styles.requiredText}>(필수)</Text> 이용약관 및 개인정보 처리방침에 동의합니다
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => router.push("/settings/conditions")}
                        style={styles.viewButton}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.viewButtonText}>보기</Text>
                        <Ionicons name="chevron-forward" size={14} color="#52C41A" />
                      </TouchableOpacity>
                    </TouchableOpacity>

                    {/* 약관 동의 에러 메시지 */}
                    {errorMessage && !allTermsAgreed && (
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    )}
                  </View>

                  {/* Signup Button */}
                  <TouchableOpacity
                    onPress={handleSignup}
                    disabled={loading || !isFormValid}
                    style={[
                      styles.signupButton,
                      (!isFormValid || loading) && styles.signupButtonDisabled
                    ]}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        !isFormValid || loading 
                          ? ['#E0E0E0', '#BDBDBD'] 
                          : ['#52C41A', '#73D13D']
                      }
                      style={styles.signupButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <View style={styles.loadingSpinner} />
                          <Text style={styles.signupButtonText}>가입 중...</Text>
                        </View>
                      ) : (
                        <View style={styles.buttonContent}>
                          <Text style={styles.signupButtonText}>가입하기</Text>
                          <Ionicons name="person-add" size={18} color="#FFFFFF" />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
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
    flexGrow: 1,
    paddingBottom: 30,
  },
  container: {
    flex: 1,
  },
  headerSection: {
    paddingTop: height * 0.06,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    paddingBottom: 15,
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
    marginBottom: 4,
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
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 4,
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
  },
  successMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6FFED',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#52C41A',
  },
  successMessageText: {
    color: '#52C41A',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 8,
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
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#FF4D4F',
    backgroundColor: '#FFF7F7',
  },
  inputContainerSuccess: {
    borderColor: '#52C41A',
    backgroundColor: '#F6FFED',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    paddingVertical: 0,
  },
  textInputDisabled: {
    color: '#8E9AAF',
  },
  eyeIcon: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordCheck: {
    marginRight: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#FF4D4F',
    marginTop: 4,
    fontWeight: '500',
    marginLeft: 2,
  },
  verifyButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FA8C16',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  verifyButtonDisabled: {
    shadowColor: '#BDBDBD',
    shadowOpacity: 0.1,
    elevation: 1,
  },
  verifyButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
  },
  confirmButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#52C41A',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmButtonDisabled: {
    shadowColor: '#BDBDBD',
    shadowOpacity: 0.1,
    elevation: 1,
  },
  confirmButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
  },
  signupButton: {
    borderRadius: 12,
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
 signupButtonDisabled: {
   shadowColor: '#BDBDBD',
   shadowOpacity: 0.1,
   elevation: 2,
 },
 signupButtonGradient: {
   paddingVertical: 14,
   paddingHorizontal: 20,
   alignItems: 'center',
   justifyContent: 'center',
   height: 46,
 },
 buttonContent: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'center',
 },
 verifyButtonText: {
   color: '#FFFFFF',
   fontSize: 13,
   fontWeight: 'bold',
   marginRight: 6,
 },
 confirmButtonText: {
   color: '#FFFFFF',
   fontSize: 13,
   fontWeight: 'bold',
   marginRight: 6,
 },
 signupButtonText: {
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
   width: 16,
   height: 16,
   borderRadius: 8,
   borderWidth: 2,
   borderColor: 'rgba(255, 255, 255, 0.3)',
   borderTopColor: '#FFFFFF',
   marginRight: 8,
 },
 agreementSection: {
   marginTop: 12,
   paddingVertical: 6,
   borderTopWidth: 1,
   borderTopColor: '#F0F0F0',
 },
 checkboxContainer: {
   flexDirection: 'row',
   alignItems: 'center',
   marginTop: 2,
   marginBottom: 4,
   paddingVertical: 4,
 },
 checkbox: {
   width: 20,
   height: 20,
   borderRadius: 4,
   borderWidth: 2,
   borderColor: '#E5E5E5',
   backgroundColor: '#FFFFFF',
   justifyContent: 'center',
   alignItems: 'center',
   marginRight: 12,
 },
 checkboxChecked: {
   backgroundColor: '#52C41A',
   borderColor: '#52C41A',
 },
 agreementTextContainer: {
   flex: 1,
 },
 agreementText: {
   fontSize: 12,
   color: '#495057',
   fontWeight: '500',
   lineHeight: 14,
 },
 requiredText: {
   color: '#FF4D4F',
   fontWeight: '600',
 },
 viewButton: {
   flexDirection: 'row',
   alignItems: 'center',
   paddingVertical: 4,
   paddingHorizontal: 8,
 },
 viewButtonText: {
   fontSize: 13,
   color: '#52C41A',
   fontWeight: '600',
   marginRight: 2,
 },
});