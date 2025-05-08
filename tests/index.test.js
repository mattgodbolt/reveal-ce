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
});
