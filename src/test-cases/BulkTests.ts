import type { BulkTest } from "../TestSchema.ts";

/** tests run on projects in the https://github.com/wgsl-tooling-wg/community-wgsl repo */
export const bulkTests: BulkTest[] = [
  {
    name: "WebGPU Samples",
    baseDir: "shaders/webgpu-samples",
    git: {
      url: "https://github.com/webgpu/webgpu-samples.git",
      revision: "372c6171cb94f07f3ffacf930dd58235e547abaf",
    },
    exclude: ["sample/skinnedMesh/**/*", "sample/cornell/**/*"],
  },
  {
    name: "Boat Attack from Unity Web Research",
    baseDir: "shaders/unity_web_research",
    // A small set of wgsl files that mostly covers the unity bulk tests
    // Pre-selected with the unique file finder https://github.com/wgsl-tooling-wg/wesl-js/issues/161
  },
  {
    name: "Alpenglow",
    baseDir: "shaders/alpenglow",
  },
];

export default bulkTests;
