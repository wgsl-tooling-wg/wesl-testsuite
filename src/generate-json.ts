import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { bulkTests } from "../src/test-cases/BulkTests.ts";
import { conditionalTranslationCases } from "../src/test-cases/ConditionalTranslationCases.ts";
import { importCases } from "../src/test-cases/ImportCases.ts";
import { importSyntaxCases } from "../src/test-cases/ImportSyntaxCases.ts";

const testCases = {
  bulkTests,
  conditionalTranslationCases,
  importCases,
  importSyntaxCases,
};

await Promise.allSettled(
  Object.entries(testCases).map(([key, value]) => {
    return fs.writeFile(
      `src/test-cases-json/${key}.json`,
      JSON.stringify(value, replacer, 2),
      "utf-8"
    );
  })
);

function replacer(_key: any, value: any) {
  if (typeof value === "string") {
    return value.trim().replace(/\s+/g, " ");
  } else {
    return value;
  }
}

// And now try cloning the git repos
// Modeled after https://github.com/gfx-rs/wgpu/blob/c0a580d6f0343a725b3defa8be4fdf0a9691eaad/xtask/src/cts.rs
for (const bulkTest of bulkTests) {
  if (bulkTest.git) {
    if (
      await fs.access(bulkTest.baseDir).then(
        () => true,
        () => false
      )
    ) {
      const checkCommit = spawnSync(
        "git",
        ["cat-file", "commit", bulkTest.git.revision],
        {
          cwd: bulkTest.baseDir,
        }
      );
      if (checkCommit.status !== 0) {
        const fetchCommit = spawnSync("git", ["fetch", "--quiet"], {
          cwd: bulkTest.baseDir,
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
          cwd: bulkTest.baseDir,
        }
      );
      if (checkoutCommit.status !== 0) {
        throw new Error(
          `Checking out ${bulkTest.git.url} ${bulkTest.git.revision} failed ` +
            checkoutCommit.stderr.toString()
        );
      }
    } else {
      const cloneResult = spawnSync("git", [
        "clone",
        "--depth=1",
        bulkTest.git.url,
        "--revision",
        bulkTest.git.revision,
        bulkTest.baseDir,
      ]);
      if (cloneResult.status !== 0) {
        throw new Error(
          `Cloning ${bulkTest.git.url} ${bulkTest.git.revision} failed ` +
            cloneResult.stderr.toString()
        );
      }
    }
  }
}
