import { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Image, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from "react-native";
import { useRouter, Stack } from "expo-router";
import { apiPost } from "../../lib/api";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get('window');

export default function ChangePasswordScreen() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPasswordFocused, setCurrentPasswordFocused] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  
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

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateConfirmPassword = (confirmPassword) => {
    return confirmPassword === newPassword && newPassword.length >= 6;
  };

  const clearErrors = () => {
    if (errorMessage) setErrorMessage("");
  };

  const handleChangePassword = async () => {
    setErrorMessage("");
    
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      setErrorMessage("모든 항목을 입력하세요.");
      return;
    }

    if (!validatePassword(newPassword)) {
      setErrorMessage("새 비밀번호는 6자 이상 입력하세요.");
      return;
    }

    if (!validateConfirmPassword(newPasswordConfirm)) {
      setErrorMessage("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }

      await apiPost(
        "/api/v1/auth/change-password/",
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        accessToken
      );

      setSuccessMessage("비밀번호가 성공적으로 변경되었습니다!");
      setErrorMessage("");
      
      // 성공 후 3초 뒤 뒤로가기
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = currentPassword && newPassword && newPasswordConfirm && 
                     validatePassword(newPassword) && 
                     validateConfirmPassword(newPasswordConfirm);

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
                <Text style={styles.pageTitle}>비밀번호 변경</Text>
                <Text style={styles.pageSubtitle}>보안을 위해 새로운 비밀번호로 변경하세요</Text>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.formContainer}>
                
                {successMessage ? (
                  /* Success View */
                  <View style={styles.successContainer}>
                    <View style={styles.successIconContainer}>
                      <Ionicons name="checkmark-circle" size={60} color="#52C41A" />
                    </View>
                    
                    <Text style={styles.successTitle}>변경 완료!</Text>
                    <Text style={styles.successSubtitle}>{successMessage}</Text>
                    
                    <View style={styles.infoContainer}>
                      <Ionicons name="information-circle-outline" size={20} color="#FA8C16" />
                      <Text style={styles.infoText}>잠시 후 이전 화면으로 돌아갑니다</Text>
                    </View>
                  </View>
                ) : (
                  /* Change Password Form */
                  <>
                    {/* Current Password Input */}
                    <View style={styles.inputGroup}>
                      <TouchableOpacity 
                        style={[
                          styles.inputContainer,
                          currentPasswordFocused && styles.inputContainerFocused
                        ]}
                        activeOpacity={1}
                      >
                        <Ionicons 
                          name="lock-closed-outline" 
                          size={20} 
                          color={currentPasswordFocused ? "#52C41A" : "#8E9AAF"} 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          placeholder="이전 비밀번호"
                          placeholderTextColor="#A0A0A0"
                          value={currentPassword}
                          onChangeText={(text) => {
                            setCurrentPassword(text);
                            clearErrors();
                          }}
                          secureTextEntry={!showCurrentPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onFocus={() => setCurrentPasswordFocused(true)}
                          onBlur={() => setCurrentPasswordFocused(false)}
                          style={styles.textInput}
                        />
                        <TouchableOpacity
                          onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                          style={styles.eyeIcon}
                          activeOpacity={0.7}
                        >
                          <Ionicons 
                            name={showCurrentPassword ? "eye-outline" : "eye-off-outline"} 
                            size={20} 
                            color="#8E9AAF" 
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    </View>

                    {/* New Password Input */}
                    <View style={styles.inputGroup}>
                      <TouchableOpacity 
                        style={[
                          styles.inputContainer,
                          newPasswordFocused && styles.inputContainerFocused,
                          newPassword && !validatePassword(newPassword) && styles.inputContainerError
                        ]}
                        activeOpacity={1}
                      >
                        <Ionicons 
                          name="key-outline" 
                          size={20} 
                          color={newPasswordFocused ? "#52C41A" : "#8E9AAF"} 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          placeholder="새 비밀번호"
                          placeholderTextColor="#A0A0A0"
                          value={newPassword}
                          onChangeText={(text) => {
                            setNewPassword(text);
                            clearErrors();
                          }}
                          secureTextEntry={!showNewPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onFocus={() => setNewPasswordFocused(true)}
                          onBlur={() => setNewPasswordFocused(false)}
                          style={styles.textInput}
                        />
                        <TouchableOpacity
                          onPress={() => setShowNewPassword(!showNewPassword)}
                          style={styles.eyeIcon}
                          activeOpacity={0.7}
                        >
                          <Ionicons 
                            name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                            size={20} 
                            color="#8E9AAF" 
                          />
                        </TouchableOpacity>
                        {newPassword && validatePassword(newPassword) && (
                          <Ionicons name="checkmark-circle" size={20} color="#52C41A" style={styles.passwordCheck} />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Confirm New Password Input */}
                    <View style={styles.inputGroup}>
                      <TouchableOpacity 
                        style={[
                          styles.inputContainer,
                          confirmPasswordFocused && styles.inputContainerFocused,
                          newPasswordConfirm && !validateConfirmPassword(newPasswordConfirm) && styles.inputContainerError
                        ]}
                        activeOpacity={1}
                      >
                        <Ionicons 
                          name="key-outline" 
                          size={20} 
                          color={confirmPasswordFocused ? "#52C41A" : "#8E9AAF"} 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          placeholder="새 비밀번호 확인"
                          placeholderTextColor="#A0A0A0"
                          value={newPasswordConfirm}
                          onChangeText={(text) => {
                            setNewPasswordConfirm(text);
                            clearErrors();
                          }}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onFocus={() => setConfirmPasswordFocused(true)}
                          onBlur={() => setConfirmPasswordFocused(false)}
                          onSubmitEditing={handleChangePassword}
                          style={styles.textInput}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeIcon}
                          activeOpacity={0.7}
                        >
                          <Ionicons 
                            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                            size={20} 
                            color="#8E9AAF" 
                          />
                        </TouchableOpacity>
                        {newPasswordConfirm && validateConfirmPassword(newPasswordConfirm) && (
                          <Ionicons name="checkmark-circle" size={20} color="#52C41A" />
                        )}
                      </TouchableOpacity>
                      {errorMessage && (
                        <Text style={styles.errorText}>{errorMessage}</Text>
                      )}
                    </View>

                    {/* Change Password Button */}
                    <TouchableOpacity
                      onPress={handleChangePassword}
                      disabled={loading || !isFormValid}
                      style={[
                        styles.changeButton,
                        (!isFormValid || loading) && styles.changeButtonDisabled
                      ]}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={
                          !isFormValid || loading 
                            ? ['#E0E0E0', '#BDBDBD'] 
                            : ['#52C41A', '#73D13D']
                        }
                        style={styles.changeButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {loading ? (
                          <View style={styles.loadingContainer}>
                            <View style={styles.loadingSpinner} />
                            <Text style={styles.changeButtonText}>변경 중...</Text>
                          </View>
                        ) : (
                          <View style={styles.buttonContent}>
                            <Text style={styles.changeButtonText}>비밀번호 변경</Text>
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {/* Security Info */}
                {!successMessage && (
                  <View style={styles.securityInfoContainer}>
                    <View style={styles.securityInfo}>
                      <Ionicons name="shield-checkmark-outline" size={18} color="#52C41A" />
                      <Text style={styles.securityInfoText}>보안을 위해 정기적인 비밀번호 변경을 권장합니다</Text>
                    </View>
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
    fontWeight: 'bold',
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
    marginBottom: width * 0.25,
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
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7E6',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FA8C16',
  },
  infoText: {
    color: '#FA8C16',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
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
  passwordCheck: {
    marginRight: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF4D4F',
    marginTop: 6,
    fontWeight: '500',
    marginLeft: 2,
  },
  changeButton: {
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
  changeButtonDisabled: {
    shadowColor: '#BDBDBD',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  changeButtonGradient: {
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
  changeButtonText: {
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
  securityInfoContainer: {
    marginTop: 10,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6FFED',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#52C41A',
  },
  securityInfoText: {
    color: '#52C41A',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
});