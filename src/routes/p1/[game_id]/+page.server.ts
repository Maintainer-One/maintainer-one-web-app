import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  return {
    game: {
      seed: 123,
      ticks: [
        {
          a: {
            score: 0,
            players: [{ name: "bob", x: 1, y: 5 }],
          },
          b: {
            score: 0,
            players: [{ name: "frank", x: 10, y: 5 }],
          },
        },
        {
          a: {
            score: 0,
            players: [{ name: "bob", x: 2, y: 5 }],
          },
          b: {
            score: 3,
            players: [{ name: "frank", x: 9, y: 5 }],
          },
        },
      ],
    },
  };
};
