import { ParsingTest } from "../TestSchema.js";

export const importSyntaxCases: ParsingTest[] = [
  /* ------  failure cases  -------   */

  { src: "import", fails: true },
  { src: "import;", fails: true },
  { src: "import foo", fails: true },
  { src: "import super;", fails: true },
  { src: "import super::;", fails: true },
  { src: "import super::super;", fails: true },
  { src: "import {};", fails: true },
  { src: "import {foo, {bar}};", fails: true },
  { src: "import { foo } as bar;", fails: true },
  { src: "import foo::{};", fails: true },
  { src: "import foo::a as b::b;", fails: true },
  { src: "import foo::super::bar::baz;", fails: true },
  { src: "import foo::bee as boo::bar;", fails: true },

  /* ------  success cases  -------   */

  { src: "import foo;" },
  { src: "import super::foo::bar;" },
  { src: "import super::super::foo::bar;" },
  { src: `import super::b::c::d;` },
  { src: "import super::foo ::bar;" },
  { src: `import a::b::c;` },
  { src: "import foo::bar;" },
  { src: "import { foo};" },
  { src: "import {a::b as c, d};" },
  { src: "import {a::b as c, d::{ e }, f};" },
  { src: "import foo::{a,b};" },
  { src: "import foo::{a, b};" },
  { src: "import foo::bar::{a, b};" },
  { src: "import a::{b, c };" },
  { src: "import foo::a as b;" },
  { src: `import a::b::{c as foo};` },
  {
    src: `import super::foo::bar;
          fn main() {}`,
  },
  {
    src: `
    import bevy_pbr::{
             mesh_view_bindings,
             utils::{PI, noise},
             lighting
           };`,
  },
];

export default importSyntaxCases;
