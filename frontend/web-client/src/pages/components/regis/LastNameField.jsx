import React from "react";

const LastNameField = ({ lastName, setlastName }) => {
    return (
        <div className="name">
            <input
                type="text"
                placeholder="Tên"
                value={lastName}
                onChange={(e) => setlastName(e.target.value)}
                className="input-box"
            />
        </div>
    );
};

export default LastNameField;