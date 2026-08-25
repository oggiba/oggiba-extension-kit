//@ts-check
const { defineExtension } = require("../../scripts/schema");

/**
 * Tier 1 example: one action, no state shared with anything else, trivial
 * logic. This is the case where NOT opening a TS project is the right call
 * - just write the JS directly here. See ../../README.md for the tier guide.
 */
module.exports = defineExtension({
  name: "ExampleTier1",
  fullName: "Example (Tier 1 - plain JS)",
  shortDescription:
    "One-off expression with no shared state - shows when NOT to reach for a Tier 2/3 project.",
  category: "General",
  version: "0.1.0",
  functions: [
    {
      kind: "Expression",
      name: "RollDice",
      fullName: "Roll a dice",
      description: "Returns a random integer between 1 and Sides (inclusive).",
      sentence: "",
      js: [
        "eventsFunctionContext.returnValue =",
        '    Math.floor(Math.random() * eventsFunctionContext.getArgument("Sides")) + 1;',
      ],
      params: [
        {
          name: "Sides",
          type: "expression",
          description: "Number of sides on the dice",
        },
      ],
    },
  ],
});
