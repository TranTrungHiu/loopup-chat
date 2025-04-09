import React, { useEffect, useState } from 'react';

/**
 * Success Toast notification component
 * @param {Object} props Component props
 * @param {string} props.message Success message to display
 * @param {Function} props.onClose Callback function when toast is closed
 * @param {number} props.autoHideTime Time in ms after which toast will auto-hide (default: 5000)
 */
const SuccessToast = ({ message, onClose, autoHideTime = 5000 }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(100);

    // Auto-hide timer
    useEffect(() => {
        const timer = setTimeout(() => {
            hideToast();
        }, autoHideTime);

        // Decrease progress bar every 50ms
        const interval = setInterval(() => {
            setProgress((prevProgress) => {
                const newProgress = prevProgress - (100 / (autoHideTime / 50));
                return newProgress > 0 ? newProgress : 0;
            });
        }, 50);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [autoHideTime]);

    // Hide toast with animation
    const hideToast = () => {
        setIsVisible(false);
        setTimeout(() => {
            if (onClose) onClose();
        }, 300); // Animation duration
    };

    return (
        <div className={`toast success-toast ${isVisible ? 'show' : 'hide'}`}>
            <div className="toast-content">
                <div className="toast-icon">
                    <span>✓</span>
                </div>
                <div className="toast-message">
                    {message}
                </div>
                <button className="toast-close" onClick={hideToast}>
                    ×
                </button>
            </div>
            <div className="toast-progress-container">
                <div
                    className="toast-progress-bar"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export default SuccessToast;