# 🧩 Oggiba Extension Kit

A protocol + minimal toolchain for building GDevelop "Events Function Extensions" (the `.json` files you import via Project Manager → Extensions → Import extension) without either of the two failure modes we kept finding when auditing real extensions:

- **One giant hand-written JsCode block per action, duplicated everywhere.** `ModelMaterial3D` repeats a ~40-line helper across 8 separate actions - fix a bug, fix it 8 times. `SimpleEnemyAI` puts 750+ lines in a single `doStepPreEvents` block with nothing extracted.
- **Cargo-culting THNK's full TypeScript + tsup + jest + FlatBuffers pipeline onto extensions that don't need it.** THNK needs that because it has a real wire protocol and a state-diffing server. A "give an object a cooldown" extension doesn't.

This repo is the middle ground: a small set of conventions and two tiny scripts, not a framework.

## The three tiers

Pick the lightest tier that fits. Nothing stops an extension from mixing tiers for different functions.

| Tier | Use when | How |
|---|---|---|
| **0 - Native** | The logic is expressible with GDevelop's own built-in conditions/actions (`ForEach`, `CollisionPoint`, `SetVariable`, ...) | No JsCode at all. See `LinkTools`' grid-neighbor-linking actions or `TransitionScreen` for real examples - zero custom JS. |
| **1 - Plain JS** | One action/condition, no state shared with anything else in the extension, a handful of lines | Write the JS directly in `definition.js` via the `schema.js` helpers (or hand-author the `.json` - your call). No project, no build step. See `extensions/example-tier1/`. |
| **2 - Define-once** | Several actions/conditions share state or logic, but none of it is worth unit-testing and it doesn't depend on an npm package | `onFirstSceneLoaded` sets up a private namespace once (`gdjs.__yourExtension = {...}`); every other function is a thin wrapper calling into it. Confirmed independently in THNK, WebSocketClient, Raycaster3D, EncryptedStorage and A3F - four different authors converged on the same shape without copying each other. See `extensions/example-tier2/`. |
| **3 - TS + build** | Either (a) the logic is easy to get subtly wrong and worth covering with jest, or (b) you want a real npm package (pathfinding, physics, compression, hashing, easing curves - anything beyond what GDevelop already exposes as `THREE`/`PIXI`/`gdjs`) instead of reimplementing it | Real TypeScript in `code/index.ts`, tested in `code/index.test.ts`, bundled by `tsup` into a single global and injected into the `onFirstSceneLoaded` block. See `extensions/example-tier3/`. |

**Why the Tier 3 threshold is lower than "as complex as THNK":** the GDevelop extension format is the *only* way to ship an extension as a single importable file - which means whether you write Tier 2 JS or Tier 3 TypeScript, what ends up in the `.json` is the same kind of blob either way (hand-written or compiled). Nobody using your extension in GDevelop ever sees or needs to know TypeScript exists. The entire cost of Tier 3 - the build step, the project setup - is paid by *you*, the maintainer, never by users or by "not sharing the source." That's why it's worth reaching for as soon as either trigger above is true, not only when an extension is THNK-scale.

### Concrete example of trigger (b)

`LinkTools`' pathfinding hand-rolls a priority queue with `array.splice()` (O(n) per insert). A real pathfinding/priority-queue package would be both correct in more edge cases and faster on large graphs - and there's no way to pull one in without a bundler. That alone justifies Tier 3 for an extension with as few as 2-3 actions.

### The other real cost: bundle size

Pulling in a library isn't free performance-wise. `MQTT.js` embedded whole is ~330KB inside the extension's `.json` - that's parse/eval cost paid every time the game boots, on top of the file itself being heavier for the GDevelop editor to load. Tier 3 extensions here build with `--minify`; if you pull in a big package, prefer one with tree-shakeable exports and only import what you use.

## Container shapes

Independent of tier - pick based on *what* you're extending, not how complex the logic is:

- **Global service** (free functions + module state) - a networking client, storage, math/array utilities. `functions: [...]` in `defineExtension`.
- **Behavior** (`eventsBasedBehaviors`) - attaches new abilities to individual objects (a "hat" that follows a bone socket, a portal component, a material controller). Declared params get an implicit `Object`/`Behavior` pair; see `ModelMaterial3D`, `A3F`, `PathTracer3D` for real examples of this shape.
- **Object** (`eventsBasedObjects`) - a reusable widget with child objects (an overlay screen, a HUD). Not covered by the generator here yet (uncommon enough that hand-authoring or the GDevelop visual editor is usually faster) - see `TransitionScreen` for the real shape if you need it.
- **Native-only** - no code needed, just compose built-in instructions.

`schema.js` currently generates free functions and behaviors (the two shapes we've actually needed so far). Extend `buildBehavior`/add a `buildObject` in `scripts/schema.js` if an eventsBasedObject comes up - don't build it speculatively before then.

## Using the generator (Tier 1 & 2)

```bash
npm install
# edit extensions/<name>/definition.js
npm run generate <name>       # writes extensions/<name>/extension.json
```

`definition.js` exports a plain object built with the helpers in `scripts/schema.js` (`defineExtension`, and the `functions`/`behaviors` arrays which use the same compact `FunctionDef` shape either way). This exists purely to kill the repetitive parts of the real GDevelop schema (`"events": [{"type": "BuiltinCommonInstructions::JsCode", ...}]`, `"objectGroups": []`, the boilerplate `parameters` shape) - the output is byte-identical in structure to what the GDevelop editor itself would produce or what you'd get hand-writing it.

**Import the generated `.json` after every change** via Project Manager → Extensions → Import, GDevelop caches the previous version otherwise.

## Using the build (Tier 3)

```bash
# edit extensions/<name>/code/index.ts, cover it in code/index.test.ts
npm test                       # run jest against every extension's code/
npm run build:tier3 <name>     # regenerates the JSON, bundles code/index.ts, injects it
```

`build:tier3` bundles `code/index.ts` with `tsup` into an IIFE assigned to `window.<GlobalName>` (PascalCase of the folder name by default, override by exporting `globalName` from `definition.js`), and replaces the `onFirstSceneLoaded` function's `inlineCode` with that bundle. Every other action/condition/expression calls into `window.<GlobalName>.something(...)` - same wrapper shape as Tier 2, the logic just lives in a real, tested TS module instead of inline strings.

To depend on an npm package: `npm install <package> --save`, `import` it normally in `code/index.ts`. `tsup` bundles it into the output automatically, same as THNK does today with `pako`, `msgpackr` and `flatbuffers`.

## Hard-won rules (things that silently break instead of erroring)

- Object parameters on **free functions** must be `"type": "objectList"`, never `"object"` - `"object"` only works as the implicit parameter inside a behavior/object function.
- In JsCode, the object list named in `parameterObjects` is auto-injected as `objects` - don't *also* call `eventsFunctionContext.getObjects("Object")` for that same one. Mixing them is a confirmed cause of a silent `Cannot read properties of undefined (reading 'func')` crash at preview time (the instruction fails to compile at all).
- Every `Expression`/`StringExpression`/`ExpressionAndCondition` needs `expressionType` set (the generator does this for you from `kind` - don't hand-edit that field out).
- `_PARAMn_` in a `sentence` maps to index `n` of the fully-resolved parameter list. For a behavior function, `Object` is implicit at index 0 and your declared params shift by +1 - `_PARAM1_` is your first declared parameter, not `_PARAM0_`.
- A resource-heavy library or a hand-rolled Vector/Matrix class belongs in `code/` (Tier 3) so it can be unit tested; UI wiring (which action calls what) belongs in `definition.js`, not the other way around.
- If a hand-authored JSON block keeps failing preview with no useful error, stop iterating blind - build the minimal version in the GDevelop visual editor, export it, and copy the exact serialization it produces. Extraction beats guessing.

## Adding a new extension

1. `mkdir extensions/<name>`
2. Pick a tier (see table above) and copy the matching `extensions/example-tier*/` as a starting point.
3. Tier 1/2: write `definition.js`, run `npm run generate <name>`. Tier 3: also write `code/index.ts` (+ tests), run `npm run build:tier3 <name>`.
4. Import `extensions/<name>/extension.json` into a GDevelop project to test.
5. Commit `definition.js` (+ `code/` for Tier 3) *and* the generated `extension.json` - the JSON is the actual deliverable, the rest is how it's maintained.

## Relationship to THNK

THNK itself is intentionally **not** migrated onto this kit - it already has its own heavier pipeline (protocol codegen, multiple adapters, an existing test suite) that predates this repo and works fine as-is. This kit is for *new* extensions going forward (and for reworking existing ones we maintain, like a future Firebase link extension) where starting from scratch would otherwise mean re-deriving these same decisions each time.
