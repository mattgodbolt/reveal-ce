import {vi} from 'vitest';

/**
 * Creates a mockable URL launcher that can be used to test code that would
 * normally call window.location.assign
 * @returns {{navigate: function, getMockImplementation: function}} Object with navigate function and mock inspection
 */
export function createURLLauncher() {
    const mockNavigate = vi.fn();

    return {
        navigate: url => mockNavigate(url),
        getMockImplementation: () => mockNavigate,
    };
}

/**
 * Sets up a DOM environment for testing with reveal.js code blocks
 * @param {Object} options - Configuration options
 * @param {string} options.codeContent - Code content to insert in the first code block
 * @param {Object} options.attributes - data-* attributes to add to the code element
 * @returns {HTMLElement} The container element
 */
export function setupDOM(options = {}) {
    const {codeContent = '// Default code', attributes = {}} = options;

    // Create attributes string
    const attributesStr = Object.entries(attributes)
        .map(([key, value]) => `data-${key}="${value}"`)
        .join(' ');

    document.body.innerHTML = `
        <div class="reveal">
            <div class="slides">
                <section>
                    <pre><code ${attributesStr}>${codeContent}</code></pre>
                </section>
            </div>
        </div>
    `;

    return document.body;
}

/**
 * Creates a mock reveal.js deck with configurable options
 * @param {Object} config - Configuration to return from getConfig
 * @returns {Object} Mock deck object
 */
export function createMockDeck(config = {}) {
    return {
        getSlidesElement: () => document.querySelector('.slides'),
        getConfig: () => config,
    };
}
