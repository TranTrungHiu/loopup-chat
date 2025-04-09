import React from "react";

const CheckAgree = () => {
    return(
        <>
            <label className="container">
                <input checked="checked" type="checkbox"/>
                <div className="checkmark"></div>
                <span className="span-check">Đồng ý với thỏa thuận</span>
            </label>

        </>
    )

};
export default CheckAgree;