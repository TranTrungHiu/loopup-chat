import React from "react";

const RegisterLink = ({ onClick }) => {
    return (
        <div className="section-3">
            <span className="text-b">Bạn chưa có tài khoản ?</span>
            <span className="text-c" onClick={onClick}>
        {" "}
                Đăng ký ngay
      </span>
        </div>
    );
};

export default RegisterLink;