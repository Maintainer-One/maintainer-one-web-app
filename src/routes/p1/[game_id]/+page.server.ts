import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  return {
    game: {
      seed: 123,
      ticks: [
        [
          {
            name: "A's",
            score: 0,
            players: [{ name: "bob", x: 5, y: 1 }],
          },
          {
            name: "B's",
            score: 0,
            players: [{ name: "frank", x: 5, y: 10 }],
          },
        ],
        [
          {
            name: "A's",
            score: 0,
            players: [{ name: "bob", x: 5, y: 2 }],
          },
          {
            name: "B's",
            score: 3,
            players: [{ name: "frank", x: 5, y: 9 }],
          },
        ],
        [
          {
            name: "A's",
            score: 0,
            players: [{ name: "bob", x: 5, y: 3 }],
          },
          {
            name: "B's",
            score: 3,
            players: [{ name: "frank", x: 5, y: 8 }],
          },
        ],
      ],
    },
  };
};
