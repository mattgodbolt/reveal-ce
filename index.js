function trim(sourceList, undent) {
    while (sourceList.length > 0 && sourceList[0].trim() === '') {
        sourceList.shift();
    }
    while (sourceList.length > 0 && sourceList[sourceList.length - 1].trim() === '') {
        sourceList.pop();
    }
    if (undent) {
        const indent = sourceList.reduce((acc, line) => {
            const leadingSpace = line.match(/^\s*/)[0].length;
            return Math.min(acc, leadingSpace);
        }, Infinity);
        if (indent !== Infinity) sourceList = sourceList.map(line => line.slice(indent));
    }
    return sourceList.join('\n');
}

function parseCodeBlock(config, element) {
    const hideMatcher = /^\s*\/\/\/\s*((un)?hide)\s*$/;
    const lines = element.textContent.split('\n');
    const source = [];
    const displaySource = [];
    let skipDisplay = false;
    let hide = false;

    for (const line of lines) {
        const match = line.match(hideMatcher);
        if (match) {
            hide = match[1] === 'hide';
            continue;
        }
        if (line === '// setup') {
            skipDisplay = true;
        } else if (line[0] !== ' ') {
            skipDisplay = false;
        }

        source.push(line);
        if (!skipDisplay && !hide) displaySource.push(line);
        if (line.length > config.maxLineLength) {
            console.error(`Line too long: "${line}"`);
        }
    }

    return {
        language: element.dataset['ceLanguage'] || config.defaultLanguage,
        compiler: element.dataset['ceCompiler'] || config.defaultCompiler,
        options: element.dataset['ceOptions'] || config.defaultCompilerOptions,
        source: trim(source, false),
        displaySource: trim(displaySource, config.undent),
    };
}

function createCompilerExplorerLink(config, source, options, language, compiler) {
    const content = [
        {
            type: 'component',
            componentName: 'codeEditor',
            componentState: {
                id: 1,
                source: source,
                options: {compileOnChange: true, colouriseAsm: true},
                fontScale: config.editorFontScale,
                lang: language,
            },
        },
        {
            type: 'component',
            componentName: 'compiler',
            componentState: {
                source: 1,
                filters: {
                    commentOnly: true,
                    directives: true,
                    intel: config.intelSyntax,
                    labels: true,
                    trim: config.trimAsmWhitespace,
                },
                options: [options, config.additionalCompilerOptions].filter(Boolean).join(' '),
                compiler: compiler,
                fontScale: config.compilerFontScale,
            },
        },
    ];

    const obj = {
        version: 4,
        content: [{type: 'row', content: content}],
    };

    return encodeURIComponent(JSON.stringify(obj));
}

/**
 * Initializes the configuration for the Compiler Explorer plugin.
 * @param {Object} deck - The reveal.js deck instance.
 * @returns {Object} - The configuration object.
 */
function initializeConfig(deck) {
    const config = deck.getConfig().ce || {};
    config.baseUrl = config.baseUrl || 'https://slides.compiler-explorer.com';
    config.maxLineLength = config.maxLineLength || 50;
    config.editorFontScale = config.editorFontScale || 2.5;
    config.compilerFontScale = config.compilerFontScale || 3.0;
    config.defaultLanguage = 'c++';
    config.defaultCompiler = 'g142';
    config.defaultCompilerOptions = config.defaultCompilerOptions || '-O1';
    config.additionalCompilerOptions = config.additionalCompilerOptions || '-Wall -Wextra';
    config.intelSyntax = config.intelSyntax || true;
    config.trimAsmWhitespace = config.trimAsmWhitespace || true;
    config.undent = config.undent || true;
    return config;
}

/**
 * Attaches event listeners to the code element.
 * @param {Object} config - The configuration object.
 * @param {HTMLElement} element - The code element.
 * @param {string} ceFragment - The Compiler Explorer link fragment.
 */
function attachEventListeners(config, element, ceFragment) {
    // Attach `onclick` to the (presumed `<pre>`) parent element. That way if data-line-numbers is used (which creates
    // multiple code elements), the click event will still work.
    element.parentElement.onclick = evt => {
        if (evt.ctrlKey) {
            window.location.assign(`${config.baseUrl}#${ceFragment}`);
        }
    };
}

/**
 * Compiler Explorer reveal.js plugin configuration options:
 *
 * @typedef {Object} CompilerExplorerConfig
 * @property {string} [baseUrl] - The base URL for the Compiler Explorer instance. Defaults to "https://slides.compiler-explorer.com".
 * @property {string} [additionalCompilerOptions] - Additional compiler options to be appended to the default options.
 * @property {string} [defaultLanguage] - The language to use by default. Defaults to "c++".
 * @property {string} [defaultCompiler] - The ID of the default compiler to use. Defaults to "g142".
 * @property {string} [defaultCompilerOptions] - The default compiler options to use. Defaults to "-O2 -march=haswell".
 * @property {number} [editorFontScale] - The font scale for the editor. Defaults to 2.5.
 * @property {number} [compilerFontScale] - The font scale for the compiler. Defaults to 3.0.
 * @property {number} [maxLineLength] - The maximum line length for a code block. Defaults to 50.
 * @property {string} [additionalCompilerOptions] - Additional compiler options to be appended to the default options.
 * @property {boolean} [intelSyntax] - Whether to use Intel syntax for the compiler output. Defaults to true.
 * @property {boolean} [trimAsmWhitespace] - Whether to trim whitespace from the compiler output. Defaults to true.
 * @property {boolean} [undent] - Whether to undent the displayed code block. Defaults to true.
 */

/**
 * Compiler Explorer reveal.js plugin.
 * @returns {{init: *, id: string}}
 */
export default () => ({
    id: 'compiler-explorer',
    init: deck => {
        const ce_nodes = deck.getSlidesElement().querySelectorAll('[data-ce]');
        const config = initializeConfig(deck);

        for (let i = 0, len = ce_nodes.length; i < len; i++) {
            const element = ce_nodes[i];
            const {language, compiler, options, source, displaySource} = parseCodeBlock(config, element);
            const ceFragment = createCompilerExplorerLink(config, source, options, language, compiler);
            attachEventListeners(config, element, ceFragment);
            element.textContent = displaySource;
        }
    },
});
