import assert from "node:assert/strict";
import test from "node:test";
import { correlateWithBuild, inferRecallIntent } from "./intent.js";

test("infers conversational recall with focused query", () => {
  const intent = inferRecallIntent(
    "I remember thinking within chatgpt about Sourdough and show overlap with build about consent dashboard project chatgpt general"
  );

  assert.equal(intent.mode, "recall");
  assert.equal(intent.query.toLowerCase(), "sourdough");
  assert.ok((intent.projectHint || "").toLowerCase().includes("chatgpt"));
  assert.ok(intent.confidence >= 0.7);
});

test("detects a known project name passed by the caller", () => {
  const intent = inferRecallIntent("what did I write about launch dates in the Product Roadmap thread", [
    "Product roadmap",
    "product-roadmap"
  ]);

  assert.equal(intent.projectHint, "product roadmap");
  assert.ok(intent.reasons.includes("project-hint-known-name"));
});

test("does not detect project names that were not passed in", () => {
  const intent = inferRecallIntent("what did I write about launch dates in the Product Roadmap thread");

  assert.equal(intent.projectHint, undefined);
});

test("correlation returns overlap rows", () => {
  const rows = [
    {
      threadId: "1",
      threadTitle: "Consent dashboard trust boundaries",
      projectName: "Product roadmap",
      excerpt: "policy evaluator and audit history"
    },
    {
      threadId: "2",
      threadTitle: "Meal prep",
      projectName: "Personal",
      excerpt: "rice and protein"
    }
  ];

  const correlated = correlateWithBuild(rows, "Build consent dashboard with policy evaluator");
  assert.equal(correlated.length, 1);
  assert.equal(correlated[0].threadId, "1");
});
