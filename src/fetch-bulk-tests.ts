import type { BulkTest } from "./TestSchema.ts";
import { gitFetch } from "./GitFetch.ts";

export const BaseDir = new URL("..", import.meta.url);

/** Fetch a bulk test's git repo if configured, otherwise no-op. */
export async function fetchBulkTest(bulkTest: BulkTest, root: URL = BaseDir) {
  if (!bulkTest.git) return;
  const { url, revision } = bulkTest.git;
  await gitFetch(url, revision, new URL(bulkTest.baseDir, root));
}
