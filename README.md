# MAINTAINER<span style="color:red">.</span>ONE

> **Status:** Pre-Alpha (Building for Jan 1, 2026 Launch)
> **Current Protocol:** Protocol T (The Exhibition)

**Maintainer One** is an open-source, competitive coding sport. It blends the algorithmic strategy of *Screeps*, the strict engineering constraints of *Formula 1*, and the community-driven narrative of *Blaseball*.

The goal is not just to write code, but to architect solutions that survive strictly constrained environments.

---

## 📅 The Deadline
**Launch Date:** January 1, 2026
**Event:** Protocol T (Exhibition Season)

## 📜 Protocol T Specification (Jan '26)
The first season is a "Physics Stress Test." It is stripped down to raw spatial management.

* **Objective:** King of the Hill / Spatial Control.
* **The Grid:** 24x24 Void (No obstacles).
* **Vision:** God Mode (Full state access).
* **The Mechanic:** "Hotspots" appear randomly. The single closest unit to the center scores points. Collisions cancel movement.
* **The API:** Intent Injection.

    // You do not move directly. You request a move.
    // The Engine resolves conflicts (collisions) after all scripts run.
    unit.move(Direction.North);

## 🏗 Architecture
This repository contains the **Web Application** (The League Interface).

* **Framework:** SvelteKit (Svelte 5 Runes).
* **Styling:** Tailwind CSS.
* **Database & Auth:** Supabase.
* **Runtime:** Deno 2.x.

## ⚡ Local Development

### 1. Prerequisites
* [Deno](https://deno.com/) (v2.0+)
* A local Supabase instance (or a linked remote project).

### 2. Environment Setup
Copy the example environment file and fill in your Supabase credentials.

```bash
cp .env.example .env
```

### 3. Installation & Run
Install dependencies and start the development server using Deno.

```bash
# Cache dependencies
deno install

# Start the dev server
deno task dev
```

### 4. The Loop
1.  Navigate to `http://localhost:5173`.
2.  The landing page tracks the countdown to Jan 1, 2026.
3.  (Coming Soon) The "Team Dashboard" will allow you to submit a GitHub Repo URL for ingestion.

## 🤝 The Philosophy
**Community as Engine.**
Teams are GitHub repositories. Matches are Pull Requests. The "Meta" (The Protocol) changes based on community proposals (RFCs).

1.  **Write the Logic:** Code your team's AI in TypeScript.
2.  **Parc Fermé:** Code is frozen before the match. No human intervention allowed during runtime.
3.  **Open Source Espionage:** All team repos are public. Forking is allowed. Winning requires understanding your opponent's architecture.

## 🔗 Links
* **Organization:** [github.com/Maintainer-One](https://github.com/Maintainer-One)
* **License:** MIT