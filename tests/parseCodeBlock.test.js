import {describe, it, expect, vi} from 'vitest';
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

    it('should handle empty lines correctly in setup mode', () => {
        // This test verifies handling of empty lines in setup mode
        mockElement = {
            textContent: '// setup\n\nint main() { return 0; }',
            dataset: {},
        };

        try {
            const result = parseCodeBlock(mockConfig, mockElement);

            // Should keep all code in source
            expect(result.source).toContain('main');

            // Empty lines in setup should not cause errors
            expect(result.displaySource).toContain('main');
        } catch (e) {
            // This will make the test fail if an error occurs
            expect(e).toBeUndefined();
        }
    });

    it('should properly maintain setup mode through empty lines', () => {
        mockElement = {
            textContent: '// setup\n #include <iostream>\n\n\n int main() { return 0; }',
            dataset: {},
        };

        const result = parseCodeBlock(mockConfig, mockElement);

        // All lines should be in source
        expect(result.source).toContain('#include');
        expect(result.source).toContain('main');

        // Nothing should appear in display source
        // because all code has leading spaces keeping it in setup mode
        expect(result.displaySource).not.toContain('#include');
        expect(result.displaySource).not.toContain('main');
        expect(result.displaySource).toBe('');
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

        // Setup mock logger
        const mockLogger = vi.fn();

        parseCodeBlock(mockConfig, mockElement, mockLogger);

        // Should log warning about long line using our injected logger
        expect(mockLogger).toHaveBeenCalled();
    });

    it('should support language-specific compiler mapping', () => {
        // Setup config with language-specific compiler mapping
        mockConfig.defaultCompiler = {
            'c++': 'g142',
            rust: 'rust',
        };

        // Element with Rust language
        mockElement = {
            textContent: 'fn main() {}',
            dataset: {
                ceLanguage: 'rust',
            },
        };

        const result = parseCodeBlock(mockConfig, mockElement);

        // Should use language-specific compiler
        expect(result.language).toBe('rust');
        expect(result.compiler).toBe('rust');
    });

    it('should extract removeRegex from data-ce-remove-regex attribute', () => {
        // Setup element with remove regex attribute
        mockElement = {
            textContent: 'ldp x8, x9, [x0]    ; x8=begin, x9=end',
            dataset: {
                ceRemoveRegex: ';.*',
            },
        };

        const result = parseCodeBlock(mockConfig, mockElement);

        // Should extract the removeRegex
        expect(result.removeRegex).toBe(';.*');
    });

    it('should use defaultRemoveRegex from config when attribute not provided', () => {
        // Setup config with default removeRegex
        mockConfig.defaultRemoveRegex = ';.*';

        // Element without remove regex attribute
        mockElement = {
            textContent: 'ldp x8, x9, [x0]    ; x8=begin, x9=end',
            dataset: {},
        };

        const result = parseCodeBlock(mockConfig, mockElement);

        // Should use config default
        expect(result.removeRegex).toBe(';.*');
    });

    it('should support language-specific defaultRemoveRegex', () => {
        // Setup config with language-specific removeRegex
        mockConfig.defaultRemoveRegex = {
            'c++': '//.*',
            asm: ';.*',
        };

        // Element with asm language
        mockElement = {
            textContent: 'ldp x8, x9, [x0]    ; x8=begin, x9=end',
            dataset: {
                ceLanguage: 'asm',
            },
        };

        const result = parseCodeBlock(mockConfig, mockElement);

        // Should use language-specific removeRegex
        expect(result.language).toBe('asm');
        expect(result.removeRegex).toBe(';.*');
    });
});
