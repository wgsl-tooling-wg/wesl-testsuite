import { WgslTestSrc } from "../TestSchema.js";

export const importCases: WgslTestSrc[] = [
  {
    name: `import package::bar::foo;`,
    weslSrc: {
      "./main.wgsl": `
          import package::bar::foo;
          fn main() {
            foo();
          }
       `,
      "./bar.wgsl": `
          fn foo() { }
       `,
    },
    expectedWgsl: `
      fn main() {
        foo();
      }

      fn foo() { }
    `,
  },
  {
    name: `main has other root elements`,
    weslSrc: {
      "./main.wgsl": `
          struct Uniforms {
            a: u32
          }

          @group(0) @binding(0) var<uniform> u: Uniforms;

          fn main() { }
      `,
    },
    expectedWgsl: `
      struct Uniforms {
        a: u32
      }

      @group(0) @binding(0) var<uniform> u: Uniforms;

      fn main() { }
    `,
  },
  {
    name: `import foo as bar`,
    weslSrc: {
      "./main.wgsl": `
        import package::file1::foo as bar;

        fn main() {
          bar();
        }
      `,
      "./file1.wgsl": `
        fn foo() { /* fooImpl */ }
      `,
    },
    expectedWgsl: `
      fn main() {
        bar();
      }

      fn bar() { /* fooImpl */ }
    `,
  },
  {
    name: `import twice doesn't get two copies`,
    weslSrc: {
      "./main.wgsl": `
        import package::file1::foo;
        import package::file2::bar;

        fn main() {
          foo();
          bar();
        }
      `,
      "./file1.wgsl": `
        fn foo() { /* fooImpl */ }
      `,
      "./file2.wgsl": `
        import package::file1::foo;
        fn bar() { foo(); }
      `,
    },
    expectedWgsl: `
      fn main() {
        foo();
        bar();
      }

      fn foo() { /* fooImpl */ }

      fn bar() { foo(); }
    `,
  },
  {
    name: `imported fn calls support fn with root conflict`,
    weslSrc: {
      "./main.wgsl": `
        import package::file1::foo; 

        fn main() { foo(); }
        fn conflicted() { }
      `,
      "./file1.wgsl": `
        fn foo() {
          conflicted(0);
          conflicted(1);
        }
        fn conflicted(a:i32) {}
      `,
    },
    expectedWgsl: `
      fn main() { foo(); }

      fn conflicted() { }

      fn foo() {
        conflicted0(0);
        conflicted0(1);
      }

      fn conflicted0(a:i32) {}
    `,
  },
  {
    name: `import twice with two as names`,
    weslSrc: {
      "./main.wgsl": `
        import package::file1::foo as bar;
        import package::file1::foo as zap;

        fn main() { bar(); zap(); }
      `,
      "./file1.wgsl": `
        fn foo() { }
      `,
    },
    expectedWgsl: `
      fn main() { bar(); bar(); }

      fn bar() { }
    `,
  },
  {
    name: `import transitive conflicts with main`,
    weslSrc: {
      "./main.wgsl": `
        import package::file1::mid;

        fn main() {
          mid();
        }

        fn grand() {
          /* main impl */
        }
      `,
      "./file1.wgsl": `
        import package::file2::grand;
        
        fn mid() { grand(); }
      `,
      "./file2.wgsl": `
        fn grand() { /* grandImpl */ }
      `,
    },
    expectedWgsl: `
      fn main() {
        mid();
      }

      fn grand() {
        /* main impl */
      }

      fn mid() { grand0(); }

      fn grand0() { /* grandImpl */ }
    `,
  },

  {
    name: `multiple exports from the same module`,
    weslSrc: {
      "./main.wgsl": `
        import package::file1::{foo, bar};

        fn main() {
          foo();
          bar();
        }
      `,
      "./file1.wgsl": `
        fn foo() { }
        fn bar() { }
      `,
    },
    expectedWgsl: `
      fn main() {
        foo();
        bar();
      }

      fn foo() { }

      fn bar() { }
    `,
  },

  {
    name: `import and resolve conflicting support function`,
    weslSrc: {
      "./main.wgsl": `
        import package::file1::foo as bar;

        fn support() { 
          bar();
        }
      `,
      "./file1.wgsl": `
        fn foo() {
          support();
        }

        fn support() { }
      `,
    },
    expectedWgsl: `
      fn support() {
        bar();
      }

      fn bar() {
        support0();
      }

      fn support0() { }
    `,
  },

  {
    name: `import support fn that references another import`,
    weslSrc: {
      "./main.wgsl": `
        import package::file1::foo;

        fn support() { 
          foo();
        }
      `,
      "./file1.wgsl": `
        import package::file2::bar;

        fn foo() {
          support();
          bar();
        }

        fn support() { }
      `,
      "./file2.wgsl": `
        fn bar() {
          support();
        }

        fn support() { }
      `,
    },
    expectedWgsl: `
      fn support() {
        foo();
      }

      fn foo() {
        support0();
        bar();
      }

      fn support0() { }

      fn bar() {
        support1();
      }

      fn support1() { }
    `,
  },
  {
    name: "import support fn from two exports",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::foo;
        import package::file1::bar;
        fn main() {
          foo();
          bar();
        }
      `,
      "./file1.wgsl": `
        fn foo() {
          support();
        }

        fn bar() {
          support();
        }

        fn support() { }
      `,
    },
    expectedWgsl: `
      fn main() {
        foo();
        bar();
      }

      fn foo() {
        support();
      }

      fn bar() {
        support();
      }

      fn support() { }
    `,
  },

  {
    name: "import a struct",
    weslSrc: {
      "./main.wgsl": `
          import package::file1::AStruct;

          fn main() {
            let a = AStruct(1u); 
          }
      `,
      "./file1.wgsl": `
        struct AStruct {
          x: u32,
        }
      `,
      "./file2.wgsl": `
      `,
    },
    expectedWgsl: `
      fn main() {
        let a = AStruct(1u);
      }

      struct AStruct {
        x: u32,
      }
    `,
  },

  {
    name: "import fn with support struct constructor",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::elemOne;

        fn main() {
          let ze = elemOne();
        }
      `,
      "./file1.wgsl": `
        struct Elem {
          sum: u32
        }

        fn elemOne() -> Elem {
          return Elem(1u);
        }
      `,
      "./file2.wgsl": `
      `,
    },
    expectedWgsl: `
      fn main() {
        let ze = elemOne();
      }

      fn elemOne() -> Elem {
        return Elem(1u);
      }

      struct Elem {
        sum: u32
      }
    `,
  },
  {
    name: "import a transitive struct",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::AStruct;

        struct SrcStruct {
          a: AStruct,
        }
      `,
      "./file1.wgsl": `
        import package::file2::BStruct;

        struct AStruct {
          s: BStruct,
        }
      `,
      "./file2.wgsl": `
        struct BStruct {
          x: u32,
        }
      `,
    },
    expectedWgsl: `
      struct SrcStruct {
        a: AStruct,
      }

      struct AStruct {
        s: BStruct,
      }

      struct BStruct {
        x: u32,
      }
    `,
  },

  {
    name: "'import as' a struct",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::AStruct as AA;

        fn foo (a: AA) { }
      `,
      "./file1.wgsl": `
        struct AStruct { x: u32 }
      `,
    },
    expectedWgsl: `
      fn foo (a: AA) { }

      struct AA { x: u32 }
    `,
  },

  {
    name: "import a struct with name conflicting support struct",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::AStruct;

        struct Base {
          b: i32
        }

        fn foo() -> AStruct {var a:AStruct; return a;}
      `,
      "./file1.wgsl": `
        struct Base {
          x: u32
        }

        struct AStruct {
          x: Base
        }
      `,
    },
    expectedWgsl: `
      struct Base {
        b: i32
      }

      fn foo() -> AStruct {var a:AStruct; return a;}

      struct AStruct {
        x: Base0
      }

      struct Base0 {
        x: u32
      }
    `,
  },
  {
    name: "copy alias to output",
    weslSrc: {
      "./main.wgsl": `
        alias MyType = u32;
      `,
    },
    expectedWgsl: `
      alias MyType = u32;
    `,
  },
  {
    name: "copy diagnostics to output",
    weslSrc: {
      "./main.wgsl": `
        diagnostic(off,derivative_uniformity);
      `,
    },
    expectedWgsl: `
      diagnostic(off,derivative_uniformity);
    `,
  },
  {
    name: "struct referenced by a fn param",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::foo;

        fn main() { foo(); }
      `,
      "./file1.wgsl": `
        struct AStruct {
          x: u32
        }
        fn foo(a: AStruct) {
          let b = a.x;
        }
      `,
    },
    expectedWgsl: `
        fn main() { foo(); }

        fn foo(a: AStruct) { 
          let b = a.x;
        }

        struct AStruct {
          x: u32
        }
    `,
  },
  {
    name: "const referenced by imported fn",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::foo;

        fn main() { foo(); }
      `,
      "./file1.wgsl": `
        const conA = 7;

        fn foo() {
          let a = conA;
        }
      `,
    },
    expectedWgsl: `
        fn main() { foo(); }

        fn foo() {
          let a = conA;
        }

        const conA = 7;
    `,
  },
  {
    name: "fn call with a separator",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::foo;

        fn main() { foo::bar(); }
      `,
      "./file1/foo.wgsl": `
        fn bar() { }
      `,
    },
    expectedWgsl: `
        fn main() { bar(); }

        fn bar() { }
    `,
  },
  {
    name: "local var to struct",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::AStruct;

        fn main() {
          var a: AStruct; 
        }
      `,
      "./file1.wgsl": `
        struct AStruct { x: u32 }
      `,
    },
    expectedWgsl: `
        fn main() {
          var a: AStruct; 
        }
        struct AStruct { x: u32 }
    `,
  },
  {
    name: "global var to struct",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::Uniforms;

        @group(0) @binding(0) var<uniform> u: Uniforms;      
      `,
      "./file1.wgsl": `
        struct Uniforms { model: mat4x4<f32> }
      `,
    },
    expectedWgsl: `
        @group(0) @binding(0) var<uniform> u: Uniforms;      
        struct Uniforms { model: mat4x4<f32> }
    `,
  },
  {
    name: "return type of function",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::A;

        fn b() -> A { }
      `,
      "./file1.wgsl": `
        struct A { y: i32 }
      `,
    },
    expectedWgsl: `
        fn b() -> A { }
        struct A { y: i32 }
    `,
  },
  {
    name: "import a const",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::conA;

        fn m() { let a = conA; }
      `,
      "./file1.wgsl": `
        const conA = 11;
      `,
    },
    expectedWgsl: `
        fn m() { let a = conA; }
        const conA = 11;
    `,
  },
  {
    name: "import an alias",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::aliasA;

        fn m() { let a: aliasA = 4; }
      `,
      "./file1.wgsl": `
        alias aliasA = u32;
      `,
    },
    expectedWgsl: `
        fn m() { let a: aliasA = 4; }
        alias aliasA = u32;
    `,
  },
  {
    name: "alias f32",
    weslSrc: {
      "./main.wgsl": `
      import package::file1::foo;
      fn main() { foo(); }
      `,
      "./file1.wgsl": `
      struct AStruct { x: u32 }
      alias f32 = AStruct;
      fn foo(a: f32) { }
      `,
    },
    expectedWgsl: `
      fn main() { foo(); }
      fn foo(a: f32) { }
      alias f32 = AStruct;
      struct AStruct { x: u32 }
    `,
  },
  {
    name: "fn f32()",
    weslSrc: {
      "./main.wgsl": `
      import package::file1::foo;
      fn main() { foo(); }
      `,
      "./file1.wgsl": `
      fn f32() { }
      fn foo() { f32(); }
      `,
      "./file2.wgsl": `
      `,
    },
    expectedWgsl: `
      fn main() { foo(); }
      fn foo() { f32(); }
      fn f32() { }
    `,
  },
  {
    name: "circular import",
    weslSrc: {
      "./main.wgsl": `
      import package::file1::foo;
      fn main() { foo(); }
      `,
      "./file1.wgsl": `
      import package::file2::bar;
      fn foo() { bar(); }
      fn fie() {}
      `,
      "./file2.wgsl": `
      import package::file1::fie;
      fn bar() { fie(); }
      `,
    },
    expectedWgsl: `
      fn main() { foo(); }
      fn foo() { bar(); }
      fn bar() { fie(); }
      fn fie() {}
    `,
  },

  // {
  //   name: "",
  //   weslSrc: {
  //     "./main.wgsl": `
  //     `,
  //     "./file1.wgsl": `
  //     `,
  //     "./file2.wgsl": `
  //     `,
  //   },
  //   expectedWgsl: `
  //   `,
  // },


];

export default importCases;
