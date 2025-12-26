import { Team } from "./teamLogic.ts";

export function loadAmberTeam() {
  return new Team("Amber", "#FFBF00", [
    {
      id: 1,
      name: "Bob",
    },
    {
      id: 2,
      name: "Frank",
    },
    {
      id: 3,
      name: "Ted",
    },
  ]);
}
