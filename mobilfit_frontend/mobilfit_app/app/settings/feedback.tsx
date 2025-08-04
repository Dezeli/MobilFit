import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { apiPost } from "../../lib/api";

export default function FeedbackScreen() {
  const [content, setContent] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("내용을 입력해주세요");
      return;
    }
    try {
      await apiPost("/feedback/", { content });
      Alert.alert("피드백이 성공적으로 제출되었습니다");
      setContent("");
      router.back();
    } catch (error: any) {
      console.error(error);
      Alert.alert("피드백 제출에 실패했습니다");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>피드백을 남겨주세요</Text>
      <TextInput
        style={styles.textInput}
        placeholder="불편한 점이나 제안하고 싶은 기능이 있다면 입력해주세요"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={6}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>제출하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  textInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#52C41A",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
