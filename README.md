# Smash It

**Smash It** is a reflex-based single-screen arcade game built with JavaScript and HTML. The objective is simple: stop the moving light inside the target zones to score points and stay alive.

## How to Play

1.  **The Setup:** A "light" oscillates side-to-side across the screen. In the center, there is a large **Ring** containing a smaller **Bullseye**.
2.  **The Goal:** Press the **Spacebar** to stop the light.
3.  **Progression:** Every time you successfully hit the target (Ring or Bullseye), the light moves **faster** for the next turn.

## Scoring & Rules

You start the game with **3 Lives**. The maximum number of lives you can hold is 3.

| Landing Zone | Points | Life Effect |
| :--- | :--- | :--- |
| **Bullseye** (Center) | **+5 Points** | **+1 Life** (Max 3) |
| **Ring** (Outer) | **+2 Points** | No Change |
| **Outside** (Miss) | **0 Points** | **-1 Life** |

> **Note:** The game speed only increases on a successful hit. If you miss, the speed remains constant for the next attempt.

---
*Created by Edgar Herrera*
