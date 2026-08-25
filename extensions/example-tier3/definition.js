//@ts-check
const { defineExtension } = require("../../scripts/schema");

/**
 * Tier 3 example: the actual logic lives in code/index.ts (tested in
 * code/index.test.ts), compiled once by `npm run build:tier3 example-tier3`
 * into window.ExampleTier3. Every action/condition/expression below is a
 * thin wrapper calling into that compiled module - same shape as Tier 2,
 * the only difference is where the logic itself is written and that it's
 * covered by jest. See ../../README.md.
 */
module.exports = defineExtension({
  name: "ExampleTier3",
  fullName: "Example (Tier 3 - TS + build)",
  shortDescription:
    "Deterministic named random streams - shows the TS-module-compiled-then-wrapped pattern.",
  category: "General",
  version: "0.1.0",
  functions: [
    {
      // Placeholder: scripts/build-tier3.js replaces this inlineCode with
      // the bundled code/index.ts, exposed as window.ExampleTier3. Running
      // `npm run generate example-tier3` alone (without build:tier3) will
      // leave this placeholder in place - fine for iterating on the JSON
      // shape, but the extension won't work in GDevelop until build:tier3
      // has run at least once.
      kind: "Action",
      name: "onFirstSceneLoaded",
      js: [
        "// Replaced by `npm run build:tier3 example-tier3` with the compiled",
        "// contents of code/index.ts, exposed as window.ExampleTier3.",
      ],
    },
    {
      kind: "Action",
      name: "SeedRandomStream",
      fullName: "Seed a named random stream",
      description:
        "Same seed always produces the same sequence from Next/NextInRange for that stream name.",
      sentence: "Seed random stream _PARAM0_ with _PARAM1_",
      js: [
        'window.ExampleTier3.seed(',
        '    eventsFunctionContext.getArgument("Name"),',
        '    eventsFunctionContext.getArgument("Seed")',
        ");",
      ],
      params: [
        { name: "Name", type: "string", description: "Stream name" },
        { name: "Seed", type: "expression", description: "Seed value" },
      ],
    },
    {
      kind: "Expression",
      name: "Next",
      fullName: "Next value in a random stream (0 to 1)",
      description: "The stream must have been seeded first with SeedRandomStream.",
      sentence: "",
      js: [
        "eventsFunctionContext.returnValue =",
        '    window.ExampleTier3.next(eventsFunctionContext.getArgument("Name"));',
      ],
      params: [{ name: "Name", type: "string", description: "Stream name" }],
    },
    {
      kind: "Expression",
      name: "NextInRange",
      fullName: "Next value in a random stream, in a range",
      description: "The stream must have been seeded first with SeedRandomStream.",
      sentence: "",
      js: [
        "eventsFunctionContext.returnValue = window.ExampleTier3.nextInRange(",
        '    eventsFunctionContext.getArgument("Name"),',
        '    eventsFunctionContext.getArgument("Min"),',
        '    eventsFunctionContext.getArgument("Max")',
        ");",
      ],
      params: [
        { name: "Name", type: "string", description: "Stream name" },
        { name: "Min", type: "expression", description: "Minimum (inclusive)" },
        { name: "Max", type: "expression", description: "Maximum (exclusive)" },
      ],
    },
  ],
});
