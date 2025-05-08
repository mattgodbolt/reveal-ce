### Compiler Explorer reveal.js plugin

[![CI](https://github.com/mattgodbolt/reveal-ce/actions/workflows/ci.yml/badge.svg)](https://github.com/mattgodbolt/reveal-ce/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/mattgodbolt/reveal-ce/branch/main/graph/badge.svg)](https://codecov.io/gh/mattgodbolt/reveal-ce)

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

Each code block can have a `data-ce-compiler` attribute to specify the compiler to use, and a `data-ce-options`
attribute to specify the options to use. For example:

```html
<pre><code data-ce data-ce-compiler="g142" data-ce-options="-O3 -march=haswell">
    int multiply(int a, int b) {
    return a * b;
}
</code></pre>
```

You can also override the language used by setting the `data-ce-language`.

Default values for these attributes can be set in the plugin options:

```javascript
Reveal.initialize({
  ce: {
    defaultCompiler: 'g142',
    defaultCompilerOptions: '-O3 -march=haswell',
  },
});
```

Other supported options are:

- `defaultCompiler` - the ID of the compiler to use. Defaults to "g142". To find the ID of a compiler, run something
  like `curl -sL https://compiler-explorer.org/api/compilers/c++ | less`.
- `defaultCompilerOptions` - the default options to use. Defaults to "-O1".
- `defaultLanguage` - the default language to use. Defaults to `c++`.
- `additionalCompilerOptions` - additional compiler options to always add on. Defaults to "-Wall -Wextra".
- `baseUrl` - the base URL of the Compiler Explorer instance to link to. Defaults to
  "https://slides.compiler-explorer.com". (By using a subdomain, any Compiler Explorer global settings are scoped to
  that subdomain; for example things like browser zooms, etc).
- `maxLineLength` - code lines longer than this will log warnings in the browser console. Defaults to 50. Useful to
  identify code blocks that might spill off the side of your presentation.
- `editorFontScale` and `compilerFontScale` - the font scale to use for the editor and compiler output. Defaults to 2.5
  and 3.0 respectively.
- `intelSyntax` - whether to use Intel syntax for the compiler output. Defaults to true.
- `trimAsmWhitespace` - whether to use the "trim" option for the compiler output on Compiler Explorer itself
  (suppressing horizontal whitespace). Defaults to true.
- `undent` - whether to undent the displayed code. Defaults to true.

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
