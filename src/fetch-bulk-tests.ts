import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import type { BulkTest } from "./TestSchema.ts";

// Modeled after https://github.com/gfx-rs/wgpu/blob/c0a580d6f0343a725b3defa8be4fdf0a9691eaad/xtask/src/cts.rs
export async function fetchBulkTest(bulkTest: BulkTest) {
  if (!bulkTest.git) return;

  const baseDir = new URL(bulkTest.baseDir, new URL("..", import.meta.url));
  if (
    await fs.access(baseDir).then(
      () => true,
      () => false
    )
  ) {
    const checkCommit = spawnSync(
      "git",
      ["cat-file", "commit", bulkTest.git.revision],
      {
        cwd: baseDir,
      }
    );
    if (checkCommit.status !== 0) {
      const fetchCommit = spawnSync("git", ["fetch", "--quiet"], {
        cwd: baseDir,
      });
      if (fetchCommit.status !== 0) {
        throw new Error(
          `Fetching ${bulkTest.git.url} ${bulkTest.git.revision} failed ` +
            fetchCommit.stderr.toString()
        );
      }
    }

    const checkoutCommit = spawnSync(
      "git",
      ["checkout", "--quiet", bulkTest.git.revision],
      {
        cwd: baseDir,
      }
    );
    if (checkoutCommit.status !== 0) {
      throw new Error(
        `Checking out ${bulkTest.git.url} ${bulkTest.git.revision} failed ` +
          checkoutCommit.stderr.toString()
      );
    }
  } else {
    const cloneResult = spawnSync(
      "git",
      [
        "clone",
        "--depth=1",
        bulkTest.git.url,
        "--revision",
        bulkTest.git.revision,
        bulkTest.baseDir,
      ],
      {
        cwd: new URL("..", import.meta.url),
      }
    );
    if (cloneResult.status !== 0) {
      throw new Error(
        `Cloning ${bulkTest.git.url} ${bulkTest.git.revision} failed ` +
          cloneResult.stderr.toString()
      );
    }
  }
}
