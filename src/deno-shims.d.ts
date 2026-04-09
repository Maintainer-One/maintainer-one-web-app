/**
 * This file provides ambient type declarations for Deno-specific modules
 * and standard libraries to satisfy the TypeScript compiler when running 
 * non-Deno tools like svelte-check.
 */

declare module "@std/assert" {
    export function assertEquals(actual: unknown, expected: unknown, msg?: string): void;
    export function assertNotEquals(actual: unknown, expected: unknown, msg?: string): void;
    export function assert(expr: unknown, msg?: string): asserts expr;
    export function assertExists(actual: unknown, msg?: string): void;
    export function assertRejects(fn: () => Promise<unknown>, errorClass?: any, msgIncludes?: string, msg?: string): Promise<void>;
    export function assertThrows(fn: () => unknown, errorClass?: any, msgIncludes?: string, msg?: string): void;
}

declare module "@std/testing/bdd" {
    export function describe(name: string, fn: () => void): void;
    export function it(name: string, fn: () => void | Promise<void>): void;
    export function beforeAll(fn: () => void | Promise<void>): void;
    export function afterAll(fn: () => void | Promise<void>): void;
    export function beforeEach(fn: () => void | Promise<void>): void;
    export function afterEach(fn: () => void | Promise<void>): void;
}

declare module "@std/random" {
    export function sample<T>(array: readonly T[]): T;
    export function randomInt(min: number, max: number): number;
}

// Map the jsr: prefixed imports as well since some files use them
declare module "jsr:@std/assert" {
    export * from "@std/assert";
}

// Reference the global Deno types from the project root
/// <reference path="../deno.d.ts" />
