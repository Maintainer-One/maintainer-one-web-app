# MAINTAINER<span style="color:#b91c1c">.</span>ONE

> **Code. Community. Championships.**

![Status](https://img.shields.io/badge/STATUS-PRE--ALPHA-red?style=for-the-badge)
![License](https://img.shields.io/badge/LICENSE-MIT-gray?style=for-the-badge)
![Stack](https://img.shields.io/badge/BUILT_WITH-SVELTE_5-orange?style=for-the-badge)

---

## 📡 The Transmission

**Maintainer One** is a competitive engineering platform launching **Q1 2026**.

At its heart, it is a coding league where every action a team makes is automated through code. Humans write the logic; the bots execute the protocol.



Unlike standard e-sports or hackathons, you do not control your units directly. You maintain the repository that controls them. Each league operates under a specific **Protocol**—a set of constraints and evolving rules that your codebase must adapt to.

## 🎯 The Objective

* **Code:** Develop autonomous logic for agents (Bots) on a grid-based simulation.
* **Community:** Open Source strategy. Each team is a repository; success depends on maintainers and contributors adapting to the protocol.
* **Championships:** Only one team can win each season. The maintainer of that team is crowned **Maintainer One**.

## 🛠️ Tech Stack & Architecture

This repository contains the landing page and the core simulation engine visualization.

* **Framework:** SvelteKit (Svelte 5 Runes)
* **Styling:** Tailwind CSS
* **Simulation:** HTML5 Canvas + TypeScript



### Simulation Logic (Current State)
The landing page features a live simulation of the game engine:
1.  **Entities:** Bots (Red vs. Gray) move across a grid.
2.  **Intents:** Bots enter states (IDLE, RACING) based on `hotspot` generation.
3.  **Scoring:** Bots race to capture hotspots; successful captures trigger explosions and increment team scores.

## 🚀 Development Setup

We are currently in **Pre-Alpha**. To run the landing page locally:

1.  **Clone:**
    ```bash
    git clone [https://github.com/Maintainer-One/platform.git](https://github.com/Maintainer-One/maintainer-one-web-app.git)
    cd maintainer-one-web-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Initiate Protocol:**
    ```bash
    npm run dev
    ```

4.  **Visualize:**
    Open `http://localhost:5173` in your browser.

## 📅 Roadmap: Protocol One

| Phase | Milestone | Status |
| :--- | :--- | :--- |
| **Phase 0** | Engine Simulation & Landing Page | ✅ **Active** |
| **Phase 1** | Bot API Definition | 🚧 In Progress |
| **Phase 2** | Team Registration Protocols | ⏳ Pending |
| **Phase 3** | **Protocol One Launch** (Q1 2026) | ⏳ Pending |

## 🤝 Contributing

We need Engineers, Designers, and Strategists.

### 💻 For Developers
Submit PRs to fix bugs in the simulation engine or optimize the rendering loop.
* *Current Focus:* Optimizing the `draw()` loop and `Explosion` particle management.

### 🎨 For Designers
Have an idea for a game mechanic? A loophole in the protocol?
* Open an Issue labeled `discussion` to join the design conversation.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>MAINTAINER ONE // 2026</sub>
</div>
