import { assertEquals } from "jsr:@std/assert";
import { resolveIntents } from "./resolveIntents.ts";

// Should accept a list of arrays
// What should be the expected output if nothing is passed in? An empty array?
// Should return a list of intents
Deno.test("resolveIntents returns a list of Intents", () => {
  let result = resolveIntents();
  console.log(typeof result);
  assertEquals(typeof [], typeof result);
});


// Each intent should have a status

// Intent moving into an occupied square should fail

// More than one intent moving into the same square should fail