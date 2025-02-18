// prettier-ignore
export interface WgslTestSrc {
  name: string;                     // human readable description of test
  weslSrc: Record<string, string>;  // source wesl+ texts, keys are file paths
  notes?: string;                   // additional notes to test implementors
  expectedWgsl?: string;            // expected linked result wgsl 
  underscoreWgsl?: string;          // expected linked result wgsl using underscore mangler
}

export interface ParsingTest {
  src: string;
  fails?: true;
}

// prettier-ignore
export interface BulkTest {
  name: string;           // human readable name of test set
  baseDir: string;        // directory within https://github.com/wgsl-tooling-wg/community-wgsl 
  exclude?: string[];     // exclude files containing these strings or regexes
  include?: string[];     // names of test files inside of baseDir ('/' as separator for partial paths)
  globInclude?: string[]; // glob patters of test files
}
