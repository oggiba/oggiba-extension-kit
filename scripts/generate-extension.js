#!/usr/bin/env node
//@ts-check
/**
 * Usage: node scripts/generate-extension.js <extension-folder-name>
 *
 * Requires extensions/<name>/definition.js (must `module.exports` an object
 * built with defineExtension()/action()/... from ./schema.js), and writes
 * extensions/<name>/extension.json next to it.
 */
const fs = require("fs");
const path = require("path");

const extName = process.argv[2];
if (!extName) {
  console.error("Usage: node scripts/generate-extension.js <extension-folder-name>");
  process.exit(1);
}

const extDir = path.join(__dirname, "..", "extensions", extName);
const definitionPath = path.join(extDir, "definition.js");

if (!fs.existsSync(definitionPath)) {
  console.error(`No definition.js found at ${definitionPath}`);
  process.exit(1);
}

// Clear the require cache so repeated runs (e.g. from a watcher) pick up edits.
delete require.cache[require.resolve(definitionPath)];
const definition = require(definitionPath);

fs.writeFileSync(
  path.join(extDir, "extension.json"),
  JSON.stringify(definition, null, 2) + "\n"
);

console.log(`Wrote extensions/${extName}/extension.json`);
