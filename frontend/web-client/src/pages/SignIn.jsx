import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import styles from "./styles/SignIn.module.css";
// Material-UI imports
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
  Lock as LockIcon,
} from "@mui/icons-material";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("idToken");
    if (token) {
      navigate("/home");
    }
  }, [navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Get the ID token
      const token = await user.getIdToken();

      localStorage.setItem("idToken", token);
      localStorage.setItem("uid", user.uid);

      navigate("/home");
    } catch (error) {
      console.error("Error signing in:", error.message);

      // Handle specific error codes with user-friendly messages
      switch (error.code) {
        case "auth/invalid-email":
          setError("Email không hợp lệ");
          break;
        case "auth/user-disabled":
          setError("Tài khoản này đã bị vô hiệu hóa");
          break;
        case "auth/user-not-found":
          setError("Tài khoản không tồn tại");
          break;
        case "auth/wrong-password":
          setError("Mật khẩu không chính xác");
          break;
        case "auth/too-many-requests":
          setError("Quá nhiều yêu cầu. Vui lòng thử lại sau");
          break;
        default:
          setError("Đăng nhập không thành công. Vui lòng thử lại");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.loginContainer}>
      <Container maxWidth="sm">
        <Paper elevation={3} className={styles.paperContainer}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography component="h1" variant="h4" className={styles.title}>
              LOOPUP
            </Typography>
            <Typography component="h2" variant="h6" className={styles.subtitle}>
              LOGIN
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 3, mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSignIn} sx={{ mt: 3 }}>
            <TextField
              className={styles.inputField}
              margin="normal"
              required
              fullWidth
              id="email"
              label="Địa chỉ Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon className={styles.inputIcon} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              className={styles.inputField}
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon className={styles.inputIcon} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      className={styles.eyeButton}
                    >
                      {showPassword ? (
                        <VisibilityOffIcon
                          className={`${styles.eyeIcon} ${styles.eyeIconShowing}`}
                        />
                      ) : (
                        <VisibilityIcon className={styles.eyeIcon} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              className={styles.loginButton}
              disabled={loading}
              sx={{ mt: 4, mb: 3 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Đăng nhập"
              )}
            </Button>

            <Grid container justifyContent="center">
              <Grid item>
                <Link to="/signup" className={styles.signupLink}>
                  <Typography variant="body2">
                    Chưa có tài khoản? Đăng ký ngay
                  </Typography>
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </div>
  );
};

export default SignIn;
