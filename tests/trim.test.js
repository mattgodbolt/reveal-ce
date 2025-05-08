import {describe, it, expect} from 'vitest';
import {trim} from '../index.js';

describe('trim function', () => {
    it('should remove leading and trailing empty lines', () => {
        const source = ['', '  ', 'int main() {', '    return 0;', '}', '', '  '];
        const expected = 'int main() {\n    return 0;\n}';

        expect(trim(source, false)).toBe(expected);
    });

    it('should handle empty input', () => {
        expect(trim([], false)).toBe('');
    });

    it('should handle input with only whitespace', () => {
        const source = ['', '  ', '\t'];
        expect(trim(source, false)).toBe('');
    });

    it('should undent code when undent=true', () => {
        const source = ['    int main() {', '        return 0;', '    }'];
        const expected = 'int main() {\n    return 0;\n}';

        expect(trim(source, true)).toBe(expected);
    });

    it('should handle mixed indentation when undenting', () => {
        const source = ['    int main() {', '      return 0;', '    }'];
        const expected = 'int main() {\n  return 0;\n}';

        expect(trim(source, true)).toBe(expected);
    });

    it('should handle empty lines when undenting', () => {
        const source = ['    int main() {', '', '        return 0;', '    }'];
        const expected = 'int main() {\n\n    return 0;\n}';

        expect(trim(source, true)).toBe(expected);
    });

    it('should handle no indentation when undent=true', () => {
        const source = ['int main() {', '    return 0;', '}'];
        const expected = 'int main() {\n    return 0;\n}';

        expect(trim(source, true)).toBe(expected);
    });
});
