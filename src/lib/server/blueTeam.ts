import { Team } from "./teamLogic.ts";

export function loadBlueTeam() {
  return new Team("blue", "#0018A8", [
    {
      id: 4,
      name: "Addie",
    },
    {
      id: 5,
      name: "Nelli",
    },
    {
      id: 6,
      name: "Penny",
    },
  ]);
}
