import type { BulkTest } from "../TestSchema.ts";

/** tests run on projects in the https://github.com/wgsl-tooling-wg/community-wgsl repo */
export const bulkTests: BulkTest[] = [
  {
    name: "WebGPU Samples",
    baseDir: "shaders/webgpu-samples",
    git: {
      url: "https://github.com/webgpu/webgpu-samples.git",
      revision: "8facdad40d303b9650f975bed00e68a1409d9bc2",
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
