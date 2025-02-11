export interface WgslTestSrc {
  name: string;                 // human readable description of test
  src: Record<string, string>;  // source wgsl+ texts, keys are file paths
  notes?: string;               // additional notes to test implementors
}

export interface ParsingTest {
  name?: string;
  src: string;
  fails?: true;
  message?: string;
}

export interface BulkTest {
  name: string;           // human readable name of test set
  baseDir: string;        // directory within https://github.com/wgsl-tooling-wg/community-wgsl 
  exclude?: string[];     // exclude files containing these strings or regexes
  include?: string[];     // names of test files inside of baseDir ('/' as separator for partial paths)
  globInclude?: string[]; // glob patters of test files
}
