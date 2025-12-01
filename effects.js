// --- Text Animation ---

/**
 * Animates the text color from White -> Target Color
 * This creates a "cooling down" visual effect on the result message.
 */
function animateMessageColor(element, targetColor, duration = 2000) {
    // 1. Snap to White instantly
    element.style.transition = 'none';
    element.style.color = '#ffffff';
    
    // 2. Force Browser Reflow to ensure the white state renders
    void element.offsetWidth; 
    
    // 3. Transition smoothly to the target color
    element.style.transition = `color ${duration}ms ease-in`;
    element.style.color = targetColor;
}

function clearMessageEffects(element) {
    element.style.transition = 'none';
}

// --- Ripple Animation ---

/**
 * Creates an expanding radial ripple behind the game area.
 * Calculates exact screen coordinates to align the ripple with the light's position.
 */
function triggerRippleEffect(positionPercentage, zoneType) {
    const effectsLayer = document.getElementById('effects-layer');
    const gameArea = document.getElementById('game-area'); 

    // Get the exact screen coordinates of the Game Area
    const rect = gameArea.getBoundingClientRect();

    // Calculate specific pixel coordinates for the light
    const exactPixelX = rect.left + (rect.width * (positionPercentage / 100));
    const exactPixelY = rect.top + (rect.height / 2); 

    const ripple = document.createElement('div');
    ripple.classList.add('ripple-effect');

    const colors = {
        bullseye: '0, 123, 255', // Blue
        ring:     '40, 200, 80', // Green
        miss:     '255, 140, 0'  // Orange
    };

    const rgbStr = colors[zoneType] || colors.miss;
    
    // Create a radial gradient that fades out at the edges
    ripple.style.background = `radial-gradient(circle, rgba(${rgbStr}, 0.7) 0%, rgba(${rgbStr}, 0) 70%)`;

    // Apply exact coordinates
    ripple.style.left = `${exactPixelX}px`;
    ripple.style.top = `${exactPixelY}px`;

    effectsLayer.appendChild(ripple);

    // Clean up DOM after CSS animation finishes
    ripple.addEventListener('animationend', () => {
        ripple.remove();
    });
}