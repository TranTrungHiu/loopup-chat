import React from "react";

const LoginLink = ({ onClick }) => {
    return (
        <div className="section-cx">
            <span className="text-b">Bạn có tài khoản ?</span>
            <span className="text-c" onClick={onClick}>
        {" "}
                Đăng nhập
      </span>
        </div>
    );
};

export default LoginLink;