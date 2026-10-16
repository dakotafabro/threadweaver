import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

test("imports shard directory and returns recall/recent data", async () => {
  const home = await mkdtemp(join(tmpdir(), "tw-home-"));
  process.env.HOME = home;

  const exportDir = await mkdtemp(join(tmpdir(), "tw-export-"));
  const shardA = [
    {
      id: "conv-1",
      title: "Product Strategy",
      update_time: "2026-07-05T10:00:00.000Z",
      mapping: {
        n1: {
          message: {
            author: { role: "user" },
            content: { parts: ["Product roadmap"] },
            create_time: "2026-07-05T09:00:00.000Z"
          }
        }
      }
    }
  ];
  const shardB = [
    {
      id: "conv-2",
      title: "Sourdough Notes",
      update_time: "2026-07-06T10:00:00.000Z",
      mapping: {
        n2: {
          message: {
            author: { role: "assistant" },
            content: { parts: ["Sourdough starter feeding schedule"] },
            create_time: "2026-07-06T09:00:00.000Z"
          }
        }
      }
    }
  ];

  await writeFile(join(exportDir, "conversations-000.json"), JSON.stringify(shardA), "utf8");
  await writeFile(join(exportDir, "conversations-001.json"), JSON.stringify(shardB), "utf8");

  const mod = await import("./chatgptExport.js");
  const imported = await mod.importChatGptExport(exportDir);
  assert.equal(imported.threadsImported, 2);
  assert.equal(imported.projects.length, 1);
  assert.equal(imported.projects[0].id, "chatgpt-general");

  const recent = await mod.listRecentFromThreads({ limit: 2 });
  assert.equal(recent.length, 2);
  assert.equal(recent[0].title, "Sourdough Notes");

  const recall = await mod.recallFromThreads({
    query: "sourdough",
    allowedProjectIds: ["chatgpt-general"],
    limit: 3
  });
  assert.equal(recall.length, 1);
  assert.equal(recall[0].threadTitle, "Sourdough Notes");

  const noneAllowed = await mod.recallFromThreads({
    query: "sourdough",
    allowedProjectIds: ["product-roadmap"],
    limit: 3
  });
  assert.equal(noneAllowed.length, 0);

  const threadsFile = join(home, ".threadweaver", "chatgpt_threads.json");
  const saved = JSON.parse(await readFile(threadsFile, "utf8"));
  assert.equal(saved.length, 2);
});
