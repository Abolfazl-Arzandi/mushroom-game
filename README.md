# 🍄 Qarch Khori — Mushroom Collector

A browser-based 2D arcade game built with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools, no dependencies.

---

## How It Was Built

### Architecture

The project is three files:

- `index.html` — markup, HUD elements, canvas, and touch controls
- `styles.css` — layout, theming, and responsive breakpoints
- `game.js` — all game logic and rendering

### Rendering

Everything is drawn each frame onto a single `<canvas>` element using the **Canvas 2D API** (`ctx`). There is no DOM manipulation during gameplay — the canvas is the entire visual output. The game loop runs via `requestAnimationFrame`, and delta time (`dt`) is used for frame-rate-independent movement.

### Game Loop

```
requestAnimationFrame(loop)
  └── update(dt)   — physics, collisions, timers, spawning
  └── render()     — clear + draw background, mushrooms, particles, player
```

### Player & Movement

The player is a Pac-Man style circle. Movement is driven by a `Set` of currently pressed keys (`ArrowUp / W`, etc.), normalized to a unit vector so diagonal speed is consistent. Position is clamped to world boundaries.

### Mushroom Spawning

Mushrooms spawn on a timer. Safe mushrooms (red cap) spawn more frequently; poison mushrooms (purple cap, ×-mark) spawn on a separate slower timer with a cap on how many can exist at once. Each mushroom has a `wobble` offset for a subtle sine-wave animation.

### Collision Detection

Simple circle–circle collision: if the distance between the player center and a mushroom center is less than the sum of their radii (with a 0.68 shrink factor on the mushroom for feel), a hit is registered.

### Particles

On collection or hit, a burst of particles is emitted. Each particle has its own velocity, lifetime, and a small gravity constant applied each frame. They fade out as `life / maxLife` approaches zero.

### HUD & Overlay

Score, lives, and remaining time are plain DOM elements updated via `textContent`. The start/end overlay is a CSS class toggle (`is-visible`) with a backdrop blur.

### Controls

- **Keyboard:** Arrow keys or WASD
- **Touch:** On-screen D-pad buttons using Pointer Events (`pointerdown` / `pointerup` / `pointercancel`), with `setPointerCapture` to prevent drift

---

## How to Run

No installation, no server, no build step required.

1. Download the three files and keep them in the same folder:
   ```
   index.html
   styles.css
   game.js
   ```

2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).

3. Press **شروع بازی** or hit `Space` to start.

That's it.

---

## Gameplay

| Object | Effect |
|---|---|
| 🔴 Red mushroom | +10 points, +1.5 s time |
| 🟣 Purple mushroom | −1 life, 1.2 s invincibility |

The game ends when time runs out or all 3 lives are lost.
