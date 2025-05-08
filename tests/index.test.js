import {describe, it, expect, vi} from 'vitest';
import plugin from '../index.js';
import {createURLLauncher, setupDOM, createMockDeck} from './testUtils.js';

describe('reveal-ce plugin', () => {
    beforeEach(() => {
        // Reset DOM for each test
        document.body.innerHTML = '';

        // Setup the test DOM with our sample code
        setupDOM({
            codeContent: `// setup
#include <iostream>

///hide
// This will be hidden in the presentation
int hiddenFunc() {
    return 42;
}
///unhide

int main() {
    std::cout << "Hello, world!" << std::endl;
    return 0;
}`,
            attributes: {
                ce: 'true',
                'ce-language': 'c++',
                'ce-compiler': 'g142',
            },
        });

        // Add a second code element for testing
        const slidesSection = document.querySelector('.slides');
        const newSection = document.createElement('section');
        newSection.innerHTML = `<pre><code data-ce="true">int simple() {
    return 0;
}</code></pre>`;
        slidesSection.appendChild(newSection);
    });

    describe('plugin initialization', () => {
        it('should register the plugin with reveal.js', () => {
            const pluginDef = plugin();
            expect(pluginDef.id).toBe('compiler-explorer');
            expect(typeof pluginDef.init).toBe('function');
        });

        it('should process code blocks with data-ce attribute', () => {
            // Create mock logger to avoid noise from line length warnings
            const mockLogger = vi.fn();

            // Setup reveal.js deck mock
            const mockDeck = createMockDeck({ce: null}); // Use default config

            // Initialize the plugin with injected dependencies
            const pluginDef = plugin({
                logger: mockLogger,
            });
            pluginDef.init(mockDeck);

            // Check if the code blocks were processed
            const codeElements = document.querySelectorAll('pre > code[data-ce]');
            expect(codeElements.length).toBe(2);

            // Event listeners should be attached to the parent elements
            const preElements = document.querySelectorAll('pre');
            expect(typeof preElements[0].onclick).toBe('function');
            expect(typeof preElements[1].onclick).toBe('function');

            // First code block should have the hidden content removed
            const firstCodeContent = codeElements[0].textContent;
            expect(firstCodeContent).not.toContain('hiddenFunc');
            expect(firstCodeContent).toContain('main');
            expect(firstCodeContent).not.toContain('setup');
        });
    });

    describe('click handling', () => {
        it('should open Compiler Explorer when Ctrl+Click is used', () => {
            // Create URL launcher mock
            const urlLauncher = createURLLauncher();

            // Setup reveal.js deck mock
            const mockDeck = createMockDeck({ce: null}); // Use default config

            // Initialize the plugin with injected URL launcher
            const pluginDef = plugin({
                urlLauncher: urlLauncher.navigate,
            });
            pluginDef.init(mockDeck);

            // Find the pre element and simulate a ctrl+click
            const preElement = document.querySelector('pre');
            preElement.onclick({ctrlKey: true});

            // Check if our URL launcher was called with a Compiler Explorer URL
            expect(urlLauncher.getMockImplementation()).toHaveBeenCalled();
            const url = urlLauncher.getMockImplementation().mock.calls[0][0];
            expect(url).toContain('https://slides.compiler-explorer.com');
            expect(url).toContain('#');
        });

        it('should not open Compiler Explorer on regular click', () => {
            // Create URL launcher mock
            const urlLauncher = createURLLauncher();

            // Setup reveal.js deck mock
            const mockDeck = createMockDeck({ce: null}); // Use default config

            // Initialize the plugin with injected URL launcher
            const pluginDef = plugin({
                urlLauncher: urlLauncher.navigate,
            });
            pluginDef.init(mockDeck);

            // Find the pre element and simulate a regular click
            const preElement = document.querySelector('pre');
            preElement.onclick({ctrlKey: false});

            // Check that our URL launcher was not called
            expect(urlLauncher.getMockImplementation()).not.toHaveBeenCalled();
        });
    });

    describe('custom configuration', () => {
        it('should honor custom configuration options', () => {
            // Create URL launcher mock
            const urlLauncher = createURLLauncher();

            // Setup reveal.js deck with custom config
            const mockDeck = createMockDeck({
                ce: {
                    baseUrl: 'https://godbolt.org',
                    defaultLanguage: 'rust',
                    defaultCompiler: 'rust',
                    defaultCompilerOptions: '-O3',
                },
            });

            // Initialize the plugin with injected URL launcher
            const pluginDef = plugin({
                urlLauncher: urlLauncher.navigate,
            });
            pluginDef.init(mockDeck);

            // Find the pre element and simulate a ctrl+click
            const preElement = document.querySelector('pre');
            preElement.onclick({ctrlKey: true});

            // Check that the custom baseUrl was used
            expect(urlLauncher.getMockImplementation()).toHaveBeenCalled();
            const url = urlLauncher.getMockImplementation().mock.calls[0][0];
            expect(url).toContain('https://godbolt.org');
        });
    });

    describe('regex removal feature', () => {
        it('should apply regex removal to code sent to Compiler Explorer', () => {
            // Setup the test DOM with assembly code and comments
            document.body.innerHTML = ''; // Clear existing content
            setupDOM({
                codeContent: `ldp x8, x9, [x0]    ; x8=begin, x9=end
mvn x10, x8         ; x10 = ~begin
add x9, x10, x9     ; x9 = end + ~begin
                    ;    = end - begin - 1
                    ;    = bbf.size() - 1
and x9, x9, x1      ; x9 = val & (bbf.size() - 1)
ldrb w8, [x8, x9]   ; w8 = bloom_[x9]
cmp w8, #0
cset w0, ne         ; return w8 ? true : false`,
                attributes: {
                    ce: 'true',
                    'ce-language': 'asm',
                    'ce-compiler': 'clang',
                    'ce-remove-regex': ';.*',
                },
            });

            // Create URL launcher mock
            const urlLauncher = createURLLauncher();

            // Setup reveal.js deck mock
            const mockDeck = createMockDeck({ce: null}); // Use default config

            // Initialize the plugin with injected URL launcher
            const pluginDef = plugin({
                urlLauncher: urlLauncher.navigate,
            });
            pluginDef.init(mockDeck);

            // Find the pre element and simulate a ctrl+click
            const preElement = document.querySelector('pre');
            preElement.onclick({ctrlKey: true});

            // Check that the URL was created
            expect(urlLauncher.getMockImplementation()).toHaveBeenCalled();
            const url = urlLauncher.getMockImplementation().mock.calls[0][0];

            // Decode the URL fragment to check the source
            const fragment = url.split('#')[1];
            const decodedObj = JSON.parse(decodeURIComponent(fragment));
            const editorSource = decodedObj.content[0].content[0].componentState.source;

            // Should not contain comment text but should preserve instructions
            expect(editorSource).toContain('ldp x8, x9, [x0]');
            expect(editorSource).toContain('mvn x10, x8');
            expect(editorSource).not.toContain('x8=begin');
            expect(editorSource).not.toContain('x10 = ~begin');

            // The display source in the presentation should still have comments
            const codeElement = document.querySelector('code');
            expect(codeElement.textContent).toContain('x8=begin');
            expect(codeElement.textContent).toContain('x10 = ~begin');
        });

        it('should apply default remove regex from config', () => {
            // Setup the test DOM with assembly code and comments
            document.body.innerHTML = ''; // Clear existing content
            setupDOM({
                codeContent: `ldp x8, x9, [x0]    ; x8=begin, x9=end
mvn x10, x8         ; x10 = ~begin`,
                attributes: {
                    ce: 'true',
                    'ce-language': 'asm',
                    'ce-compiler': 'clang',
                },
            });

            // Create URL launcher mock
            const urlLauncher = createURLLauncher();

            // Setup reveal.js deck with default remove regex
            const mockDeck = createMockDeck({
                ce: {
                    defaultRemoveRegex: ';.*',
                },
            });

            // Initialize the plugin with injected URL launcher
            const pluginDef = plugin({
                urlLauncher: urlLauncher.navigate,
            });
            pluginDef.init(mockDeck);

            // Find the pre element and simulate a ctrl+click
            const preElement = document.querySelector('pre');
            preElement.onclick({ctrlKey: true});

            // Check that the URL was created
            expect(urlLauncher.getMockImplementation()).toHaveBeenCalled();
            const url = urlLauncher.getMockImplementation().mock.calls[0][0];

            // Decode the URL fragment to check the source
            const fragment = url.split('#')[1];
            const decodedObj = JSON.parse(decodeURIComponent(fragment));
            const editorSource = decodedObj.content[0].content[0].componentState.source;

            // Should not contain comment text
            expect(editorSource).not.toContain('x8=begin');
            expect(editorSource).not.toContain('x10 = ~begin');
        });
    });
});
