import type { WgslTestSrc } from "../TestSchema.ts";

export const conditionalTranslationCases: WgslTestSrc[] = [
  // first we check that if attributes work on all valid locations.
  // https://github.com/wgsl-tooling-wg/wesl-spec/blob/main/ConditionalTranslation.md#location-of-translate-time-attributes
  {
    name: "@if on diagnostic directive",
    weslSrc: {
      "./main.wgsl": `
        @if(true) diagnostic(error, foo);
        @if(false) diagnostic(error, bar);`,
    },
    expectedWgsl: "diagnostic(error, foo);",
  },
  {
    name: "@if on enable directive",
    weslSrc: {
      "./main.wgsl": `
        @if(true) enable foo;
        @if(false) enable bar;`,
    },
    expectedWgsl: "enable foo;",
  },
  {
    name: "@if on requires directive",
    weslSrc: {
      "./main.wgsl": `
        @if(true) requires foo;
        @if(false) requires bar;`,
    },
    expectedWgsl: "requires foo;",
  },
  {
    name: "@if on global const declaration",
    weslSrc: {
      "./main.wgsl": `
        @if(true) const foo = 10;
        @if(false) const bar = 10;`,
    },
    expectedWgsl: "const foo = 10;",
  },
  {
    name: "@if on global override declaration",
    weslSrc: {
      "./main.wgsl": `
        @if(true) override foo = 10;
        @if(false) override bar = 10;`,
    },
    expectedWgsl: "override foo = 10;",
  },
  {
    name: "@if on global variable declaration",
    weslSrc: {
      "./main.wgsl": `
        @if(true) var<private> foo = 10;
        @if(false) var<private> bar = 10;`,
    },
    expectedWgsl: "var<private> foo = 10;",
  },
  {
    name: "@if on type alias",
    weslSrc: {
      "./main.wgsl": `
        @if(true) alias foo = f32;
        @if(false) alias bar = f32;`,
    },
    expectedWgsl: "alias foo = f32;",
  },
  {
    name: "@if on module-scope const_assert",
    weslSrc: {
      "./main.wgsl": `
        @if(true) const_assert 0 < 1;
        @if(false) const_assert 1 < 2;`,
    },
    expectedWgsl: "const_assert 0 < 1;",
  },
  {
    name: "@if on function declaration",
    weslSrc: {
      "./main.wgsl": `
        @if(true) fn foo() {}
        @if(false) fn bar() {}`,
    },
    expectedWgsl: "fn foo() {}",
  },
  {
    name: "@if on function formal parameter",
    weslSrc: {
      "./main.wgsl": `
        fn func(@if(true) foo: u32, @if(false) bar: u32) {}`,
    },
    expectedWgsl: "fn func(foo: u32) {}",
  },
  {
    name: "@if on structure declaration",
    weslSrc: {
      "./main.wgsl": `
        @if(true) struct foo { x: u32 }
        @if(false) struct bar { x: u32 }`,
    },
    expectedWgsl: `
      struct foo { x: u32 }`,
  },
  {
    name: "@if on structure member",
    weslSrc: {
      "./main.wgsl": `
        struct s {
          @if(true) foo: u32,
          @if(false) bar: u32,
        }`,
    },
    expectedWgsl: `
      struct s { foo: u32 }`,
  },
  {
    name: "@if on compound statement",
    weslSrc: {
      "./main.wgsl": `
        fn func() {
          @if(true) { const foo = 10; }
          @if(false) { const bar = 10; }
        }`,
    },
    expectedWgsl: `
      fn func() {
        { const foo = 10; }
      }`,
  },
  {
    name: "@if on if statement",
    weslSrc: {
      "./main.wgsl": `
        fn func() {
          @if(true) if 0 < 1 { const foo = 10; }
          @if(false) if 0 < 1 { const bar = 10; }
        }`,
    },
    expectedWgsl: `
      fn func() {
        if 0 < 1 { const foo = 10; }
      }`,
  },
  {
    name: "@if on switch statement",
    weslSrc: {
      "./main.wgsl": `
        fn func() {
          @if(true) switch 0 { default { let foo = 10; } }
          @if(false) switch 0 { default { let bar = 10; } }
        }`,
    },
    expectedWgsl: `
      fn func() {
        switch 0 { default { let foo = 10; } }
      }`,
  },
  {
    name: "@if on switch clause",
    weslSrc: {
      "./main.wgsl": `
        fn func() {
          switch 0 {
            @if(true) default { let foo = 10; }
            @if(false) default { let bar = 10; }
          }
        }`,
    },
    expectedWgsl: `
      fn func() {
        switch 0 {
          default { let foo = 10; }
        }
      }`,
  },
  {
    name: "@if on loop statement",
    weslSrc: {
      "./main.wgsl": `
        fn func() {
          @if(true) loop { const foo = 10; }
          @if(false) loop { const bar = 10; }
        }`,
    },
    expectedWgsl: `
      fn func() {
        loop { const foo = 10; }
      }`,
  },
  {
    name: "@if on for statement",
    weslSrc: {
      "./main.wgsl": `
        fn func() {
          @if(true) for (var foo = 0; foo < 10; foo++) {}
          @if(false) for (var bar = 0; bar < 10; bar++) {}
        }`,
    },
    expectedWgsl: `
      fn func() {
        for (var foo = 0; foo < 10; foo++) {}
      }`,
  },
  {
    name: "@if on while statement",
    weslSrc: {
      "./main.wgsl": `
        fn func() {
          @if(true) while true { const foo = 10; }
          @if(false) while true { const bar = 10; }
        }`,
    },
    expectedWgsl: `
      fn func() {
        while true { const foo = 10; }
      }`,
  },
  {
    name: "@if on break statement",
    weslSrc: {
      "./main.wgsl": `
        fn foo() { while true { @if(true) break; }; }
        fn bar() { while true { @if(false) break; }; }`,
    },
    expectedWgsl: `
      fn foo() { while true {  break; }; }
      fn bar() { while true {  }; }`,
  },
  {
    name: "@if on break-if statement",
    weslSrc: {
      "./main.wgsl": `
        fn foo() { loop { continuing { @if(true) break if 0 < 1; } } }
        fn bar() { loop { continuing { @if(false) break if 1 < 2; } } }`,
    },
    expectedWgsl: `
      fn foo() { loop { continuing {  break if 0 < 1; } } }
      fn bar() { loop { continuing {  } } }`,
  },
  {
    name: "@if on continue statement",
    weslSrc: {
      "./main.wgsl": `
        fn func() {
          while true { @if(true) continue; }
        }`,
    },
    expectedWgsl: `
      fn func() {
        while true {  continue; }
      }`,
  },
  {
    name: "@if on continuing statement",
    weslSrc: {
      "./main.wgsl": `
        fn foo() { loop { @if(true) continuing { } } }
        fn bar() { loop { @if(false) continuing { } } }`,
    },
    expectedWgsl: `
      fn foo() { loop {  continuing { } } }
      fn bar() { loop {  } }`,
  },
  {
    name: "@if on return statement",
    weslSrc: {
      "./main.wgsl": `
        fn func() {
          @if(true) return 0;
          @if(false) return 1;
        }`,
    },
    expectedWgsl: `
      fn func() {
        return 0;
      }`,
  },
  {
    name: "@if on discard statement",
    weslSrc: {
      "./main.wgsl": `
        fn foo() { @if(true) discard; }
        fn bar() { @if(false) discard; }`,
    },
    expectedWgsl: `
      fn foo() {  discard; }
      fn bar() {  }`,
  },
  {
    name: "@if on call statement",
    weslSrc: {
      "./main.wgsl": `
        fn func() {
          @if(true) storageBarrier();
          @if(false) textureBarrier();
        }`,
    },
    expectedWgsl: `
      fn func() {
        storageBarrier();
      }`,
  },
  {
    name: "@if on function-scope const_assert",
    weslSrc: {
      "./main.wgsl": `
        fn func() {
          @if(true) const_assert 0 < 1;
          @if(false) const_assert 1 < 2;
        }`,
    },
    expectedWgsl: `
      fn func() {
        const_assert 0 < 1;
      }`,
  },
  // test the attributes expressions
  {
    name: "@if short-circuiting OR",
    weslSrc: {
      "./main.wgsl": `
        @if(true || true) const c1 = 10;
        @if(true || false) const c2 = 10;
        @if(false || true) const c3 = 10;
        @if(false || false) const c4 = 10;`,
    },
    expectedWgsl: `
      const c1 = 10;
      const c2 = 10;
      const c3 = 10;`,
  },
  {
    name: "@if short-circuiting AND",
    weslSrc: {
      "./main.wgsl": `
        @if(true && true) const c1 = 10;
        @if(true && false) const c2 = 10;
        @if(false && true) const c3 = 10;
        @if(false && false) const c4 = 10;`,
    },
    expectedWgsl: `
      const c1 = 10;`,
  },
  {
    name: "@if logical NOT",
    weslSrc: {
      "./main.wgsl": `
        @if(!true) const c1 = 10;
        @if(!false) const c2 = 10;`,
    },
    expectedWgsl: `
      const c2 = 10;`,
  },
  {
    name: "@if parentheses",
    weslSrc: {
      "./main.wgsl": `
        @if((true)) const c1 = 10;
        @if((false)) const c2 = 10;
        @if(!(false && true) && (true || false)) const c3 = 10;
        `,
    },
    expectedWgsl: `
      const c1 = 10;
      const c3 = 10;`,
  },
  // tough cases
  {
    name: "declaration shadowing",
    weslSrc: {
      "./main.wgsl": `fn main() { package::util::func(); }`,
      "./util.wgsl": `
        const foo = 10;
        const bar = 10;
        fn func() {
          @if(true) let foo = 20;
          let x = foo; /* foo is shadowed. */
          @if(false) let bar = 20;
          let y = bar; /* bar is not shadowed. */
        }`,
    },
    expectedWgsl: `
      fn main() { func(); }

      fn func() {
        let foo = 20;
        let x = foo; /* foo is shadowed. */
        let y = bar; /* bar is not shadowed. */
      }
      const bar = 10;
    `,
    underscoreWgsl: `
      fn main() { package_util_func(); }

      fn package_util_func() {
        let foo = 20;
        let x = foo; /* foo is shadowed. */
        let y = package_util_bar; /* bar is not shadowed. */
      }
      const package_util_bar = 10;
    `,
  },
  {
    name: "conditional import of const_assert",
    notes:
      "const_asserts in imported modules are included if at least one of their declaration is used.",
    weslSrc: {
      "./main.wgsl": `
        fn main() {
          @if(true) package::foo::func();
          @if(false) package::bar::func();
        }`,
      "./foo.wgsl": `
        const_assert 0 < 1;
        fn func() {}`,
      "./bar.wgsl": `
        const_assert 1 < 2;
        fn func() {}`,
    },
    expectedWgsl: `
      const_assert 0 < 1;
      fn main() {
        func();
      }
      fn func() {}`,
    underscoreWgsl: `
      const_assert 0 < 1;
      fn main() {
        package_foo_func();
      }

      fn package_foo_func() {}`,
  },
  {
    name: "double conditional import of const_assert",
    notes: `
       const_asserts in imported modules are included if at least one of their declaration is used.
       But each const_assert should be included only once.`,
    weslSrc: {
      "./main.wgsl": `
          fn main() {
            @if(true) package::foo::func();
            @if(true) package::foo::bar();
          }
      `,
      "./foo.wgsl": `
          const_assert 0 < 1;
          fn func() {}
          fn bar() {}
      `,
    },
    expectedWgsl: `
      const_assert 0 < 1;
      fn main() {
        func();
        bar();
      }
      fn func() {}
      fn bar() {}
    `,
    underscoreWgsl: `
      const_assert 0 < 1;
      fn main() {
        package_foo_func();
        package_foo_bar();
      }
      fn package_foo_func() {}
      fn package_foo_bar() {}
    `,
  },
  {
    name: "conditional transitive const",
    weslSrc: {
      "./main.wgsl": `
          const a = package::util::b;
      `,
      "./util.wgsl": `
          @if(true) const b = c;
          @if(false) const c = 7;
          @if(true) const c = 9;
       `,
    },
    expectedWgsl: `
      const a = b;
      const b = c;
      const c = 9;
    `,
    underscoreWgsl: `
      const a = package_util_b;
      const package_util_b = package_util_c;
      const package_util_c = 9;
    `,
  },
  {
    name: "conditional transitive fn",
    weslSrc: {
      "./main.wgsl": `
          fn main() { package::util::f(); }
      `,
      "./util.wgsl": `
          @if(true) fn f() { g(); }
          @if(false) fn g() { let a = 7; }
          @if(true) fn g() { let a = 9; }
       `,
    },
    expectedWgsl: `
      fn main() { f(); }
      fn f() { g(); }
      fn g() { let a = 9; }
    `,
    underscoreWgsl: `
      fn main() { package_util_f(); }
      fn package_util_f() { package_util_g(); }
      fn package_util_g() { let a = 9; }
    `,
  },
  // {
  //   name: "",
  //   weslSrc: {
  //     "./main.wgsl": `
  //     `,
  //     "./util.wgsl": `
  //      `,
  //   },
  //   expectedWgsl: `
  //   `,
  //   underscoreWgsl: `
  //   `,
  // },
];

export const elseCases: WgslTestSrc[] = [
  {
    name: "@else basic test",
    weslSrc: {
      "./main.wgsl": `
        @if(false) const a = 1;
        @else const a = 2;
        const b = a;`,
    },
    expectedWgsl: `
      const a = 2;
      const b = a;
    `,
  },
  {
    name: "@if(true) @else",
    weslSrc: {
      "./main.wgsl": `
        @if(true) const a = 1;
        @else const a = 2;
        const b = a;`,
    },
    expectedWgsl: `
      const a = 1;
      const b = a;
    `,
  },
  {
    name: "@else with functions",
    weslSrc: {
      "./main.wgsl": `
        @if(false) fn f() -> u32 { return 1; }
        @else fn f() -> u32 { return 2; }
        fn main() -> u32 { return f(); }`,
    },
    expectedWgsl: `
      fn f() -> u32 { return 2; }
      fn main() -> u32 { return f(); }
    `,
  },
  {
    name: "@else with struct members",
    weslSrc: {
      "./main.wgsl": `
        struct S {
          @if(false) m: u32,
          @else m: f32,
        }
        var<private> v: S;`,
    },
    expectedWgsl: `
      struct S { m: f32 }
      var<private> v: S;
    `,
  },
  {
    name: "@else with statements",
    weslSrc: {
      "./main.wgsl": `
        fn main() {
          @if(false) let a = 1;
          @else let a = 2;
        }`,
    },
    expectedWgsl: `
      fn main() {
        let a = 2;
      }
    `,
  },
  {
    name: "@else with compound statements",
    weslSrc: {
      "./main.wgsl": `
        fn main() {
          @if(false) { let a = 1; }
          @else { let a = 2; }
        }`,
    },
    expectedWgsl: `
      fn main() {
        { let a = 2; }
      }
    `,
  },
  {
    name: "nested @if/@else",
    weslSrc: {
      "./main.wgsl": `
        fn main() {
          @if(true) {
            @if(false) const a = 1;
            @else const a = 2;
            const b = a;
          } @else {
            const a = 3;
            const b = a;
          }
        }`,
    },
    expectedWgsl: `
      fn main() {
        {
          const a = 2;
          const b = a;
        }
      }
    `,
  },
  {
    name: "multiple @if/@else chains",
    weslSrc: {
      "./main.wgsl": `
        fn main() {
          @if(false) const a = 1;
          @else const a = 2;

          @if(true) const b = 3;
          @else const b = 4;

          const c = a + b;
        }`,
    },
    expectedWgsl: `
      fn main() {
        const a = 2;
        const b = 3;
        const c = a + b;
      }
    `,
  },
  {
    name: "@else with conditional import",
    weslSrc: {
      "./main.wgsl": `
        @if(false) import package::a::val;
        @else import package::b::val;

        const c = val;`,
      "./a.wgsl": `const val = 1;`,
      "./b.wgsl": `const val = 2;`,
    },
    expectedWgsl: `
      const c = val;
      const val = 2;
    `,
    underscoreWgsl: `
      const c = package_b_val;
      const package_b_val = 2;
    `,
  },
  {
    name: "@else declaration shadowing",
    weslSrc: {
      "./main.wgsl": `
        const x = 1;
        fn main() {
          @if(false) const x = 2;
          @else const y = x;
        }
        `,
    },
    expectedWgsl: `
      const x = 1;
      fn main() {
        const y = x;
      }
    `,
  },
  {
    name: "@else with variable references",
    weslSrc: {
      "./main.wgsl": `
        @if(true) var<private> x = 7;
        @else var<private> y = 4;

        @compute @workgroup_size(1)
        fn main() {
          @if(true) { 
            x = 5; 
          }
          @else { 
            y = 9;
          }
        }`,
    },
    expectedWgsl: `
      var<private> x = 7;
      @compute @workgroup_size(1) fn main() {
        {
          x = 5;
        }
      }
    `,
  },
  {
    name: "@else with variable references false condition",
    weslSrc: {
      "./main.wgsl": `
        @if(false) var<private> x = 7;
        @else var<private> y = 4;

        @compute @workgroup_size(1)
        fn main() {
          @if(false) { 
            x = 5; 
          }
          @else { 
            y = 9;
          }
        }`,
    },
    expectedWgsl: `
      var<private> y = 4;
      @compute @workgroup_size(1) fn main() {
        {
          y = 9;
        }
      }
    `,
  },
  {
    name: "@else with package function reference",
    notes: "Declarations referenced from filtered @else blocks are NOT included",
    weslSrc: {
      "./main.wgsl": `
        fn main() {
          @if(true) { }
          @else {
            package::util::bar();
          }
        }`,
      "./util.wgsl": `
        const_assert 1 < 0;
        fn bar() { }`,
    },
    expectedWgsl: `
      fn main() {
        { }
      }
    `,
    underscoreWgsl: `
      fn main() {
        { }
      }
    `,
  },
];

conditionalTranslationCases.push(...elseCases);

export default conditionalTranslationCases;
