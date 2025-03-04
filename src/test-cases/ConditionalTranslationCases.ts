import { WgslTestSrc } from "../TestSchema.js";

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
    name: "@if on module scope const_assert",
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
      fn foo() { loop { continuing { } } }
      fn bar() { loop { } }`,
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
  // though cases
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
    name: "conditional declaration shadowing",
    notes: "this test must be run with stripping disabled.", // unsupported on wesl-js (no disable stripping option)
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
    underscoreWgsl: `
      fn main() { package_util_func(); }
      
      const package_util_foo = 10;
      const package_util_bar = 10;
      fn package_util_func() {
        let foo = 20;
        let x = foo;
        let y = package_util_bar;
      }`,
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
    underscoreWgsl: `
      fn main() {
        package_foo_func();
      }

      const_assert 0 < 1;
      fn package_foo_func() {}`,
  },
];

export default conditionalTranslationCases;
