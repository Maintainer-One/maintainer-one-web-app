import { Team } from "./teamLogic.ts";

export function loadAmberTeam() {
  return new Team("Amber", "#FFBF00", [
    {
      id: 1,
      name: "Bob",
      x: 0,
      y: 5,
    },
    {
      id: 2,
      name: "Frank",
      x: 0,
      y: 4,
    },
    {
      id: 3,
      name: "Ted",
      x: 0,
      y: 6,
    },
  ]);
}
