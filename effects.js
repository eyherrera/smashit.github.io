/**
 * effects.js
 * Handles visual animations and dynamic DOM effects for Smash It.
 */

function animateMessageColor(element, targetColor, duration = 2000) {
    element.style.transition = 'none';
    element.style.color = '#ffffff';
    void element.offsetWidth; 
    element.style.transition = `color ${duration}ms ease-in`;
    element.style.color = targetColor;
}

function clearMessageEffects(element) {
    element.style.transition = 'none';
}

/**
 * Creates an expanding radial ripple behind the game area.
 * NOW USES EXACT PIXEL COORDINATES TO FIX ALIGNMENT.
 * * @param {number} positionPercentage - The horizontal % where the light stopped
 * @param {string} zoneType - 'bullseye', 'ring', or 'miss'
 */
function triggerRippleEffect(positionPercentage, zoneType) {
    const effectsLayer = document.getElementById('effects-layer');
    const gameArea = document.getElementById('game-area'); // Reference the game box

    // 1. Get the exact screen coordinates of the Game Area
    const rect = gameArea.getBoundingClientRect();

    // 2. Calculate the specific pixel where the light stopped
    // Start at the box's left edge + (Width * Percentage)
    const exactPixelX = rect.left + (rect.width * (positionPercentage / 100));
    const exactPixelY = rect.top + (rect.height / 2); // Exact vertical center

    const ripple = document.createElement('div');
    ripple.classList.add('ripple-effect');

    const colors = {
        bullseye: '0, 123, 255', 
        ring:     '40, 200, 80', 
        miss:     '255, 140, 0'  
    };

    const rgbStr = colors[zoneType] || colors.miss;
    ripple.style.background = `radial-gradient(circle, rgba(${rgbStr}, 0.7) 0%, rgba(${rgbStr}, 0) 70%)`;

    // 3. Apply the calculated PIXEL coordinates
    // We assume the ripple is inside a fixed/absolute layer at 0,0
    ripple.style.left = `${exactPixelX}px`;
    ripple.style.top = `${exactPixelY}px`;

    effectsLayer.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
        ripple.remove();
    });
}