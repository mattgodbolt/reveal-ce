/**
 * Gets a configuration value that can be either a string (applying to all languages)
 * or an object mapping languages to specific values.
 * @param {string|Object<string, string>} value - The configuration value
 * @param {string} language - The programming language
 * @param {string} [defaultValue] - Default value if no language-specific value is found
 * @returns {string} - The resolved configuration value for the given language
 */
export function getLanguageSpecificValue(value, language, defaultValue = '') {
    if (typeof value === 'string') return value;
    return value?.[language] || defaultValue;
}

/**
 * Trims leading and trailing empty lines, and optionally undents code.
 * @param {string[]} sourceList - Array of source code lines
 * @param {boolean} undent - Whether to undent the code
 * @returns {string} - Processed source code with empty lines removed and optionally undented
 */
export function trim(sourceList, undent) {
    while (sourceList.length > 0 && sourceList[0].trim() === '') {
        sourceList.shift();
    }
    while (sourceList.length > 0 && sourceList[sourceList.length - 1].trim() === '') {
        sourceList.pop();
    }
    if (undent && sourceList.length > 0) {
        const indent = sourceList.reduce((acc, line) => {
            if (line.trim() === '') return acc;
            const leadingSpace = line.match(/^\s*/)[0].length;
            return Math.min(acc, leadingSpace);
        }, Infinity);
        if (indent !== Infinity) sourceList = sourceList.map(line => line.slice(indent));
    }
    return sourceList.join('\n');
}

/**
 * Parses a code block, processing special comments and preparing both the complete source
 * (for Compiler Explorer) and the display source (for presentation).
 * @param {CompilerExplorerConfig} config - The configuration object
 * @param {HTMLElement} element - The code element to parse
 * @param {Function} [logger=console.error] - Function to log errors
 * @returns {ParsedCodeBlock} - Object containing parsed information
 */
export function parseCodeBlock(config, element, logger = console.error) {
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
        } else if (line.length > 0 && !line.startsWith(' ')) {
            skipDisplay = false;
        }

        source.push(line);
        if (!skipDisplay && !hide) displaySource.push(line);
        if (line.length > config.maxLineLength) {
            logger(`Line too long: "${line}"`);
        }
    }

    const language = element.dataset['ceLanguage'] || config.defaultLanguage;
    const compiler =
        element.dataset['ceCompiler'] || getLanguageSpecificValue(config.defaultCompiler, language, 'g142');
    const options =
        element.dataset['ceOptions'] || getLanguageSpecificValue(config.defaultCompilerOptions, language, '-O1');

    // Get the regex pattern to remove content from compiler explorer code
    const removeRegex =
        element.dataset['ceRemoveRegex'] || getLanguageSpecificValue(config.defaultRemoveRegex, language);

    return {
        language,
        compiler,
        options,
        source: trim(source, false),
        displaySource: trim(displaySource, config.undent),
        removeRegex,
    };
}

/**
 * Creates a Compiler Explorer URL fragment for the given source code and options.
 * @param {CompilerExplorerConfig} config - The configuration object
 * @param {string} source - The complete source code to send to Compiler Explorer
 * @param {string|Object<string, string>} options - The compiler options as string or language map
 * @param {string} language - The programming language
 * @param {string} compiler - The compiler ID
 * @param {string} [removeRegex] - Optional regex pattern to remove content from code sent to Compiler Explorer
 * @param {Function} [logger=console.error] - Function to log errors
 * @returns {string} - URL-encoded JSON configuration for Compiler Explorer
 */
export function createCompilerExplorerLink(
    config,
    source,
    options,
    language,
    compiler,
    removeRegex,
    logger = console.error,
) {
    // Apply removeRegex to source if provided
    let ceSource = source;
    if (removeRegex) {
        try {
            const regex = new RegExp(removeRegex, 'g');
            ceSource = source.replace(regex, '');
        } catch (e) {
            logger(`Invalid regex pattern: ${removeRegex}`, e);
        }
    }

    const content = [
        {
            type: 'component',
            componentName: 'codeEditor',
            componentState: {
                id: 1,
                source: ceSource,
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
                options: [
                    getLanguageSpecificValue(options, language),
                    getLanguageSpecificValue(config.additionalCompilerOptions, language),
                ]
                    .filter(Boolean)
                    .join(' '),
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
 * @param {Object} deck - The reveal.js deck instance with getConfig method
 * @returns {CompilerExplorerConfig} - The merged configuration object with defaults and user overrides
 */
export function initializeConfig(deck) {
    const defaultConfig = {
        baseUrl: 'https://slides.compiler-explorer.com',
        maxLineLength: 50,
        editorFontScale: 2.5,
        compilerFontScale: 3.0,
        defaultLanguage: 'c++',
        defaultCompiler: 'g142',
        defaultCompilerOptions: '-O1',
        additionalCompilerOptions: '-Wall -Wextra',
        defaultRemoveRegex: null,
        intelSyntax: true,
        trimAsmWhitespace: true,
        undent: true,
    };

    // Merge user config with defaults
    return {...defaultConfig, ...(deck.getConfig().ce || {})};
}

/**
 * Attaches event listeners to the code element.
 * @param {CompilerExplorerConfig} config - The configuration object
 * @param {HTMLElement} element - The code element
 * @param {string} ceFragment - The Compiler Explorer link fragment
 * @param {Function} [urlLauncher=url => window.location.assign(url)] - Function to launch URLs
 */
export function attachEventListeners(config, element, ceFragment, urlLauncher = url => window.location.assign(url)) {
    // Attach `onclick` to the (presumed `<pre>`) parent element. That way if data-line-numbers is used (which creates
    // multiple code elements), the click event will still work.
    element.parentElement.onclick = evt => {
        if (evt.ctrlKey) {
            urlLauncher(`${config.baseUrl}#${ceFragment}`);
        }
    };
}

/**
 * Compiler Explorer ASM filters configuration
 *
 * @typedef {Object} CEAsmFilters
 * @property {boolean} commentOnly - Include only comments from the output
 * @property {boolean} directives - Include compiler directives
 * @property {boolean} intel - Use Intel syntax
 * @property {boolean} labels - Include labels
 * @property {boolean} trim - Trim whitespace
 */

/**
 * Compiler Explorer editor options
 *
 * @typedef {Object} CEEditorOptions
 * @property {boolean} compileOnChange - Whether to compile when code changes
 * @property {boolean} colouriseAsm - Whether to colorize assembly output
 */

/**
 * Compiler Explorer component state base
 *
 * @typedef {Object} CEComponentStateBase
 * @property {number} fontScale - The font scale
 */

/**
 * Compiler Explorer code editor component state
 *
 * @typedef {CEComponentStateBase} CECodeEditorState
 * @property {number} id - The component ID
 * @property {string} source - The source code
 * @property {CEEditorOptions} options - Editor options
 * @property {string} lang - The programming language
 */

/**
 * Compiler Explorer compiler component state
 *
 * @typedef {CEComponentStateBase} CECompilerState
 * @property {number} source - The source component ID
 * @property {CEAsmFilters} filters - Assembly filters
 * @property {string} options - Compiler options
 * @property {string} compiler - The compiler ID
 */

/**
 * Compiler Explorer component
 *
 * @typedef {Object} CEComponent
 * @property {string} type - Component type
 * @property {string} componentName - The name of the component
 * @property {CECodeEditorState|CECompilerState} componentState - The component state
 */

/**
 * Compiler Explorer row content
 *
 * @typedef {Object} CERowContent
 * @property {string} type - Always "row" for row content
 * @property {Array<CEComponent>} content - The row's components
 */

/**
 * Compiler Explorer layout configuration
 *
 * @typedef {Object} CELayoutConfig
 * @property {number} version - The layout version
 * @property {Array<CERowContent>} content - The layout content
 */

/**
 * Parsed code block data
 *
 * @typedef {Object} ParsedCodeBlock
 * @property {string} language - The programming language
 * @property {string} compiler - The compiler ID
 * @property {string} options - The compiler options
 * @property {string} source - The complete source code for Compiler Explorer
 * @property {string} displaySource - The source code for display in the presentation
 * @property {string} [removeRegex] - Optional regex pattern to remove content from code sent to Compiler Explorer
 */

/**
 * Compiler Explorer reveal.js plugin configuration options
 *
 * @typedef {Object} CompilerExplorerConfig
 * @property {string} [baseUrl] - The base URL for the Compiler Explorer instance. Defaults to "https://slides.compiler-explorer.com".
 * @property {string} [defaultLanguage] - The language to use by default. Defaults to "c++".
 * @property {string|Object<string, string>} [defaultCompiler] - The ID of the default compiler to use. Can be a string (applies to all languages) or a map of language names to compiler IDs. Defaults to "g142".
 * @property {string|Object<string, string>} [defaultCompilerOptions] - The default compiler options to use. Can be a string (applies to all languages) or a map of language names to options. Defaults to "-O1".
 * @property {string|Object<string, string>} [additionalCompilerOptions] - Additional compiler options to be appended to the default options. Can be a string (applies to all languages) or a map of language names to options. Defaults to "-Wall -Wextra".
 * @property {string|Object<string, string>} [defaultRemoveRegex] - Regular expression pattern to remove content from code sent to Compiler Explorer. Can be a string (applies to all languages) or a map of language names to regex patterns. Defaults to null (no content removed).
 * @property {number} [editorFontScale] - The font scale for the editor. Defaults to 2.5.
 * @property {number} [compilerFontScale] - The font scale for the compiler. Defaults to 3.0.
 * @property {number} [maxLineLength] - The maximum line length for a code block. Defaults to 50. Lines exceeding this will log warnings to the console.
 * @property {boolean} [intelSyntax] - Whether to use Intel syntax for the compiler output. Defaults to true.
 * @property {boolean} [trimAsmWhitespace] - Whether to trim whitespace from the compiler output. Defaults to true.
 * @property {boolean} [undent] - Whether to undent the displayed code block. Defaults to true.
 */

/**
 * Compiler Explorer reveal.js plugin.
 * @param {Object} dependencies - Optional dependency injections for testing
 * @param {Function} dependencies.logger - Function to log errors
 * @param {Function} dependencies.urlLauncher - Function to launch URLs
 * @returns {{init: *, id: string}}
 */
export default (dependencies = {}) => ({
    id: 'compiler-explorer',
    init: deck => {
        // Find all [data-ce] nodes, which is _usually_ on the `code` block but to support Markdown can also be on the `<pre>`
        // outside. See https://github.com/hakimel/reveal.js/issues/3642
        const ce_nodes = deck.getSlidesElement().querySelectorAll('[data-ce]');
        const config = initializeConfig(deck);

        for (let i = 0, len = ce_nodes.length; i < len; i++) {
            const element = ce_nodes[i];
            const {language, compiler, options, source, displaySource, removeRegex} = parseCodeBlock(
                config,
                element,
                dependencies.logger,
            );
            const ceFragment = createCompilerExplorerLink(
                config,
                source,
                options,
                language,
                compiler,
                removeRegex,
                dependencies.logger,
            );
            attachEventListeners(config, element, ceFragment, dependencies.urlLauncher);
            // To allow the tags to be placed on the `<pre>` outside (for Markdown support), we check for a code block here.
            const maybeInnerCodeBlock = element.querySelectorAll('code');
            if (maybeInnerCodeBlock.length === 1) {
                maybeInnerCodeBlock[0].textContent = displaySource;
            } else {
                element.textContent = displaySource;
            }
        }
    },
});
