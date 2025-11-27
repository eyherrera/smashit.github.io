// --- Configuration Constants ---
const START_SPEED = 0.5;
const MAX_SPEED = 2.5;       // Speed cap
const SCORE_THRESHOLD = 500; // Score at which we reach MAX_SPEED

// Zone Dimensions (Percentages)
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

// --- State Flags ---
let isRunning = false;     
let isGameOver = false;    
let isInputLocked = false; // Blocks input during the 2s wait
let animationFrameId;

// --- DOM Elements ---
const lightEl = document.getElementById('light');
const scoreEl = document.getElementById('score-val');
const livesEl = document.getElementById('lives-val');
const messageEl = document.getElementById('message');

// --- Calculated Boundaries ---
const ringMin = CENTER - (RING_WIDTH / 2);
const ringMax = CENTER + (RING_WIDTH / 2);
const bullMin = CENTER - (BULLSEYE_WIDTH / 2);
const bullMax = CENTER + (BULLSEYE_WIDTH / 2);

// --- The Game Loop ---
function gameLoop() {
    if (!isRunning) return;

    // Move
    lightPosition += currentSpeed * direction;

    // Bounce Logic
    if (lightPosition >= 100 || lightPosition <= 0) {
        direction *= -1;
    }

    // Render
    lightEl.style.left = lightPosition + '%';

    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Input Handling ---
function handleInput() {
    // 1. If Locked (waiting 2s) or Game Over, ignore spacebar
    if (isInputLocked || isGameOver) {
        if (isGameOver) resetGame(); // Only reset if actually game over
        return;
    }

    // 2. If Idle (Start of game), Start
    if (!isRunning) {
        startRound();
    } 
    // 3. If Running, Stop
    else {
        stopRound();
    }
}

function startRound() {
    isRunning = true;
    messageEl.textContent = ""; 
    gameLoop();
}

function stopRound() {
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
    processResult();
}

// --- Core Logic ---
function processResult() {
    let hitPos = lightPosition;
    let message = "";
    let color = "";

    // Check Zones
    if (hitPos >= bullMin && hitPos <= bullMax) {
        // BULLSEYE
        score += 5;
        if (lives < maxLives) lives++;
        message = "BULLSEYE! (+5)";
        color = "#0f0"; 
    } 
    else if (hitPos >= ringMin && hitPos <= ringMax) {
        // RING
        score += 2;
        message = "HIT! (+2)";
        color = "#fff"; 
    } 
    else {
        // MISS
        lives--;
        message = "MISS! (-1 Life)";
        color = "#f00"; 
    }

    // Update Data
    recalculateSpeed();
    updateStats();

    // UI Feedback
    messageEl.textContent = message;
    messageEl.style.color = color;

    if (lives <= 0) {
        endGame();
    } else {
        // Wait 2 seconds, then AUTO RESTART
        initiateCooldown();
    }
}

// Calculates speed based on current score vs threshold
function recalculateSpeed() {
    if (score >= SCORE_THRESHOLD) {
        currentSpeed = MAX_SPEED;
    } else {
        // Linear Interpolation: 
        // speed = start + (progress_percentage * speed_range)
        const progress = score / SCORE_THRESHOLD;
        const speedRange = MAX_SPEED - START_SPEED;
        currentSpeed = START_SPEED + (progress * speedRange);
    }
    
    // Optional: Log speed for debugging
    // console.log(`Score: ${score}, Speed: ${currentSpeed.toFixed(2)}`);
}

function initiateCooldown() {
    isInputLocked = true; // Block input
    
    setTimeout(() => {
        if (!isGameOver) {
            resetPosition(); 
            isInputLocked = false; // Unlock input
            startRound(); // AUTO START
        }
    }, 2000);
}

function resetPosition() {
    lightPosition = 50;
    // Randomize start direction? Uncomment next line if desired.
    // direction = Math.random() > 0.5 ? 1 : -1;
    lightEl.style.left = '50%';
}

function updateStats() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
}

function endGame() {
    isGameOver = true;
    messageEl.textContent = `GAME OVER. Score: ${score}. Press Space to Reset.`;
}

function resetGame() {
    score = 0;
    lives = 3;
    currentSpeed = START_SPEED;
    isGameOver = false;
    isInputLocked = false;
    
    updateStats();
    resetPosition();
    
    messageEl.textContent = "Press Space to Start";
    messageEl.style.color = "#ffcc00";
    isRunning = false;
}

// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        handleInput();
    }
});

// Initial Setup
resetPosition();