const test = require("node:test");
const assert = require("node:assert/strict");
const { STAGES, isHead } = require("../src/config/workflow");

test("the workflow has the documented four ordered departments", () => {
  assert.deepEqual(STAGES.map((stage) => stage.key), ["design", "production", "quality", "dispatch"]);
  assert.deepEqual(STAGES.map((stage) => stage.position), [1, 2, 3, 4]);
});

test("only department-head roles are identified as heads", () => {
  assert.equal(isHead("design_head"), true);
  assert.equal(isHead("worker"), false);
});
