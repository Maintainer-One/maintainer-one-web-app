import { assertEquals } from "jsr:@std/assert";
import { resolveIntents } from "../sim/utils/resolveIntents.ts";

Deno.test("test work ahead", () => {
  assertEquals("I sure hope it does", "I sure hope it does");
});
