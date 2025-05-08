import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {attachEventListeners} from '../index.js';

describe('attachEventListeners function', () => {
    // Store original window.location
    const originalLocation = window.location;

    beforeEach(() => {
        // Mock window.location
        delete window.location;
        window.location = {
            assign: vi.fn(),
        };
    });

    afterEach(() => {
        // Restore original window.location
        window.location = originalLocation;
    });

    it('should attach onclick handler to the parent element', () => {
        // Setup mocks
        const mockConfig = {
            baseUrl: 'https://godbolt.org',
        };

        const mockElement = {
            parentElement: {},
        };

        const ceFragment = 'mockFragment';

        // Call the function
        attachEventListeners(mockConfig, mockElement, ceFragment);

        // Verify onclick was attached
        expect(typeof mockElement.parentElement.onclick).toBe('function');
    });

    it('should navigate to Compiler Explorer URL on Ctrl+Click', () => {
        // Setup mocks
        const mockConfig = {
            baseUrl: 'https://godbolt.org',
        };

        const mockElement = {
            parentElement: {},
        };

        const ceFragment = 'mockFragment';

        // Call the function
        attachEventListeners(mockConfig, mockElement, ceFragment);

        // Trigger Ctrl+Click
        mockElement.parentElement.onclick({ctrlKey: true});

        // Verify navigation occurred with correct URL
        expect(window.location.assign).toHaveBeenCalledWith('https://godbolt.org#mockFragment');
    });

    it('should not navigate on regular click', () => {
        // Setup mocks
        const mockConfig = {
            baseUrl: 'https://godbolt.org',
        };

        const mockElement = {
            parentElement: {},
        };

        const ceFragment = 'mockFragment';

        // Call the function
        attachEventListeners(mockConfig, mockElement, ceFragment);

        // Trigger regular click (no Ctrl key)
        mockElement.parentElement.onclick({ctrlKey: false});

        // Verify no navigation occurred
        expect(window.location.assign).not.toHaveBeenCalled();
    });
});
