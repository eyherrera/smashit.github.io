// --- Configuration Constants ---
const START_SPEED = 0.5;
const MAX_SPEED = 3;       
const SCORE_THRESHOLD = 500; 
const TURN_TIME_LIMIT = 5000; // 5 Seconds in milliseconds

// Zone Dimensions
const CENTER = 50;
const RING_WIDTH = 20;     
const BULLSEYE_WIDTH = 6;  

// --- Game Variables ---
let score = 0;
let lives = 3;
const maxLives = 3;

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

// --- The Game Loop ---
function gameLoop(timestamp) {
    if (!isRunning) return;

    // Calculate time delta for smooth timer
    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    // 1. Update Timer
    timeLeft -= deltaTime;
    
    // Update Bar Visual
    const pct = Math.max(0, (timeLeft / TURN_TIME_LIMIT) * 100);
    timerBarEl.style.width = pct + '%';

    // Check Time Out
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
    timeLeft = TURN_TIME_LIMIT; // Reset Timer
    lastFrameTime = performance.now(); // Reset timestamp
    timerBarEl.style.backgroundColor = "#e74c3c"; // Reset color
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
    
    // Treat as a miss
    lives--;
    updateStats();
    
    messageEl.textContent = "TIME UP! (-1 Life)";
    messageEl.style.color = "#f00";
    timerBarEl.style.width = "0%";

    if (lives <= 0) {
        endGame();
    } else {
        initiateCooldown();
    }
}

// --- Core Logic ---
function processResult() {
    let hitPos = lightPosition;
    let message = "";
    let color = "";

    if (hitPos >= bullMin && hitPos <= bullMax) {
        score += 5;
        if (lives < maxLives) lives++;
        message = "BULLSEYE! (+5)";
        color = "#0f0"; 
    } 
    else if (hitPos >= ringMin && hitPos <= ringMax) {
        score += 2;
        message = "HIT! (+2)";
        color = "#fff"; 
    } 
    else {
        lives--;
        message = "MISS! (-1 Life)";
        color = "#f00"; 
    }

    recalculateSpeed();
    updateStats();

    messageEl.textContent = message;
    messageEl.style.color = color;

    if (lives <= 0) {
        endGame();
    } else {
        initiateCooldown();
    }
}

function recalculateSpeed() {
    if (score >= SCORE_THRESHOLD) {
        currentSpeed = MAX_SPEED;
    } else {
        const progress = score / SCORE_THRESHOLD;
        const speedRange = MAX_SPEED - START_SPEED;
        currentSpeed = START_SPEED + (progress * speedRange);
    }
}

function initiateCooldown() {
    isInputLocked = true;
    
    setTimeout(() => {
        if (!isGameOver) {
            resetPosition(); 
            isInputLocked = false;
            startRound(); // Auto-start next round
        }
    }, 2000);
}

function resetPosition() {
    lightPosition = 50;
    lightEl.style.left = '50%';
    
    // Visual reset of timer bar
    timerBarEl.style.width = '100%'; 
}

function updateStats() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
}

function endGame() {
    isGameOver = true;
    isRunning = false; // Ensure loop stops
    messageEl.textContent = `GAME OVER. Score: ${score}. Click or Space to Reset.`;
}

function resetGame() {
    // Full Reset
    score = 0;
    lives = 3;
    currentSpeed = START_SPEED;
    isGameOver = false;
    isInputLocked = false;
    isRunning = false;
    
    cancelAnimationFrame(animationFrameId); // Ensure no background loops
    
    updateStats();
    resetPosition();
    
    messageEl.textContent = "Press Space or Click to Start";
    messageEl.style.color = "#ffcc00";
}

// --- Event Listeners ---

// 1. Spacebar
window.addEventListener('keydown', (e) => {
    // ESC Button to Stop/Reset
    if (e.code === 'Escape') {
        e.preventDefault();
        resetGame(); // Stops game and goes to start screen
        return;
    }

    // Spacebar to Play
    if (e.code === 'Space') {
        e.preventDefault();
        handleInput();
    }
});

// 2. Mouse Click
window.addEventListener('mousedown', (e) => {
    // Prevent interaction if clicking unrelated buttons (if any exist later)
    e.preventDefault(); 
    handleInput();
});

// Initial Setup
resetPosition();