import fs from "node:fs/promises";
import { bulkTests } from "../src/test-cases/BulkTests.ts";
import { conditionalTranslationCases } from "../src/test-cases/ConditionalTranslationCases.ts";
import { importCases } from "../src/test-cases/ImportCases.ts";
import { importSyntaxCases } from "../src/test-cases/ImportSyntaxCases.ts";
import { fetchBulkTest } from "./fetch-bulk-tests.ts";

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

for (const bulkTest of bulkTests) {
  fetchBulkTest(bulkTest);
}
