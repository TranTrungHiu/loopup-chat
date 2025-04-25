import React from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { FaCheck, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import './styles/Toast.css';

// Custom toast component với icon
export const ToastMessage = ({ type, message }) => {
  let icon;
  
  switch (type) {
    case 'success':
      icon = <FaCheck className="toast-icon" />;
      break;
    case 'error':
      icon = <FaTimes className="toast-icon" />;
      break;
    case 'warning':
      icon = <FaExclamationTriangle className="toast-icon" />;
      break;
    case 'info':
      icon = <FaInfoCircle className="toast-icon" />;
      break;
    default:
      icon = <FaInfoCircle className="toast-icon" />;
  }
  
  return (
    <div className="custom-toast">
      {icon}
      <div className="toast-message">{message}</div>
    </div>
  );
};

// Hàm hiển thị toast
export const showToast = (type, message) => {
  return toast(<ToastMessage type={type} message={message} />, {
    type: type,
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    transition: toast.Bounce
  });
};

// Component ToastContainer để sử dụng trong App
const Toast = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
    />
  );
};

export default Toast;