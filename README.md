# MAINTAINER ONE

> **The sports management game powered by open source logic**

Season 1 launching **Q1 2026**.

- **Code:** Develop autonomous logic for teams to see them through a season.
- **Community:** Work together to develop the best team logic. Pick a favorite team and connect with other fans as the season plays out.
- **Championships:** Only one team can win each season. The maintainer of that team is awarded the **Maintainer One** title.

## Inspirations

This project has been percolating in various forms for many years now and as a result draws inspiration from many sources.

- **Screeps:** From screeps came the realization that coding the logic for an RTS is more rewarding to me than manually controlling each unit.
- **Blaseball:** From Blaseball came the realization that games don't need to be sophisticated and deep to be rewarding. A rich community can create a magic of its own.
- **Formula One:** As a new-ish Formula One fan, I don't understand the racing aspects that much but am intrigued by the idea of a "Formula" that drives innovation and that has grown to become (arguably) the pinnacle of motorsport... the protocols of Maintainer One have the potential to be the same for the software world.
- **The Mathematics of Winning Monopoly (Stand-up Maths):** Awoke in me an interest in simulation and data analytics, especially as it concerns games.
- **Chess and Sports:** In a similar vein to the Mathematics of Winning Monopoly, watching competition and the analysis that can come from it by enthusiasts has also been an inspiration.

## Tech Stack & Architecture

- **Runtime/Server:** Deno w/ Typescript
- **Framework:** SvelteKit w/ Svelte 5
- **Database:** Supabase w/ Postgres (Not implemented yet)
- **Styling:** Tailwind CSS
- **Games and Replays:** HTML5 Canvas

### The first protocol

- **Teams:** Four teams to compete for the title: Amber, Beige, Crimson, and Denim.
- **Players:** Three players per team.
- **Intents:** Team logic must signal their intentions. The only intent for now is MOVE.
- **Scoring:** Players race to capture point zones with each point zone being worth one point. Point zones will despawn after some time (TBD)
- **Game Length:** The intention is for each game to last around five minutes at default speed meaning that with each tick taking a second, each game will be 300 ticks long.

## Development Setup

We are currently in **Pre-Alpha**. To run the web app locally:

1. **Install Deno**

This project uses Deno for the runtime. [Installation Documentation](https://docs.deno.com/runtime/getting_started/installation/)

2. **Clone:**

```bash
git clone https://github.com/Maintainer-One/platform.git
cd maintainer-one-web-app
```

3. **Install dependencies:**

   ```bash
   deno install
   ```

4. **Run the project:**

   ```bash
   deno task dev
   ```

   To run in debug mode:

   ```bash
   deno task debug
   ```

   This will then wait for a debugger to attach. To attach the debugger in VS Code press F5. If you use a different IDE please open an issue so we can make the development experience as diverse as possible. Also, I'm not super happy with this debug set up so if you have any better ways of doing it, I'm all ears!

5. **The Game:**

Open `http://localhost:5173` in your browser.

The landing page has a simulation running in the background that is close to what the I envision for the first protocol. It was "vibe" coded though so I'm not that happy with it.

`/replay/random` will simulate and show the replay for a random game that shows the current extent of the simulation and replay system. Refreshing the page will run the simulation again. This is the current focus of development.

## Roadmap:

This project is very very early in development and this roadmap may change drastically from week to week.

- **v0:** Landing page
- **v1:** First protocol implemented and solid foundations in place with a great user experience and developer experience
- **v2:** Start separating the coding aspects of the game from fan experience
- **And beyond:** I don't know. I have so many plans for this game that I will be able to continue tinkering on it forever but would love for it to grow with community input so reach out with your ideas!

## Contributing

There are multiple aspects to this project and I would love for you to engage with any or all of them.

- **Team Logic:** Pick a team and help optimize their code to win matches.
- **Be a Fan:** I'm a fan and hope that you will be to. Pick a favorite team and cheer them on when the first season starts.
- **The Core:** Help push the core game through conversation and development.
- **And More:** I look forward to seeing what this can become in you hands. What your vision is. What your passion can bring to Maintainer One.

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>MAINTAINER ONE || 2026</sub>
</div>
