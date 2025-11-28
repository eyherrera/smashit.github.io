// --- Configuration Constants ---
const START_SPEED = 0.5;
const MAX_SPEED = 2.5;       
const SCORE_THRESHOLD = 100; // Score at which max speed is reached
const TURN_TIME_LIMIT = 5000; // 5 Seconds per turn

// Zone Dimensions (Percentages)
const CENTER = 50;
const RING_WIDTH = 20;     
const BULLSEYE_WIDTH = 6;  

// --- Audio Assets ---
// Make sure these .wav files are in the same folder
const sfxBullseye = new Audio('bullseye.wav');
const sfxInside   = new Audio('inside.wav');
const sfxFail     = new Audio('fail.wav');
const sfxLost     = new Audio('lost.wav');
const sfxStreak   = new Audio('streak.wav');

// --- Game Variables ---
let score = 0;
let lives = 3;
const maxLives = 3;

// Streak Variable
let streakCount = 0; 

let lightPosition = 50; 
let direction = 1;      
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
const scoreEl = document.getElementById('score-val');
const livesEl = document.getElementById('lives-val');
const messageEl = document.getElementById('message');
const timerBarEl = document.getElementById('timer-bar');

// --- Boundaries ---
const ringMin = CENTER - (RING_WIDTH / 2);
const ringMax = CENTER + (RING_WIDTH / 2);
const bullMin = CENTER - (BULLSEYE_WIDTH / 2);
const bullMax = CENTER + (BULLSEYE_WIDTH / 2);

// --- Sound Helper ---
function playSound(audioObj) {
    // Reset time to 0 so we can replay sound instantly if triggered rapidly
    audioObj.currentTime = 0;
    audioObj.play().catch(e => console.log("Audio play failed (user interaction required):", e));
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
    lightPosition += currentSpeed * direction;

    if (lightPosition >= 100 || lightPosition <= 0) {
        direction *= -1;
    }

    lightEl.style.left = lightPosition + '%';

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
    streakCount = 0; // Reset streak on timeout
    updateStats();
    
    messageEl.textContent = "TIME UP! (-1 Life)";
    
    // Visual Effects
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
    let zoneType = "miss"; // Default for ripple

    // 1. BULLSEYE
    if (hitPos >= bullMin && hitPos <= bullMax) {
        zoneType = "bullseye";
        streakCount++; 
        let points = 5;
        let isStreakBonus = false;

        // Check for Streak Completion (5 in a row)
        if (streakCount === 5) {
            points += 20; // Bonus
            isStreakBonus = true;
            streakCount = 0; // Reset counter after reward
        }

        score += points;
        if (lives < maxLives) lives++;
        
        if (isStreakBonus) {
            message = "🔥 STREAK! (+25 Points) 🔥";
            color = "#ff00ff"; // Magenta for streak
            
            // Audio Chain: Play Bullseye, THEN Streak
            playSound(sfxBullseye);
            sfxBullseye.onended = function() {
                playSound(sfxStreak);
                sfxBullseye.onended = null; // Clean up listener
            };
        } else {
            message = `BULLSEYE! (+5) [Streak: ${streakCount}/5]`;
            color = "#0f0"; // Green
            playSound(sfxBullseye);
        }
    } 
    // 2. INSIDE (Ring)
    else if (hitPos >= ringMin && hitPos <= ringMax) {
        zoneType = "ring";
        streakCount = 0; // Reset Streak
        score += 2;
        message = "HIT! (+2)";
        color = "#00bfff"; // Deep Sky Blue
        playSound(sfxInside);
    } 
    // 3. MISS (Fail)
    else {
        zoneType = "miss";
        streakCount = 0; // Reset Streak
        lives--;
        message = "MISS! (-1 Life)";
        color = "#f00"; // Red
        
        if (lives > 0) {
            playSound(sfxFail);
        }
    }

    // Trigger Visual Effects
    triggerRippleEffect(hitPos, zoneType);
    
    recalculateSpeed();
    updateStats();

    messageEl.textContent = message;
    
    // Trigger Text Fade Effect (White -> Color)
    animateMessageColor(messageEl, color, 2000);

    if (lives <= 0) {
        playSound(sfxLost);
        endGame();
    } else {
        initiateCooldown();
    }
}

function recalculateSpeed() {
    if (score >= SCORE_THRESHOLD) {
        currentSpeed = MAX_SPEED;
    } else {
        // Linear Interpolation
        const progress = score / SCORE_THRESHOLD;
        const speedRange = MAX_SPEED - START_SPEED;
        currentSpeed = START_SPEED + (progress * speedRange);
    }
}

function initiateCooldown() {
    isInputLocked = true;
    
    setTimeout(() => {
        if (!isGameOver) {
            // Remove the fade effect so the interface text is crisp
            clearMessageEffects(messageEl); 
            
            resetPosition(); 
            isInputLocked = false;
            startRound(); // Auto-start next round
        }
    }, 2000);
}

function resetPosition() {
    lightPosition = 50;
    lightEl.style.left = '50%';
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
    messageEl.style.color = "#ffcc00"; // Gold
}

function resetGame() {
    score = 0;
    lives = 3;
    streakCount = 0; 
    currentSpeed = START_SPEED;
    isGameOver = false;
    isInputLocked = false;
    isRunning = false;
    
    cancelAnimationFrame(animationFrameId); 
    
    updateStats();
    resetPosition();
    
    clearMessageEffects(messageEl); 
    messageEl.textContent = "Press Space or Click to Start";
    messageEl.style.color = "#ffcc00";
}

// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
    // ESC to Reset
    if (e.code === 'Escape') {
        e.preventDefault();
        resetGame(); 
        return;
    }
    // Space to Play
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