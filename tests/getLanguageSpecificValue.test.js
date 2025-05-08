import {describe, it, expect} from 'vitest';
import {getLanguageSpecificValue} from '../index.js';

describe('getLanguageSpecificValue function', () => {
    it('should return the string value directly when given a string', () => {
        const value = '-O2';
        const language = 'c++';

        const result = getLanguageSpecificValue(value, language);

        expect(result).toBe('-O2');
    });

    it('should return the language-specific value when given an object', () => {
        const value = {
            'c++': '-O2',
            rust: '-O3',
            go: '-N -l',
        };
        const language = 'rust';

        const result = getLanguageSpecificValue(value, language);

        expect(result).toBe('-O3');
    });

    it('should return the default value when language not found in object', () => {
        const value = {
            'c++': '-O2',
            rust: '-O3',
        };
        const language = 'go';
        const defaultValue = '-gcflags';

        const result = getLanguageSpecificValue(value, language, defaultValue);

        expect(result).toBe('-gcflags');
    });

    it('should return empty string when language not found and no default provided', () => {
        const value = {
            'c++': '-O2',
            rust: '-O3',
        };
        const language = 'go';

        const result = getLanguageSpecificValue(value, language);

        expect(result).toBe('');
    });

    it('should handle null or undefined values', () => {
        const language = 'c++';
        const defaultValue = '-O1';

        expect(getLanguageSpecificValue(null, language, defaultValue)).toBe(defaultValue);
        expect(getLanguageSpecificValue(undefined, language, defaultValue)).toBe(defaultValue);
    });
});
