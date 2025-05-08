import {describe, it, expect} from 'vitest';
import {initializeConfig} from '../index.js';

describe('initializeConfig function', () => {
    it('should provide default config when no user config is provided', () => {
        // Mock deck with empty config
        const mockDeck = {
            getConfig: () => ({}),
        };

        const config = initializeConfig(mockDeck);

        // Verify default values
        expect(config.baseUrl).toBe('https://slides.compiler-explorer.com');
        expect(config.maxLineLength).toBe(50);
        expect(config.editorFontScale).toBe(2.5);
        expect(config.compilerFontScale).toBe(3.0);
        expect(config.defaultLanguage).toBe('c++');
        expect(config.defaultCompiler).toBe('g142');
        expect(config.defaultCompilerOptions).toBe('-O1');
        expect(config.additionalCompilerOptions).toBe('-Wall -Wextra');
        expect(config.intelSyntax).toBe(true);
        expect(config.trimAsmWhitespace).toBe(true);
        expect(config.undent).toBe(true);
    });

    it('should merge user config with defaults', () => {
        // Mock deck with custom config
        const mockDeck = {
            getConfig: () => ({
                ce: {
                    baseUrl: 'https://godbolt.org',
                    defaultLanguage: 'rust',
                    defaultCompiler: 'rust-nightly',
                    // Other properties should use defaults
                },
            }),
        };

        const config = initializeConfig(mockDeck);

        // Verify overridden values
        expect(config.baseUrl).toBe('https://godbolt.org');
        expect(config.defaultLanguage).toBe('rust');
        expect(config.defaultCompiler).toBe('rust-nightly');

        // Verify default values for properties not overridden
        expect(config.maxLineLength).toBe(50);
        expect(config.editorFontScale).toBe(2.5);
        expect(config.compilerFontScale).toBe(3.0);
        expect(config.defaultCompilerOptions).toBe('-O1');
        expect(config.additionalCompilerOptions).toBe('-Wall -Wextra');
        expect(config.intelSyntax).toBe(true);
        expect(config.trimAsmWhitespace).toBe(true);
        expect(config.undent).toBe(true);
    });

    it('should handle partial user config', () => {
        // Mock deck with partial custom config
        const mockDeck = {
            getConfig: () => ({
                ce: {
                    // Only override some properties
                    defaultCompilerOptions: '-O3',
                    intelSyntax: false,
                },
            }),
        };

        const config = initializeConfig(mockDeck);

        // Verify overridden values
        expect(config.defaultCompilerOptions).toBe('-O3');
        expect(config.intelSyntax).toBe(false);

        // Verify default values for properties not overridden
        expect(config.baseUrl).toBe('https://slides.compiler-explorer.com');
        expect(config.maxLineLength).toBe(50);
        expect(config.defaultLanguage).toBe('c++');
        expect(config.defaultCompiler).toBe('g142');
    });
});
