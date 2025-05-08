### Compiler Explorer reveal.js plugin

[![CI](https://github.com/mattgodbolt/reveal-ce/actions/workflows/ci.yml/badge.svg)](https://github.com/mattgodbolt/reveal-ce/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/mattgodbolt/reveal-ce/branch/main/graph/badge.svg)](https://codecov.io/gh/mattgodbolt/reveal-ce)
[![semantic-release: conventional commits](https://img.shields.io/badge/semantic--release-conventional_commits-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

This is a small plugin for [reveal.js](https://revealjs.com/) that turns C++ `<code>` blocks into presentation-ready
Compiler-Explorer-linked snippets. It supports:

- Control-click on the code to open [Compiler Explorer](https://compiler-explorer.com)
- Hiding of regions of the code in the presentation view that appear in the link
- Setup regions that are collapsed in Compiler Explorer
- Configuration of the CE instance it links to
- Smart code indentation handling

### To use

Include the plugin in your reveal.js presentation, submoduled or copied into your project:

```html
<script type="module">
  import Reveal from './reveal.js/dist/reveal.esm.js';
  import Highlight from './reveal.js/plugin/highlight/highlight.esm.js';
  import CompilerExplorer from './reveal-ce/index.js';

  Reveal.initialize({
    ce: {
      // put any CE options here, see below for details.
    },

    // CompilerExplorer must be before Highlight in the plugins list
    plugins: [CompilerExplorer, Highlight],
  });
</script>
```

Then, in your presentation, use `<code>` blocks with a `data-ce` attribute:

```html
<pre><code data-ce>
int multiply(int a, int b) {
  return a * b;
}
</code></pre>
```

This will generate a link to Compiler Explorer with the code in the block.

### Configuration

#### Per Code Block Configuration

Each code block can have the following attributes to customize its behavior:

- `data-ce-compiler` - Specifies the compiler to use for this code block
- `data-ce-options` - Specifies the compiler options for this code block
- `data-ce-language` - Overrides the language for this code block
- `data-ce-remove-regex` - Specifies a regex pattern to remove content from code sent to Compiler Explorer

Example:

```html
<pre><code data-ce data-ce-compiler="g142" data-ce-options="-O3 -march=haswell" data-ce-language="c++">
    int multiply(int a, int b) {
        return a * b;
    }
</code></pre>
```

Example with regex removal (removes comments from Compiler Explorer view):

```html
<pre><code data-ce data-ce-language="analysis" data-ce-remove-regex=";.*">
    ldp x8, x9, [x0]    ; x8=begin, x9=end
    mvn x10, x8         ; x10 = ~begin
    add x9, x10, x9     ; x9 = end + ~begin
                        ;    = end - begin - 1
</code></pre>
```

#### Global Configuration Options

Default values for all code blocks can be set in the plugin options:

```javascript
Reveal.initialize({
  ce: {
    // Basic configuration
    defaultCompiler: 'g142',
    defaultCompilerOptions: '-O3 -march=haswell',
    defaultLanguage: 'c++',
    defaultRemoveRegex: '//\\s*DEBUG:.*', // Remove DEBUG comments in all languages

    // Or language-specific configuration
    defaultCompiler: {
      'c++': 'g142',
      rust: 'r1650',
      go: 'gl1180',
    },
    defaultCompilerOptions: {
      'c++': '-O3 -march=haswell',
      rust: '-C opt-level=2',
      go: '',
    },
    additionalCompilerOptions: {
      'c++': '-Wall -Wextra',
      rust: '-C debuginfo=2',
      go: '',
    },
    defaultRemoveRegex: {
      'c++': '//\\s*NOTE:.*', // Remove C++ NOTE comments
      analysis: ';.*', // Remove assembly-style comments
      asm: ';.*', // Remove assembly comments
    },
  },
});
```

#### All Configuration Options

| Option                      | Type             | Default                                  | Description                                                                                                                                                                                                                          |
| --------------------------- | ---------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `baseUrl`                   | string           | `'https://slides.compiler-explorer.com'` | The base URL of the Compiler Explorer instance to link to. By using a subdomain, Compiler Explorer global settings are scoped to that subdomain (e.g., browser zooms).                                                               |
| `defaultLanguage`           | string           | `'c++'`                                  | The default programming language to use for all code blocks.                                                                                                                                                                         |
| `defaultCompiler`           | string \| object | `'g142'`                                 | The ID of the default compiler to use. Can be a string (applies to all languages) or an object mapping language names to compiler IDs. To find compiler IDs, run `curl -sL https://compiler-explorer.org/api/compilers/c++ \| less`. |
| `defaultCompilerOptions`    | string \| object | `'-O1'`                                  | The default compiler options to use. Can be a string (applies to all languages) or an object mapping language names to options.                                                                                                      |
| `additionalCompilerOptions` | string \| object | `'-Wall -Wextra'`                        | Additional compiler options to always append to the defaults. Can be a string (applies to all languages) or an object mapping language names to options.                                                                             |
| `defaultRemoveRegex`        | string \| object | `null`                                   | Regular expression pattern to remove content from code sent to Compiler Explorer. Can be a string (applies to all languages) or an object mapping language names to regex patterns. Used to hide content like comments in CE links.  |
| `editorFontScale`           | number           | `2.5`                                    | The font scale for the code editor in Compiler Explorer.                                                                                                                                                                             |
| `compilerFontScale`         | number           | `3.0`                                    | The font scale for the compiler output in Compiler Explorer.                                                                                                                                                                         |
| `maxLineLength`             | number           | `50`                                     | Maximum line length for code blocks. Lines exceeding this will log warnings to the browser console. Useful to identify code blocks that might spill off the side of your presentation.                                               |
| `intelSyntax`               | boolean          | `true`                                   | Whether to use Intel syntax for the assembly output (versus AT&T syntax).                                                                                                                                                            |
| `trimAsmWhitespace`         | boolean          | `true`                                   | Whether to trim horizontal whitespace from the assembly output in Compiler Explorer.                                                                                                                                                 |
| `undent`                    | boolean          | `true`                                   | Whether to automatically remove common leading whitespace from the displayed code blocks in the presentation (the Compiler Explorer link will still have the original indentation).                                                  |

### Hiding and setup

Sometimes you don't want all the code in the presentation view to be visible, but need it in the compilable input. There
are two ways to hide such code.

#### Setup regions

The comment `// setup` is special both to the plugin and to Compiler Explorer. CE will roll up any indentation level of
code following a `// setup` comment into a hidden region. The plugin will hide this region in the presentation view.

```html
<pre><code data-ce>
// setup
 #include &lt;iostream>
 // anything indented here will appear as a rolled up "// setup" region in CE
 using namespace std; // like this... but... only for slide code please

int main() {
    cout &lt;&lt; "Hello, world!\n";
}
</code></pre>
```

#### Hiding regions

Using `/// hide` and then `/// unhide` will hide the region between them in the presentation view.

```html
<pre><code data-ce>
/// hide
// this code is hidden in the presentation view but will be in the CE link.
extern int someFunction();
/// unhide
int test() {
  return someFunction() * 2;
}
</code></pre>
```

### Compatibility with Markdown

It's convenient to use Markdown code blocks, but
[reveal.js doesn't currently let us put attributes](https://github.com/hakimel/reveal.js/issues/3642) on Markdown code
blocks. Instead we can put the following line _after_ the triple-backtick block:

```
<!-- .element: data-ce -->
```

You can add any other data options there. For example:

````markdown
```cpp
int main() {
    return 0;
}
```

<!-- .element: data-ce data-ce-compiler="g142" data-ce-options="-O3" -->
````

Although this actually puts the tags on the `<pre>` block outside of the `<code>` block that's generated, reveal-ce will
do the right thing and process the code appropriately.

### Contributing

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for standardized commit messages, which
enables automated versioning and changelog generation.

When contributing:

1. Fork the repository and create a feature branch
2. Make your changes
3. Run tests with `npm test`
4. Optionally check test coverage with `npm run test:coverage`
5. Create commits using `npm run commit` which will guide you through creating a properly formatted commit message
6. Submit a pull request

The project uses semantic-release for automated versioning and publishing to npm. Version numbers are determined
automatically based on commit types:

- `feat:` - Minor version bump (1.0.0 → 1.1.0)
- `fix:` - Patch version bump (1.0.0 → 1.0.1)
- `feat!:` or `fix!:` or commits with `BREAKING CHANGE:` in the footer - Major version bump (1.0.0 → 2.0.0)
