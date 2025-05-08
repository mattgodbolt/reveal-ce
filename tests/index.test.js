import {describe, it, expect, vi, beforeEach} from 'vitest';
import plugin from '../index.js';

// Mock DOM environment
function setupDom() {
    document.body.innerHTML = `
        <div class="reveal">
            <div class="slides">
                <section>
                    <pre><code data-ce="true" data-ce-language="c++" data-ce-compiler="g142">// setup
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
}</code></pre>
                </section>
                <section>
                    <pre><code data-ce="true">int simple() {
    return 0;
}</code></pre>
                </section>
            </div>
        </div>
    `;
}

describe('reveal-ce plugin', () => {
    // Mock window.location before any tests run
    const originalLocation = window.location;

    beforeEach(() => {
        // Reset DOM for each test
        document.body.innerHTML = '';
        setupDom();

        // Mock window.location
        delete window.location;
        window.location = {
            assign: vi.fn(),
        };

        // Mock console.error to avoid noise from line length warnings
        console.error = vi.fn();
    });

    afterEach(() => {
        // Restore original location
        window.location = originalLocation;
        // Restore console.error
        console.error = vi.fn().mockRestore();
    });

    describe('plugin initialization', () => {
        it('should register the plugin with reveal.js', () => {
            const pluginDef = plugin();
            expect(pluginDef.id).toBe('compiler-explorer');
            expect(typeof pluginDef.init).toBe('function');
        });

        it('should process code blocks with data-ce attribute', () => {
            // Setup reveal.js deck mock
            const mockDeck = {
                getSlidesElement: () => document.querySelector('.slides'),
                getConfig: () => ({ce: null}), // Use default config
            };

            // Initialize the plugin
            const pluginDef = plugin();
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
            // Setup reveal.js deck mock
            const mockDeck = {
                getSlidesElement: () => document.querySelector('.slides'),
                getConfig: () => ({ce: null}), // Use default config
            };

            // Initialize the plugin
            const pluginDef = plugin();
            pluginDef.init(mockDeck);

            // Find the pre element and simulate a ctrl+click
            const preElement = document.querySelector('pre');
            preElement.onclick({ctrlKey: true});

            // Check if location.assign was called with a Compiler Explorer URL
            expect(window.location.assign).toHaveBeenCalled();
            const url = window.location.assign.mock.calls[0][0];
            expect(url).toContain('https://slides.compiler-explorer.com');
            expect(url).toContain('#');
        });

        it('should not open Compiler Explorer on regular click', () => {
            // Setup reveal.js deck mock
            const mockDeck = {
                getSlidesElement: () => document.querySelector('.slides'),
                getConfig: () => ({ce: null}), // Use default config
            };

            // Initialize the plugin
            const pluginDef = plugin();
            pluginDef.init(mockDeck);

            // Find the pre element and simulate a regular click
            const preElement = document.querySelector('pre');
            preElement.onclick({ctrlKey: false});

            // Check that location.assign was not called
            expect(window.location.assign).not.toHaveBeenCalled();
        });
    });

    describe('custom configuration', () => {
        it('should honor custom configuration options', () => {
            // Setup reveal.js deck with custom config
            const mockDeck = {
                getSlidesElement: () => document.querySelector('.slides'),
                getConfig: () => ({
                    ce: {
                        baseUrl: 'https://godbolt.org',
                        defaultLanguage: 'rust',
                        defaultCompiler: 'rust',
                        defaultCompilerOptions: '-O3',
                    },
                }),
            };

            // Initialize the plugin
            const pluginDef = plugin();
            pluginDef.init(mockDeck);

            // Find the pre element and simulate a ctrl+click
            const preElement = document.querySelector('pre');
            preElement.onclick({ctrlKey: true});

            // Check that the custom baseUrl was used
            expect(window.location.assign).toHaveBeenCalled();
            const url = window.location.assign.mock.calls[0][0];
            expect(url).toContain('https://godbolt.org');
        });
    });
});
