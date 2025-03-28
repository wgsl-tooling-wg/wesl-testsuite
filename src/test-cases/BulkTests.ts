import { BulkTest } from "../TestSchema.ts";

/** tests run on projects in the https://github.com/wgsl-tooling-wg/community-wgsl repo */
export const bulkTests: BulkTest[] = [
  {
    name: "webgpu-samples",
    baseDir: "webgpu-samples",
    globInclude: ["**/*.wgsl"],
    exclude: ["skinnedMesh", "cornell"],
  },
  {
    name: "boat_attack",
    baseDir: "unity_web_research/webgpu/wgsl/boat_attack",
    // A small set of wgsl files that mostly covers the unity bulk tests
    // Selected with the unique file finder https://github.com/wgsl-tooling-wg/wesl-js/issues/161
    include: [
      "unity_webgpu_0000020A44565050.fs.wgsl",
      "unity_webgpu_000001D9D2114040.fs.wgsl", // percent: 87.91
      "unity_webgpu_0000014DFB395020.fs.wgsl", // percent: 84.93
      "unity_webgpu_0000017E9E2D81A0.vs.wgsl", // percent: 88.46
      "unity_webgpu_00000277907BA020.fs.wgsl", // percent: 94.51
      "unity_webgpu_000002778F64B030.vs.wgsl", // percent: 80.51
      "unity_webgpu_000001F972AC3D10.vs.wgsl", // percent: 88.1
      "unity_webgpu_0000026E57303490.fs.wgsl", // percent: 83.46
      "unity_webgpu_000001D9D2114040.fs.wgsl", // percent: 85.15
      "unity_webgpu_000001D9CDD5C6D0.vs.wgsl", // percent: 85.54
      "unity_webgpu_0000026E59EE1060.fs.wgsl", // percent: 79.09
      "unity_webgpu_0000027196735090.vs.wgsl", // percent: 73.95
      "unity_webgpu_0000014C8AC70090.vs.wgsl", // percent: 41.31
      "unity_webgpu_0000026E5684E3F0.vs.wgsl", // percent: 44.55
      "unity_webgpu_000001AC1A2104D0.vs.wgsl", // percent: 59.44
      "unity_webgpu_000002778F5FFAB0.cs.wgsl", // percent: 75.98
      "unity_webgpu_00000232C7146770.vs.wgsl", // percent: 66.67
      "unity_webgpu_0000014C881FEE40.fs.wgsl", // percent: 29.41
      "unity_webgpu_00000232C59F6510.fs.wgsl", // percent: 53.19
      "unity_webgpu_000002778F5A9CB0.vs.wgsl", // percent: 24.1
      "unity_webgpu_0000026E55136DB0.vs.wgsl", // percent: 56.41
      "unity_webgpu_0000017E9CE2DAA0.fs.wgsl", // percent: 19.57
    ],
  },
  {
    name: "alpenglow",
    baseDir: "alpenglow-example-wgsl",
    globInclude: ["*.wgsl"],
    exclude: [
      "vec2u_radix_ex_02_scan_reduce",
      "rasterize_02_tile",
      "rasterize_01_atomic_initialize_addresses",
    ],
  },
];

export default bulkTests;
