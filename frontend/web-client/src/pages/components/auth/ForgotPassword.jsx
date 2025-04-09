import React from "react";

const ForgotPassword = ({onclick}) => {
    return (
        <div className="box-4" onClick={onclick}>
            <span className="text-4">Quên</span>
            <span className="text-5"> mật khẩu</span>
        </div>
    );
};
export default ForgotPassword;