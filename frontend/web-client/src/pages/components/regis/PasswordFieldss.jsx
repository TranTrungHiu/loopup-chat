import React from 'react';
import PasswordField from './PasswordField';

const PasswordFields = ({ password, confirmPassword, onChange }) => {
    return (
        <div className="password-fieldsx">
            <PasswordField
                className="passwordx"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(value) => onChange('password', value)}
                required
            />

            <PasswordField
                className="confirmPasswordx"
                placeholder="Nhập lại"
                value={confirmPassword}
                onChange={(value) => onChange('confirmPassword', value)}
                required
            />
        </div>
    );
};

export default PasswordFields;