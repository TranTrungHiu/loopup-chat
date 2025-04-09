import React from 'react';
import PasswordField from './PasswordField';

const PasswordFields = ({ password, confirmPassword, onChange }) => {
    return (
        <div className="password-fields">
            <PasswordField
                name="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(value) => onChange('password', value)}
                required
            />

            <PasswordField
                name="confirmPassword"
                placeholder="Nhập lại"
                value={confirmPassword}
                onChange={(value) => onChange('confirmPassword', value)}
                required
            />
        </div>
    );
};

export default PasswordFields;