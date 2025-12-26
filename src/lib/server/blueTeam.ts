import { Team } from "./teamLogic.ts";

export function loadBlueTeam() {
  return new Team("blue", "#0018A8", [
    {
      id: 4,
      name: "Addie",
      x: 5,
      y: 0,
    },
    {
      id: 5,
      name: "Nelli",
      x: 4,
      y: 0,
    },
    {
      id: 6,
      name: "Penny",
      x: 6,
      y: 0,
    },
  ]);
}
