import { assertEquals } from "jsr:@std/assert";
import { resolveIntents } from "../sim/utils/resolveIntents.ts";

Deno.test("test work ahead", () => {
  assertEquals("I sure hope it does", "I sure hope it does");
});

// TEST INTENT RESOLUTION FUNCTION
// Should accept a list of arrays
// What should be the expected output if nothing is passed in? An empty array?
// Should return a list of intents
Deno.test("intentResolution returns a list of Intents", () => {
  let result = resolveIntents();
  console.log(typeof result);
  assertEquals(typeof [], typeof result);
});

// Each intent should have a status

// Intent moving into an occupied square should fail

// More than one intent moving into the same square should fail
