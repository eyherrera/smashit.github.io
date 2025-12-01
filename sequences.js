/**
 * sequences.js
 * Handles the movement patterns (choreography) of the light.
 */

// Easing Functions
const Easing = {
    linear: t => t,
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t)
};

// Base duration for a "standard" movement across screen (in ms)
const BASE_DURATION = 2000; 

// The Definition of Sequences
// fixedDuration: If true, this step ALWAYS takes (Base * TimeDiff) ms, regardless of game speed.
const SEQUENCES = [
    // SEQUENCE 1: Back and Forth (Standard)
    {
        steps: [
            { val: 0,   time: 0,   ease: Easing.easeInOutQuad },
            { val: 100, time: 1.0, ease: Easing.easeInOutQuad },
            { val: 0,   time: 2.0, ease: Easing.easeInOutQuad }
        ]
    },

    // SEQUENCE 2: Left to Right Teleport (Sawtooth)
    {
        steps: [
            { val: 0,   time: 0,   ease: Easing.linear },
            { val: 100, time: 1.0, ease: Easing.linear }
        ]
    },

    // SEQUENCE 3: The "Tease" (Fake outs)
    {
        steps: [
            { val: 0,   time: 0,   ease: Easing.easeInOutQuad },
            { val: 35,  time: 0.5, ease: Easing.easeInOutQuad }, 
            { val: 0,   time: 1.0, ease: Easing.easeInOutQuad }, 
            { val: 100, time: 2.0, ease: Easing.easeInOutQuad }, 
            { val: 65,  time: 2.5, ease: Easing.easeInOutQuad }, 
            { val: 100, time: 3.0, ease: Easing.easeInOutQuad }, 
            { val: 0,   time: 4.0, ease: Easing.easeInOutQuad }  
        ]
    },

    // SEQUENCE 4: Pause and Shoot
    // We added 'fixedDuration: true' to the second step (the wait)
    {
        steps: [
            { val: 0,   time: 0,   ease: Easing.linear },       
            // This step is the "Pause". We mark it fixed so it stays 1 second (0.5 * 2000ms) forever.
            { val: 0,   time: 0.5, ease: Easing.linear, fixedDuration: true },       
            { val: 100, time: 1.0, ease: Easing.easeInOutQuad }, 
            { val: 0,   time: 1.5, ease: Easing.easeInOutQuad }  
        ]
    },

    // SEQUENCE 5: Right to Left Teleport (Reverse Sawtooth)
    {
        steps: [
            { val: 100, time: 0,   ease: Easing.linear },
            { val: 0,   time: 1.0, ease: Easing.linear }
        ]
    },

    // SEQUENCE 6: Double Fake Left, Then Full Swing
    {
        steps: [
            { val: 0,   time: 0,   ease: Easing.easeInOutQuad },
            { val: 35,  time: 0.5, ease: Easing.easeInOutQuad }, 
            { val: 0,   time: 1.0, ease: Easing.easeInOutQuad }, 
            { val: 35,  time: 1.5, ease: Easing.easeInOutQuad }, 
            { val: 0,   time: 2.0, ease: Easing.easeInOutQuad }, 
            { val: 100, time: 3.0, ease: Easing.easeInOutQuad }, 
            { val: 0,   time: 4.0, ease: Easing.easeInOutQuad }  
        ]
    },

    // SEQUENCE 7: Bullseye Sniping
    {
        steps: [
            { val: 0,   time: 0,   ease: Easing.easeInOutQuad },
            { val: 50,  time: 0.5, ease: Easing.easeInOutQuad }, 
            { val: 0,   time: 1.0, ease: Easing.easeInOutQuad }, 
            { val: 100, time: 2.0, ease: Easing.easeInOutQuad }, 
            { val: 50,  time: 2.5, ease: Easing.easeInOutQuad }, 
            { val: 100, time: 3.0, ease: Easing.easeInOutQuad }, 
            { val: 0,   time: 4.0, ease: Easing.easeInOutQuad }  
        ]
    },

    // SEQUENCE 8: Chaos Pattern
    {
        steps: [
            { val: 0,   time: 0,   ease: Easing.easeInOutQuad },
            { val: 35,  time: 0.5, ease: Easing.easeInOutQuad }, 
            { val: 0,   time: 1.0, ease: Easing.easeInOutQuad }, 
            { val: 100, time: 2.0, ease: Easing.easeInOutQuad }, 
            { val: 0,   time: 3.0, ease: Easing.easeInOutQuad }, 
            { val: 100, time: 4.0, ease: Easing.easeInOutQuad }, 
            { val: 65,  time: 4.5, ease: Easing.easeInOutQuad }, 
            { val: 100, time: 5.0, ease: Easing.easeInOutQuad }, 
            { val: 0,   time: 6.0, ease: Easing.easeInOutQuad }, 
            { val: 100, time: 7.0, ease: Easing.easeInOutQuad },
            { val: 0,   time: 8.0, ease: Easing.easeInOutQuad }
        ]
    }
];

let currentSeqIndex = 0;
let sequenceTimer = 0; // "Definition Time" (0.0 -> 1.0 -> 2.0 etc)

function nextSequence() {
    currentSeqIndex = (currentSeqIndex + 1) % SEQUENCES.length;
    sequenceTimer = 0;
}

function resetSequences() {
    currentSeqIndex = 0;
    sequenceTimer = 0;
}

/**
 * Calculates position, handling variable speeds for different steps.
 */
function getSequencePosition(deltaTime, speedMultiplier) {
    const seq = SEQUENCES[currentSeqIndex];
    const totalDuration = seq.steps[seq.steps.length - 1].time;
    
    // 1. Determine which step we are CURRENTLY in (before adding time)
    // We use modulo for the lookup to handle looping logic
    const loopedTimerLookup = sequenceTimer % totalDuration;
    
    let isFixedStep = false;

    for (let i = 0; i < seq.steps.length - 1; i++) {
        const startStep = seq.steps[i];
        const endStep = seq.steps[i+1];

        // Find the active segment
        if (loopedTimerLookup >= startStep.time && loopedTimerLookup < endStep.time) {
            // Check if the destination step is marked as fixed
            if (endStep.fixedDuration) {
                isFixedStep = true;
            }
            break; 
        }
    }

    // 2. Calculate Effective Speed
    // If fixed, we treat speedMultiplier as 1.0 (Standard Speed). 
    // Otherwise, we use the actual game speed.
    const effectiveSpeed = isFixedStep ? 1.0 : speedMultiplier;

    // 3. Advance the Timer
    // We add to the "Definition Time" based on real elapsed time modified by speed
    sequenceTimer += (deltaTime * effectiveSpeed) / BASE_DURATION;

    // 4. Calculate Position based on new Timer
    const loopedTime = sequenceTimer % totalDuration;

    for (let i = 0; i < seq.steps.length - 1; i++) {
        const startStep = seq.steps[i];
        const endStep = seq.steps[i+1];

        if (loopedTime >= startStep.time && loopedTime < endStep.time) {
            const stepDuration = endStep.time - startStep.time;
            const stepProgress = (loopedTime - startStep.time) / stepDuration;
            
            // Apply Easing
            const easedProgress = endStep.ease(stepProgress);
            
            // Interpolate Position
            const range = endStep.val - startStep.val;
            return startStep.val + (range * easedProgress);
        }
    }

    return seq.steps[0].val; 
}