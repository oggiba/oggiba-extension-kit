//@ts-check
const { defineExtension } = require("../../scripts/schema");

/**
 * Tier 2 example: several actions/conditions sharing state (which named
 * cooldowns exist and when they end), but nothing that needs jest coverage
 * or an npm dependency. Pattern: onFirstSceneLoaded defines a private
 * namespace once, everything else is a thin wrapper around it. Confirmed in
 * the wild in WebSocketClient, Raycaster3D, EncryptedStorage and A3F - see
 * ../../README.md.
 */
module.exports = defineExtension({
  name: "ExampleTier2",
  fullName: "Example (Tier 2 - define-once JS)",
  shortDescription:
    "Named cooldown tracker - shows the define-once-in-onFirstSceneLoaded pattern.",
  category: "General",
  version: "0.1.0",
  functions: [
    {
      kind: "Action",
      name: "onFirstSceneLoaded",
      js: [
        "if (!gdjs.__exampleTier2) {",
        "  gdjs.__exampleTier2 = {",
        "    // Map<cooldownName, msTimestampWhenItEnds>",
        "    until: new Map(),",
        "  };",
        "}",
      ],
    },
    {
      kind: "Action",
      name: "TriggerCooldown",
      fullName: "Trigger a named cooldown",
      description: "Starts (or restarts) a named cooldown for Duration seconds.",
      sentence: "Trigger cooldown _PARAM0_ for _PARAM1_ seconds",
      js: [
        'const name = eventsFunctionContext.getArgument("Name");',
        'const durationSeconds = eventsFunctionContext.getArgument("Duration");',
        "const now = runtimeScene.getTimeManager().getTimeFromStart();",
        "gdjs.__exampleTier2.until.set(name, now + durationSeconds * 1000);",
      ],
      params: [
        { name: "Name", type: "string", description: "Cooldown name" },
        { name: "Duration", type: "expression", description: "Duration in seconds" },
      ],
    },
    {
      kind: "Condition",
      name: "IsOnCooldown",
      fullName: "Is a named cooldown active",
      description: "True as long as the given named cooldown hasn't elapsed yet.",
      sentence: "_PARAM0_ is on cooldown",
      js: [
        'const name = eventsFunctionContext.getArgument("Name");',
        "const until = gdjs.__exampleTier2.until.get(name);",
        "const now = runtimeScene.getTimeManager().getTimeFromStart();",
        "eventsFunctionContext.returnValue = until !== undefined && now < until;",
      ],
      params: [{ name: "Name", type: "string", description: "Cooldown name" }],
    },
    {
      kind: "Expression",
      name: "RemainingCooldown",
      fullName: "Remaining cooldown time (seconds)",
      description: "0 if the cooldown doesn't exist or already elapsed.",
      sentence: "",
      js: [
        'const name = eventsFunctionContext.getArgument("Name");',
        "const until = gdjs.__exampleTier2.until.get(name);",
        "const now = runtimeScene.getTimeManager().getTimeFromStart();",
        "eventsFunctionContext.returnValue =",
        "    until === undefined ? 0 : Math.max(0, (until - now) / 1000);",
      ],
      params: [{ name: "Name", type: "string", description: "Cooldown name" }],
    },
  ],
});
