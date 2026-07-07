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
      title: "AAIF Strategy",
      update_time: "2026-07-05T10:00:00.000Z",
      mapping: {
        n1: {
          message: {
            author: { role: "user" },
            content: { parts: ["AAIF ambassador roadmap"] },
            create_time: "2026-07-05T09:00:00.000Z"
          }
        }
      }
    }
  ];
  const shardB = [
    {
      id: "conv-2",
      title: "Bitcoin Thesis",
      update_time: "2026-07-06T10:00:00.000Z",
      mapping: {
        n2: {
          message: {
            author: { role: "assistant" },
            content: { parts: ["Bitcoin proof of work"] },
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
  assert.equal(recent[0].title, "Bitcoin Thesis");

  const recall = await mod.recallFromThreads({
    query: "bitcoin",
    allowedProjectIds: ["chatgpt-general"],
    limit: 3
  });
  assert.equal(recall.length, 1);
  assert.equal(recall[0].threadTitle, "Bitcoin Thesis");

  const noneAllowed = await mod.recallFromThreads({
    query: "bitcoin",
    allowedProjectIds: ["aaif-ambassador"],
    limit: 3
  });
  assert.equal(noneAllowed.length, 0);

  const threadsFile = join(home, ".threadweaver", "chatgpt_threads.json");
  const saved = JSON.parse(await readFile(threadsFile, "utf8"));
  assert.equal(saved.length, 2);
});
