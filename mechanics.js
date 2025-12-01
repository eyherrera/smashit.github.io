// --- Configuration Constants ---
const START_SPEED = 1.0;     // Changed: 1.0 is now "Standard 1x Speed"
const MAX_SPEED = 3.0;       // Max 3x speed
const SCORE_THRESHOLD = 100; 
const TURN_TIME_LIMIT = 50000; 

// Zone Dimensions
const CENTER = 50;
const RING_WIDTH = 20;     
const BULLSEYE_WIDTH = 6;  

// --- Audio Assets ---
const sfxBullseye = new Audio('bullseye.wav');
const sfxInside   = new Audio('inside.wav');
const sfxFail     = new Audio('fail.wav');
const sfxLost     = new Audio('lost.wav');
const sfxStreak   = new Audio('streak.wav');

// --- Game Variables ---
let score = 0;
let lives = 3;
const maxLives = 3;

let streakCount = 0; 

let lightPosition = 50; 
// Removed 'direction' - handled by sequences.js now
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

function playSound(audioObj) {
    audioObj.currentTime = 0;
    audioObj.play().catch(e => console.log("Audio play failed:", e));
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

    // 2. Move Light (VIA SEQUENCES)
    // We pass deltaTime and the current Speed Multiplier
    lightPosition = getSequencePosition(deltaTime, currentSpeed);

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
            message = "🔥 STREAK! (+25 Points) 🔥"; color = "#ff00ff";
            playSound(sfxBullseye);
            sfxBullseye.onended = function() { playSound(sfxStreak); sfxBullseye.onended = null; };
        } else {
            message = `BULLSEYE! (+5) [Streak: ${streakCount}/5]`; color = "#0f0";
            playSound(sfxBullseye);
        }
        hitSuccess = true;
    } 
    else if (hitPos >= ringMin && hitPos <= ringMax) {
        zoneType = "ring";
        streakCount = 0; 
        score += 2;
        message = "HIT! (+2)";
        color = "#00bfff"; 
        playSound(sfxInside);
        hitSuccess = true;
    } 
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
    
    // Only change sequence if we actually hit something!
    if (hitSuccess) {
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
            clearMessageEffects(messageEl); 
            // Important: We DON'T reset position to center anymore,
            // because sequences define their own start positions.
            // But we do need to reset the timer for the sequence to start fresh.
            // Actually, nextSequence() already reset the timer if it was a hit.
            // If it was a miss, we probably want to restart the SAME sequence?
            // Let's reset the timer so the light starts at the beginning of the pattern.
            sequenceTimer = 0; 

            isInputLocked = false;
            startRound(); 
        }
    }, 2000);
}

// Helper to reset visuals when starting fresh
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
    messageEl.style.color = "#ffcc00"; 
}

function resetGame() {
    score = 0;
    lives = 3;
    streakCount = 0; 
    currentSpeed = START_SPEED;
    isGameOver = false;
    isInputLocked = false;
    isRunning = false;
    
    // Reset Sequences to the first one
    resetSequences();

    cancelAnimationFrame(animationFrameId); 
    
    updateStats();
    resetPosition();
    
    clearMessageEffects(messageEl); 
    messageEl.textContent = "Press Space or Click to Start";
    messageEl.style.color = "#ffcc00";
}

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

resetPosition();