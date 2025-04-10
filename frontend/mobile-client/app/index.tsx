import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { router } from "expo-router";
const LoginScreen = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require("../../assets/images/BigLogo.png")}
        style={{ height: 300, width: 300 }}
        resizeMode="contain"
      />
      <Text style={styles.title}>Loopup xin chào</Text>
      <Text style={styles.subtitle}>vui lòng đăng nhập để tiếp tục</Text>

      <View style={styles.inputContainer}>
        <Icon name="phone" size={20} color="#555" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Nhập số điện thoại"
          value={phone}
          keyboardType="numeric"
          onChangeText={setPhone}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock" size={20} color="#555" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Nhập mật khẩu"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color="#ccc"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={{
          width: "100%",
          alignItems: "flex-end",
          marginBottom: 20,
        }}
      >
        <Text style={styles.forgot}>Quên mật khẩu</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginButton}>
        <Text style={styles.loginText}>Đăng nhập</Text>
        <Icon name="arrow-right" size={20} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.orText}>Hoặc</Text>

      <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialButton}>
          <FontAwesome name="google" size={20} color="#EA4335" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <FontAwesome name="facebook" size={20} color="#1877F2" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => {
          router.replace("/sign-up");
        }}
      >
        <Text style={styles.registerText}>
          Bạn chưa có tài khoản?{" "}
          <Text style={{ color: "#FFD700" }}>Đăng ký ngay</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A8B",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#444",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "flex-end",
    width: "auto",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxLabel: {
    marginLeft: 5,
    color: "#444",
  },
  forgot: {
    color: "#C81E82",
  },
  loginButton: {
    flexDirection: "row",
    backgroundColor: "#1A1A8B",
    padding: 15,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  loginText: {
    color: "#fff",
    fontWeight: "bold",
  },
  orText: {
    textAlign: "center",
    color: "#888",
    marginBottom: 10,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  socialButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
  },
  registerText: {
    textAlign: "center",
    color: "#444",
  },
});
