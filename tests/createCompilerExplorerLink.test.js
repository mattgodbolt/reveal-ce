import {describe, it, expect} from 'vitest';
import {createCompilerExplorerLink} from '../index.js';

describe('createCompilerExplorerLink function', () => {
    let mockConfig;

    beforeEach(() => {
        // Reset config for each test
        mockConfig = {
            editorFontScale: 2.0,
            compilerFontScale: 2.5,
            intelSyntax: true,
            trimAsmWhitespace: true,
            additionalCompilerOptions: '-Wall',
        };
    });

    it('should create a valid URL fragment', () => {
        const source = 'int main() { return 0; }';
        const options = '-O2';
        const language = 'c++';
        const compiler = 'g142';

        const fragment = createCompilerExplorerLink(mockConfig, source, options, language, compiler);

        // Should be URL encoded
        expect(fragment).toMatch(/%7B/); // '{' encoded
        expect(fragment).toMatch(/%7D/); // '}' encoded

        // Decode and verify content
        const decodedObj = JSON.parse(decodeURIComponent(fragment));

        // Verify basic structure
        expect(decodedObj.version).toBe(4);
        expect(decodedObj.content).toBeInstanceOf(Array);
        expect(decodedObj.content[0].type).toBe('row');

        // Verify content components
        const components = decodedObj.content[0].content;
        expect(components).toHaveLength(2);

        // Check editor component
        const editorComponent = components[0];
        expect(editorComponent.componentName).toBe('codeEditor');
        expect(editorComponent.componentState.source).toBe(source);
        expect(editorComponent.componentState.lang).toBe(language);
        expect(editorComponent.componentState.fontScale).toBe(mockConfig.editorFontScale);

        // Check compiler component
        const compilerComponent = components[1];
        expect(compilerComponent.componentName).toBe('compiler');
        expect(compilerComponent.componentState.source).toBe(1);
        expect(compilerComponent.componentState.compiler).toBe(compiler);
        expect(compilerComponent.componentState.fontScale).toBe(mockConfig.compilerFontScale);
        expect(compilerComponent.componentState.options).toContain(options);
        expect(compilerComponent.componentState.options).toContain(mockConfig.additionalCompilerOptions);

        // Check filters
        const filters = compilerComponent.componentState.filters;
        expect(filters.intel).toBe(mockConfig.intelSyntax);
        expect(filters.trim).toBe(mockConfig.trimAsmWhitespace);
    });

    it('should handle object-based options', () => {
        const source = 'int main() { return 0; }';
        const options = {
            'c++': '-O2',
            rust: '-O3',
        };
        const language = 'c++';
        const compiler = 'g142';

        const fragment = createCompilerExplorerLink(mockConfig, source, options, language, compiler);

        // Decode and verify content
        const decodedObj = JSON.parse(decodeURIComponent(fragment));
        const compilerComponent = decodedObj.content[0].content[1];

        // Should use the language-specific option
        expect(compilerComponent.componentState.options).toContain('-O2');
        expect(compilerComponent.componentState.options).not.toContain('-O3');
    });

    it('should handle object-based additionalCompilerOptions', () => {
        const source = 'int main() { return 0; }';
        const options = '-O2';
        const language = 'c++';
        const compiler = 'g142';

        // Set language-specific additionalCompilerOptions
        mockConfig.additionalCompilerOptions = {
            'c++': '-Wall -Wextra',
            rust: '--verbose',
        };

        const fragment = createCompilerExplorerLink(mockConfig, source, options, language, compiler);

        // Decode and verify content
        const decodedObj = JSON.parse(decodeURIComponent(fragment));
        const compilerComponent = decodedObj.content[0].content[1];

        // Should use the language-specific option
        expect(compilerComponent.componentState.options).toContain('-Wall -Wextra');
        expect(compilerComponent.componentState.options).not.toContain('--verbose');
    });

    it('should handle empty options', () => {
        const source = 'int main() { return 0; }';
        const options = '';
        const language = 'c++';
        const compiler = 'g142';

        const fragment = createCompilerExplorerLink(mockConfig, source, options, language, compiler);

        // Decode and verify content
        const decodedObj = JSON.parse(decodeURIComponent(fragment));
        const compilerComponent = decodedObj.content[0].content[1];

        // Should still include additionalCompilerOptions
        expect(compilerComponent.componentState.options).toBe(mockConfig.additionalCompilerOptions);
    });
});
