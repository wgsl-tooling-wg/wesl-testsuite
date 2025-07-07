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
  /** directory within this repository  */
  source:
    | {
        dir: string;
      }
    | {
        /**
         * A HTTP git URL.
         * Fetch these tests via `git clone --depth=1 URL-GOES-HERE --revision REVISION-GOES-HERE
         */
        gitUrl: string;
        revision: string;
        /** inclusion globs, default value is all wesl and wgsl files */
        include?: string[];
        /** exclusion globs */
        exclude?: string[];
      };
}
