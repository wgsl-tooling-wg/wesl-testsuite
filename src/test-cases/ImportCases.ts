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
    underscoreWgsl: `
      fn main() {
        package_bar_foo();
      }

      fn package_bar_foo() { }
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
      struct Uniforms { a: u32 }

      @group(0) @binding(0) var<uniform> u: Uniforms;

      fn main() { }
    `,
    underscoreWgsl: `
      struct Uniforms { a: u32 }

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
    underscoreWgsl: `
      fn main() {
        package_file1_foo();
      }

      fn package_file1_foo() { /* fooImpl */ }
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
    underscoreWgsl: `
      fn main() {
        package_file1_foo();
        package_file2_bar();
      }

      fn package_file1_foo() { /* fooImpl */ }

      fn package_file2_bar() { package_file1_foo(); }
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
    underscoreWgsl: `
      fn main() { package_file1_foo(); }

      fn conflicted() { }

      fn package_file1_foo() {
        package_file1_conflicted(0);
        package_file1_conflicted(1);
      }

      fn package_file1_conflicted(a:i32) {}
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
    underscoreWgsl: `
      fn main() { package_file1_foo(); package_file1_foo(); }

      fn package_file1_foo() { }
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
    underscoreWgsl: `
      fn main() {
        package_file1_mid();
      }

      fn grand() {
        /* main impl */
      }

      fn package_file1_mid() { package_file2_grand(); }

      fn package_file2_grand() { /* grandImpl */ }
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
    underscoreWgsl: `
      fn main() {
        package_file1_foo();
        package_file1_bar();
      }

      fn package_file1_foo() { }

      fn package_file1_bar() { }
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
    underscoreWgsl: `
      fn support() {
        package_file1_foo();
      }

      fn package_file1_foo() {
        package_file1_support();
      }

      fn package_file1_support() { }
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
    underscoreWgsl: `
      fn support() {
        package_file1_foo();
      }

      fn package_file1_foo() {
        package_file1_support();
        package_file2_bar();
      }

      fn package_file1_support() { }

      fn package_file2_bar() {
        package_file2_support();
      }

      fn package_file2_support() { }
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
    underscoreWgsl: `
      fn main() {
        package_file1_foo();
        package_file1_bar();
      }

      fn package_file1_foo() {
        package_file1_support();
      }

      fn package_file1_bar() {
        package_file1_support();
      }

      fn package_file1_support() { }
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
            x: u32
          }
      `,
    },
    expectedWgsl: `
      fn main() {
        let a = AStruct(1u);
      }

      struct AStruct { x: u32 }
    `,
    underscoreWgsl: `
      fn main() {
        let a = package_file1_AStruct(1u);
      }

      struct package_file1_AStruct { x: u32 }
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
    },
    expectedWgsl: `
      fn main() {
        let ze = elemOne();
      }

      fn elemOne() -> Elem {
        return Elem(1u);
      }

      struct Elem { sum: u32 }
    `,
    underscoreWgsl: `
      fn main() {
        let ze = package_file1_elemOne();
      }
      fn package_file1_elemOne() -> package_file1_Elem {
        return package_file1_Elem(1u);
      }
      struct package_file1_Elem { sum: u32 }
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
          s: BStruct
        }
      `,
      "./file2.wgsl": `
        struct BStruct {
          x: u32
        }
      `,
    },
    expectedWgsl: `
      struct SrcStruct { a: AStruct }

      struct AStruct { s: BStruct }

      struct BStruct { x: u32 }
    `,
    underscoreWgsl: `
      struct SrcStruct { a: package_file1_AStruct }
      struct package_file1_AStruct { s: package_file2_BStruct }
      struct package_file2_BStruct { x: u32 }
    `,
  },

  {
    name: "'import as' a struct",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::AStruct as AA;

        fn foo(a: AA) { }
      `,
      "./file1.wgsl": `
        struct AStruct { x: u32 }
      `,
    },
    expectedWgsl: `
      fn foo(a: AA) { }

      struct AA { x: u32 }
    `,
    underscoreWgsl: `
      fn foo(a: package_file1_AStruct) { }
      struct package_file1_AStruct { x: u32 }
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
      struct Base { b: i32 }

      fn foo() -> AStruct {var a:AStruct; return a;}

      struct AStruct { x: Base0 }

      struct Base0 { x: u32 }
    `,
    underscoreWgsl: `
      struct Base { b: i32 }
      fn foo() -> package_file1_AStruct {var a:package_file1_AStruct; return a;}
      struct package_file1_AStruct { x: package_file1_Base }
      struct package_file1_Base { x: u32 }
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
        diagnostic(off, derivative_uniformity);
      `,
    },
    expectedWgsl: `
      diagnostic(off, derivative_uniformity);
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

        struct AStruct { x: u32 }
    `,
    underscoreWgsl: `
      fn main() { package_file1_foo(); }
      fn package_file1_foo(a: package_file1_AStruct) {
        let b = a.x;
      }
      struct package_file1_AStruct { x: u32 }
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
    underscoreWgsl: `
      fn main() { package_file1_foo(); }
      fn package_file1_foo() {
        let a = package_file1_conA;
      }
      const package_file1_conA = 7;
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
    underscoreWgsl: `
      fn main() { package_file1_foo_bar(); }
      fn package_file1_foo_bar() { }
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
    underscoreWgsl: `
        fn main() {
          var a: package_file1_AStruct;
        }
        struct package_file1_AStruct { x: u32 }
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
    underscoreWgsl: `
        @group(0) @binding(0) var<uniform> u: package_file1_Uniforms;
        struct package_file1_Uniforms { model: mat4x4<f32> }
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
    underscoreWgsl: `
        fn b() -> package_file1_A { }
        struct package_file1_A { y: i32 }
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
    underscoreWgsl: `
        fn m() { let a = package_file1_conA; }
        const package_file1_conA = 11;
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
    underscoreWgsl: `
        fn m() { let a: package_file1_aliasA = 4; }
        alias package_file1_aliasA = u32;
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
    underscoreWgsl: `
      fn main() { package_file1_foo(); }
      fn package_file1_foo(a: package_file1_f32) { }
      alias package_file1_f32 = package_file1_AStruct;
      struct package_file1_AStruct { x: u32 }
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
    underscoreWgsl: `
      fn main() { package_file1_foo(); }
      fn package_file1_foo() { package_file1_f32(); }
      fn package_file1_f32() { }
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
    underscoreWgsl: `
      fn main() { package_file1_foo(); }
      fn package_file1_foo() { package_file2_bar(); }
      fn package_file2_bar() { package_file1_fie(); }
      fn package_file1_fie() {}
    `,
  },
  {
    name: "inline package reference",
    weslSrc: {
      "./main.wgsl": `
        fn main() {
          package::file1::bar();
        }
      `,
      "./file1.wgsl": `
        fn bar() { }
      `,
    },
    expectedWgsl: `
        fn main() {
          bar();
        }
        fn bar() { }
    `,
    underscoreWgsl: `
        fn main() {
          package_file1_bar();
        }
        fn package_file1_bar() { }
    `,
  },
  {
    name: "inline super:: reference",
    weslSrc: {
      "./main.wgsl": `
        fn main() {
          super::file1::bar();
        }
      `,
      "./file1.wgsl": `
        fn bar() { }
      `,
    },
    expectedWgsl: `
        fn main() {
          bar();
        }
        fn bar() { }
    `,
    underscoreWgsl: `
        fn main() {
          package_file1_bar();
        }
        fn package_file1_bar() { }
    `,
  },
  {
    name: "import super::file1",
    weslSrc: {
      "./main.wgsl": `
        import super::file1;

        fn main() {
          file1::bar();
        }
      `,
      "./file1.wgsl": `
        fn bar() { }
      `,
    },
    expectedWgsl: `
        fn main() {
          bar();
        }
        fn bar() { }
    `,
    underscoreWgsl: `
        fn main() {
          package_file1_bar();
        }
        fn package_file1_bar() { }
    `,
  },
  {
    name: "declaration after subscope",
    weslSrc: {
      "./main.wgsl": `
        import package::file1::foo;

        fn main() {
          {
            foo();
          }
          var foo = 1;
        }
      `,
      "./file1.wgsl": `
        fn foo() { }
      `,
    },
    expectedWgsl: `
      fn main() {
        {
          foo();
        }
        var foo = 1;
      }
      fn foo() { }
    `,
    underscoreWgsl: `
      fn main() {
        {
          package_file1_foo();
        }
        var foo = 1;
      }
      fn package_file1_foo() { }
    `,
  },

  {
    name: "uninitialized global var",
    weslSrc: {
      "./main.wgsl": `
        import package::rand::{initRNG};

        struct FragmentInput {
            pixel: vec2f,
            frame: f32,
        }

        @fragment
        fn fragment(in: FragmentInput) -> vec4f {
            initRNG(in.pixel, in.frame);
            return vec4f(1.0, 0.0, 0.0, 1.0);
        }
      `,
      "./rand.wgsl": `
        var<private> rngState: u32;

        fn initRNG(pixel: vec2u, frame: u32) {
            rngState = pixel.x + pixel.y * 1000u + frame * 100000u;
        }
      `,
    },
    expectedWgsl: `
      struct FragmentInput {
        pixel: vec2f,
        frame: f32,
      }

      @fragment fn fragment(in: FragmentInput) -> vec4f {
        initRNG(in.pixel, in.frame);
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }

      fn initRNG(pixel: vec2u, frame: u32) {
        rngState = pixel.x + pixel.y * 1000u + frame * 100000u;
      }

      var<private> rngState: u32;
    `,
    underscoreWgsl: `
      struct FragmentInput {
        pixel: vec2f,
        frame: f32,
      }

      @fragment fn fragment(in: FragmentInput) -> vec4f {
        package_rand_initRNG(in.pixel, in.frame);
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }

      fn package_rand_initRNG(pixel: vec2u, frame: u32) {
        package_rand_rngState = pixel.x + pixel.y * 1000u + frame * 100000u;
      }

      var<private> package_rand_rngState: u32;
    `,
  },

  // TODO add case for uninitialized override

  {
    name: "import var with struct type",
    weslSrc: {
      "./main.wgsl": `
          var a = package::file1::b;
      `,
      "./file1.wgsl": `
          struct Bee { sting: f32 }
          var b: Bee;
      `,
    },
    expectedWgsl: `
      var a = b;
      var b: Bee;
      struct Bee { sting: f32 }
    `,
    underscoreWgsl: `
      var a = package_file1_b;
      var package_file1_b: package_file1_Bee;
      struct package_file1_Bee { sting: f32 }
    `,
  },

  {
    name: "import var<private> with struct type",
    weslSrc: {
      "./main.wgsl": `
          var<private> a = package::file1::b;
      `,
      "./file1.wgsl": `
          struct Bee { sting: f32 }
          var<private> b: Bee;
      `,
    },
    expectedWgsl: `
      var<private> a = b;
      var<private> b: Bee;
      struct Bee { sting: f32 }
    `,
    underscoreWgsl: `
      var<private> a = package_file1_b;
      var<private> package_file1_b: package_file1_Bee;
      struct package_file1_Bee { sting: f32 }
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
  //   underscoreWgsl: `
  //   `
  // },
];

export default importCases;
