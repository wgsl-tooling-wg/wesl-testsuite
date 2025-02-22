export interface WgslTestSrc {
  /** human readable description of test */
  name: string;
  /** source wesl+ texts, keys are file paths */
  weslSrc: Record<string, string>;
  /** additional notes to test implementors */
  notes?: string;
  /**
   * Expected linked result wgsl.
   * Uses the minimal mangling strategy, see [NameMangling.md](https://github.com/wgsl-tooling-wg/wesl-spec/blob/main/NameMangling.md)
   */
  expectedWgsl?: string;
  /**
   * Expected linked result wgsl.
   * Uses the underscore-count mangling strategy, see [NameMangling.md](https://github.com/wgsl-tooling-wg/wesl-spec/blob/main/NameMangling.md)
   */
  underscoreWgsl?: string;
}

export interface ParsingTest {
  src: string;
  fails?: true;
}

export interface BulkTest {
  /** human readable name of test set */
  name: string;
  /** directory within https://github.com/wgsl-tooling-wg/community-wgsl  */
  baseDir: string;
  /** exclude files containing these strings or regexes */
  exclude?: string[];
  /** names of test files inside of baseDir ('/' as separator for partial paths) */
  include?: string[];
  /** glob patters of test files */
  globInclude?: string[];
}
