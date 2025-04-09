import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { auth } from "../../../firebase";
import { useNavigate } from "react-router-dom";

const SocialLoginOptions = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState({
        google: false,
        facebook: false
    });

    // Handle user data after successful login
    const handleAuthSuccess = async (result) => {
        try {
            const token = await result.user.getIdToken();
            // Store user information in localStorage
            localStorage.setItem("idToken", token);
            localStorage.setItem("uid", result.user.uid);
            localStorage.setItem("email", result.user.email);

            // Navigate to home page
            navigate("/home");
        } catch (error) {
            console.error("Error getting token:", error);
        }
    };

    // Handle Google sign in
    const handleGoogleSignIn = async () => {
        setIsLoading(prev => ({ ...prev, google: true }));

        try {
            const provider = new GoogleAuthProvider();
            // Add scopes if needed
            // provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
            const result = await signInWithPopup(auth, provider);
            await handleAuthSuccess(result);
        } catch (error) {
            console.error("Google sign in error:", error);
            // Handle specific error codes if needed
            // if (error.code === 'auth/account-exists-with-different-credential') {
            //    // Handle linked account scenario
            // }
        } finally {
            setIsLoading(prev => ({ ...prev, google: false }));
        }
    };

    // Handle Facebook sign in
    const handleFacebookSignIn = async () => {
        setIsLoading(prev => ({ ...prev, facebook: true }));

        try {
            const provider = new FacebookAuthProvider();
            // Add permissions if needed
            // provider.addScope('user_birthday');
            const result = await signInWithPopup(auth, provider);
            await handleAuthSuccess(result);
        } catch (error) {
            console.error("Facebook sign in error:", error);
        } finally {
            setIsLoading(prev => ({ ...prev, facebook: false }));
        }
    };

    return (
        <div className="social-login-container">
            <div className="social-login-divider">
                <span>or continue with</span>
            </div>

            <div className="social-buttons">
                <button
                    className="social-button google"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading.google}
                    aria-label="Sign in with Google"
                >
                    {isLoading.google ? (
                        <span className="loading-spinner"></span>
                    ) : (
                        <svg
                            width="28"
                            height="29"
                            viewBox="0 0 28 29"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M27.4875 14.8203C27.4875 13.9062 27.4125 13.0312 27.2531 12.1758H14.375V17.5586H21.7406C21.4031 19.2969 20.4219 20.7734 18.9547 21.7734V25.2148H23.3875C25.9938 22.8148 27.4875 19.1289 27.4875 14.8203Z"
                                fill="#4285F4"
                            />
                            <path
                                d="M14.375 28.5C18.1141 28.5 21.2859 27.2617 23.3922 25.2148L18.9594 21.7734C17.7328 22.5977 16.1719 23.0781 14.3797 23.0781C10.7797 23.0781 7.74531 20.6523 6.64844 17.3906H2.07656V20.9414C4.16719 25.3867 8.90469 28.5 14.375 28.5Z"
                                fill="#34A853"
                            />
                            <path
                                d="M6.64375 17.3906C6.03125 15.7266 6.03125 13.9062 6.64375 12.2422V8.69141H2.07656C0.435938 12.1055 0.435938 17.5273 2.07656 20.9414L6.64375 17.3906Z"
                                fill="#FBBC04"
                            />
                            <path
                                d="M14.375 6.42187C16.3797 6.39844 18.3141 7.17578 19.7891 8.58984L23.7203 4.72265C21.1672 2.32421 17.8344 0.99999 14.375 1.02734C8.90469 1.02734 4.16719 4.14062 2.07656 8.69141L6.64375 12.2422C7.72969 8.98046 10.7797 6.42187 14.375 6.42187Z"
                                fill="#EA4335"
                            />
                        </svg>
                    )}
                    <span className="button-text">Google</span>
                </button>

                <button
                    className="social-button facebook"
                    onClick={handleFacebookSignIn}
                    disabled={isLoading.facebook}
                    aria-label="Sign in with Facebook"
                >
                    {isLoading.facebook ? (
                        <span className="loading-spinner"></span>
                    ) : (
                        <svg
                            width="28"
                            height="29"
                            viewBox="0 0 28 29"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M27.5 14.5C27.5 6.76801 21.232 0.5 13.5 0.5C5.76801 0.5 -0.5 6.76801 -0.5 14.5C-0.5 21.4881 4.43896 27.2797 11.125 28.3291V18.625H7.75V14.5H11.125V11.375C11.125 7.84625 13.0887 5.875 16.2906 5.875C17.8344 5.875 19.375 6.125 19.375 6.125V9.375H17.6694C16.0025 9.375 15.5 10.4175 15.5 11.4887V14.5H19.25L18.6644 18.625H15.5V28.3291C22.186 27.2797 27.5 21.4881 27.5 14.5Z"
                                fill="#1877F2"
                            />
                            <path
                                d="M18.6644 18.625L19.25 14.5H15.5V11.4887C15.5 10.4175 16.0025 9.375 17.6694 9.375H19.375V6.125C19.375 6.125 17.8344 5.875 16.2906 5.875C13.0887 5.875 11.125 7.84625 11.125 11.375V14.5H7.75V18.625H11.125V28.3291C11.8223 28.4364 12.5512 28.5 13.3 28.5C14.0488 28.5 14.7777 28.4364 15.5 28.3291V18.625H18.6644Z"
                                fill="white"
                            />
                        </svg>
                    )}
                    <span className="button-text">Facebook</span>
                </button>
            </div>

            {/* Add CSS for better styling */}
            <style jsx>{`
                .social-login-container {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    position: relative;
                    top: 280px;
                    left: -50px;
                    width: 100%;
                }
                
                .social-login-divider {
                    display: flex;
                    align-items: center;
                    color: #666;
                    margin-top: 50px;
                    font-size: 14px;
                }
                
                .social-login-divider::before,
                .social-login-divider::after {
                    content: "";
                    flex: 1;
                    border-bottom: 1px solid #ddd;
                }
                
                .social-login-divider span {
                    top:10px

                }
                
                .social-buttons {
                    display: flex;
                    gap: 12px;
                    width: 100%;
                }
                
                .social-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    flex: 1;
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .social-button:hover {
                    background: #f5f5f5;
                }
                
                .social-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                
                .loading-spinner {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(0, 0, 0, 0.1);
                    border-left-color: #09f;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .button-text {
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
};

export default SocialLoginOptions;