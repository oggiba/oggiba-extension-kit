/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["extensions"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
