// components/GalaxyBackground.jsx
import React, { useEffect, useRef } from 'react';

const GalaxyBackground = ({ children }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return; // Safety check

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Make canvas full-screen
        const setCanvasDimensions = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        setCanvasDimensions();
        window.addEventListener('resize', setCanvasDimensions);

        // Create floating circles
        const circles = [];
        const circleCount = 15;

        for (let i = 0; i < circleCount; i++) {
            circles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 40 + 10,
                color: getRandomColor(),
                vx: Math.random() * 0.8 - 0.4,
                vy: Math.random() * 0.8 - 0.4,
                blur: Math.random() * 20 + 15,
                initialBlur: Math.random() * 20 + 15
            });
        }

        // Function to generate random pastel colors that match the LoopUP logo
        function getRandomColor() {
            const colors = [
                'rgba(147, 107, 219, 0.6)', // Purple (like logo left side)
                'rgba(107, 94, 219, 0.6)',  // Deeper purple (like logo right side)
                'rgba(233, 222, 50, 0.6)',  // Yellow (like logo text)
                'rgba(177, 137, 255, 0.6)', // Light purple (like logo bubbles)
                'rgba(129, 91, 231, 0.6)',  // Medium purple
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        // Gradient background matching LoopUP colors
        const createGradientBackground = () => {
            const gradient = ctx.createRadialGradient(
                canvas.width * 0.3, canvas.height * 0.3, 0,
                canvas.width * 0.5, canvas.height * 0.5, canvas.width
            );

            gradient.addColorStop(0, 'rgba(177, 137, 255, 0.6)'); // Light purple
            gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)'); // White (reduced opacity)
            gradient.addColorStop(0.6, 'rgba(147, 107, 219, 0.5)'); // Medium purple
            gradient.addColorStop(1, 'rgba(107, 94, 219, 0.5)'); // Deep purple

            return gradient;
        };

        // Animation function
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background
            ctx.fillStyle = createGradientBackground();
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw circles with blur effect
            circles.forEach(circle => {
                // Update position
                circle.x += circle.vx;
                circle.y += circle.vy;

                // Bounce off edges
                if (circle.x < 0 || circle.x > canvas.width) circle.vx *= -1;
                if (circle.y < 0 || circle.y > canvas.height) circle.vy *= -1;

                // Calculate increased blur based on movement
                const speed = Math.sqrt(circle.vx * circle.vx + circle.vy * circle.vy);
                const dynamicBlur = circle.initialBlur + (speed * 30);

                // Apply enhanced blur effect
                ctx.shadowBlur = dynamicBlur;
                ctx.shadowColor = circle.color;

                // Draw circle with blur filter
                ctx.filter = `blur(${dynamicBlur/3}px)`;
                ctx.beginPath();
                ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
                ctx.fillStyle = circle.color;
                ctx.fill();
                ctx.filter = 'none';

                // Reset shadow
                ctx.shadowBlur = 0;
            });

            animationFrameId = window.requestAnimationFrame(animate);
        };

        animate();

        // Cleanup
        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', setCanvasDimensions);
        };
    }, []);

    // The key changes are in this return statement
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100vh' }}>
            {/* Background Canvas - explicitly set to cover the entire viewport and be behind other content */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed',  // Changed from absolute to fixed
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: -1,        // Make sure it's behind other content
                    pointerEvents: 'none'  // Allow clicking through the canvas
                }}
            />

            {/* Your existing content */}
            {children}
        </div>
    );
};

export default GalaxyBackground;