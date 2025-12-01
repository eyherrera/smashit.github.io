// --- Configuration Constants ---
const START_SPEED = 1.0;
const MAX_SPEED = 3.0;       
const SEQUENCES_TO_MAX_SPEED = 100; 
const TURN_TIME_LIMIT = 15000; 

// Zone Dimensions
const CENTER = 50;
const RING_WIDTH = 25;
const BULLSEYE_WIDTH = 6;  

// --- Audio Assets ---
const sfxBullseye = new Audio('bullseye.wav');
const sfxInside   = new Audio('inside.wav');
const sfxFail     = new Audio('fail.wav');
const sfxLost     = new Audio('lost.wav');
const sfxStreak   = new Audio('streak.wav');

// --- Game Variables ---
let score = 0;
let sequencesCleared = 0; 
let lives = 3;
const maxLives = 3;

let streakCount = 0; 
let lightPosition = 50; 
let currentSpeed = START_SPEED;
let timeLeft = TURN_TIME_LIMIT;
let lastFrameTime = 0;

// --- State Flags ---
let isRunning = false;     
let isGameOver = false;    
let isInputLocked = false; 
let animationFrameId;

// --- DOM Elements ---
const lightEl = document.getElementById('light');
const gameAreaEl = document.getElementById('game-area'); // Need this for lighting
const scoreEl = document.getElementById('score-val');
const livesEl = document.getElementById('lives-val');
const messageEl = document.getElementById('message');
const timerBarEl = document.getElementById('timer-bar');

// --- Boundaries ---
const ringMin = CENTER - (RING_WIDTH / 2);
const ringMax = CENTER + (RING_WIDTH / 2);
const bullMin = CENTER - (BULLSEYE_WIDTH / 2);
const bullMax = CENTER + (BULLSEYE_WIDTH / 2);

// --- Color Constants ---
const COLOR_BULLSEYE = '0, 123, 255'; // Blue
const COLOR_RING     = '40, 200, 80'; // Green
const COLOR_MISS     = '255, 140, 0'; // Orange

// Store current active color for the environment glow
let currentColorRgb = COLOR_BULLSEYE; 

function playSound(audioObj) {
    audioObj.currentTime = 0;
    audioObj.play().catch(e => console.log("Audio play failed:", e));
}

// --- NEW: Dynamic Environment Lighting ---
function updateEnvironmentLighting(pos) {
    // 1. Determine Color based on position
    if (pos >= bullMin && pos <= bullMax) {
        currentColorRgb = COLOR_BULLSEYE;
    } else if (pos >= ringMin && pos <= ringMax) {
        currentColorRgb = COLOR_RING;
    } else {
        currentColorRgb = COLOR_MISS;
    }

    // 2. Update the Light Element itself
    lightEl.style.backgroundColor = `rgb(${currentColorRgb})`;
    lightEl.style.boxShadow = `0 0 15px rgb(${currentColorRgb}), 0 0 5px rgb(${currentColorRgb}) inset`;

    // 3. Update the Track Background (The "Lighting Up" effect)
    // We create a radial gradient centered at the light's position
    // This makes the floor and edges "glow" as the light passes
    gameAreaEl.style.background = `
        radial-gradient(
            circle at ${pos}% 50%, 
            rgba(${currentColorRgb}, 0.25) 0%, 
            rgba(${currentColorRgb}, 0.05) 40%, 
            rgba(34, 34, 34, 1) 70%
        )
    `;
    
    // Optional: Subtle border glow
    gameAreaEl.style.borderColor = `rgba(${currentColorRgb}, 0.3)`;
}

// --- The Game Loop ---
function gameLoop(timestamp) {
    if (!isRunning) return;

    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    // 1. Update Timer
    timeLeft -= deltaTime;
    const pct = Math.max(0, (timeLeft / TURN_TIME_LIMIT) * 100);
    timerBarEl.style.width = pct + '%';

    if (timeLeft <= 0) {
        handleTimeOut();
        return;
    }

    // 2. Move Light
    lightPosition = getSequencePosition(deltaTime, currentSpeed);
    lightEl.style.left = lightPosition + '%';

    // 3. Update Lighting Effects
    updateEnvironmentLighting(lightPosition);

    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Input Handling ---
function handleInput() {
    if (isInputLocked || isGameOver) {
        if (isGameOver) resetGame();
        return;
    }

    if (!isRunning) {
        startRound();
    } else {
        stopRound();
    }
}

function startRound() {
    isRunning = true;
    messageEl.textContent = ""; 
    timeLeft = TURN_TIME_LIMIT; 
    lastFrameTime = performance.now(); 
    timerBarEl.style.backgroundColor = "#e74c3c"; 
    gameLoop(performance.now());
}

function stopRound() {
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
    processResult();
}

function handleTimeOut() {
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
    
    lives--;
    streakCount = 0; 
    updateStats();
    
    messageEl.textContent = "TIME UP! (-1 Life)";
    animateMessageColor(messageEl, "#f00", 2000);
    triggerRippleEffect(lightPosition, 'miss');
    
    timerBarEl.style.width = "0%";

    if (lives <= 0) {
        playSound(sfxLost);
        endGame();
    } else {
        playSound(sfxFail);
        initiateCooldown();
    }
}

// --- Core Logic ---
function processResult() {
    let hitPos = lightPosition;
    let message = "";
    let color = "";
    let zoneType = "miss";
    let hitSuccess = false;

    // Force update lighting to catch exact stop position
    updateEnvironmentLighting(hitPos);

    // 1. BULLSEYE
    if (hitPos >= bullMin && hitPos <= bullMax) {
        zoneType = "bullseye";
        streakCount++; 
        let points = 5;
        let isStreakBonus = false;

        if (streakCount === 5) {
            points += 20; isStreakBonus = true; streakCount = 0; 
        }

        score += points;
        if (lives < maxLives) lives++;
        
        if (isStreakBonus) {
            message = "🔥 STREAK! (+25 Points) 🔥";
            color = "#ff00ff"; 
            playSound(sfxBullseye);
            sfxBullseye.onended = function() {
                playSound(sfxStreak);
                sfxBullseye.onended = null; 
            };
        } else {
            message = `BULLSEYE! (+5) [Streak: ${streakCount}/5]`;
            color = "#0f0"; 
            playSound(sfxBullseye);
        }
        hitSuccess = true;
    } 
    // 2. RING
    else if (hitPos >= ringMin && hitPos <= ringMax) {
        zoneType = "ring";
        streakCount = 0; 
        score += 2;
        message = "HIT! (+2)";
        color = "#00bfff"; 
        playSound(sfxInside);
        hitSuccess = true;
    } 
    // 3. MISS
    else {
        zoneType = "miss";
        streakCount = 0; 
        lives--;
        message = "MISS! (-1 Life)";
        color = "#f00"; 
        
        if (lives > 0) playSound(sfxFail);
        hitSuccess = false;
    }

    triggerRippleEffect(hitPos, zoneType);
    
    if (hitSuccess) {
        sequencesCleared++; 
        nextSequence();     
    }

    recalculateSpeed();
    updateStats();

    messageEl.textContent = message;
    animateMessageColor(messageEl, color, 2000);

    if (lives <= 0) {
        playSound(sfxLost);
        endGame();
    } else {
        initiateCooldown();
    }
}

function recalculateSpeed() {
    if (sequencesCleared >= SEQUENCES_TO_MAX_SPEED) {
        currentSpeed = MAX_SPEED;
    } else {
        const progress = sequencesCleared / SEQUENCES_TO_MAX_SPEED;
        const speedRange = MAX_SPEED - START_SPEED;
        currentSpeed = START_SPEED + (progress * speedRange);
    }
}

function initiateCooldown() {
    isInputLocked = true;
    setTimeout(() => {
        if (!isGameOver) {
            clearMessageEffects(messageEl); 
            resetSequenceTimer(); 
            isInputLocked = false;
            startRound(); 
        }
    }, 2000);
}

function resetPosition() {
    lightPosition = 50; 
    lightEl.style.left = '50%';
    // Reset lighting to center (blue)
    updateEnvironmentLighting(lightPosition);
    timerBarEl.style.width = '100%'; 
}

function updateStats() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
}

function endGame() {
    isGameOver = true;
    isRunning = false; 
    clearMessageEffects(messageEl); 
    messageEl.textContent = `GAME OVER. Score: ${score}. Click or Space to Reset.`;
    messageEl.style.color = "#ffcc00"; 
}

function resetGame() {
    score = 0;
    sequencesCleared = 0; 
    lives = 3;
    streakCount = 0; 
    currentSpeed = START_SPEED;
    isGameOver = false;
    isInputLocked = false;
    isRunning = false;
    
    resetSequences();

    cancelAnimationFrame(animationFrameId); 
    
    updateStats();
    resetPosition();
    
    clearMessageEffects(messageEl); 
    messageEl.textContent = "Press Space or Click to Start";
    messageEl.style.color = "#ffcc00";
}

// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
        e.preventDefault();
        resetGame(); 
        return;
    }
    if (e.code === 'Space') {
        e.preventDefault();
        handleInput();
    }
});

window.addEventListener('mousedown', (e) => {
    e.preventDefault(); 
    handleInput();
});

// Initial Setup
resetPosition();