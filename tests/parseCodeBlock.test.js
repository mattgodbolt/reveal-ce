import {describe, it, expect, vi, beforeEach} from 'vitest';
import {parseCodeBlock} from '../index.js';

describe('parseCodeBlock function', () => {
    // Setup test environment
    let mockConfig;
    let mockElement;

    beforeEach(() => {
        // Reset mocks for each test
        mockConfig = {
            defaultLanguage: 'c++',
            defaultCompiler: 'g142',
            defaultCompilerOptions: '-O2',
            maxLineLength: 50,
            undent: true,
        };

        // Mock console.error to avoid noise from line length warnings
        console.error = vi.fn();
    });

    it('should parse code with hide markers correctly', () => {
        // Setup element
        mockElement = {
            textContent: '///hide\nint hidden() { return 42; }\n///unhide\nint main() { return 0; }',
            dataset: {},
        };

        const result = parseCodeBlock(mockConfig, mockElement);

        // Should keep all code in source
        expect(result.source).toContain('hidden');
        expect(result.source).toContain('main');

        // Should not include hidden code in displaySource
        expect(result.displaySource).not.toContain('hidden');
        expect(result.displaySource).toContain('main');
    });

    it('should parse code with setup region correctly', () => {
        // Setup element with proper indentation for setup (the code checks for first character being a space)
        mockElement = {
            textContent: '// setup\n #include <iostream>\n \n \nint main() { return 0; }',
            dataset: {},
        };

        const result = parseCodeBlock(mockConfig, mockElement);

        // Should keep all code in source
        expect(result.source).toContain('#include');
        expect(result.source).toContain('main');

        // Should not include setup region in displaySource
        expect(result.displaySource).not.toContain('#include');
        expect(result.displaySource).toContain('main');
    });

    it('should use dataset attributes if provided', () => {
        // Setup element with custom attributes
        mockElement = {
            textContent: 'int main() { return 0; }',
            dataset: {
                ceLanguage: 'rust',
                ceCompiler: 'rust-nightly',
                ceOptions: '-O3',
            },
        };

        const result = parseCodeBlock(mockConfig, mockElement);

        // Should use the provided attributes
        expect(result.language).toBe('rust');
        expect(result.compiler).toBe('rust-nightly');
        expect(result.options).toBe('-O3');
    });

    it('should fallback to config defaults if attributes not provided', () => {
        // Setup element without attributes
        mockElement = {
            textContent: 'int main() { return 0; }',
            dataset: {},
        };

        const result = parseCodeBlock(mockConfig, mockElement);

        // Should use config defaults
        expect(result.language).toBe('c++');
        expect(result.compiler).toBe('g142');
        expect(result.options).toBe('-O2');
    });

    it('should warn about lines exceeding maxLineLength', () => {
        // Setup element with long line
        mockElement = {
            textContent: 'int main() { /* This is a very long line that exceeds the max line length */ return 0; }',
            dataset: {},
        };

        parseCodeBlock(mockConfig, mockElement);

        // Should log warning about long line
        expect(console.error).toHaveBeenCalled();
    });
});
