import {describe, it, expect, vi} from 'vitest';
import {attachEventListeners} from '../index.js';
import {createURLLauncher} from './testUtils.js';

describe('attachEventListeners function', () => {
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

        // Create URL launcher mock
        const urlLauncher = createURLLauncher();

        // Call the function with our mock URL launcher
        attachEventListeners(mockConfig, mockElement, ceFragment, urlLauncher.navigate);

        // Trigger Ctrl+Click
        mockElement.parentElement.onclick({ctrlKey: true});

        // Verify navigation occurred with correct URL
        expect(urlLauncher.getMockImplementation()).toHaveBeenCalledWith('https://godbolt.org#mockFragment');
    });

    it('should navigate to Compiler Explorer URL on Command+Click for MacOS', () => {
        // Setup mocks
        const mockConfig = {
            baseUrl: 'https://godbolt.org',
        };

        const mockElement = {
            parentElement: {},
        };

        const ceFragment = 'mockFragment';

        // Create URL launcher mock
        const urlLauncher = createURLLauncher();

        // Call the function with our mock URL launcher
        attachEventListeners(mockConfig, mockElement, ceFragment, urlLauncher.navigate);

        // Trigger Ctrl+Click
        mockElement.parentElement.onclick({metaKey: true});

        // Verify navigation occurred with correct URL
        expect(urlLauncher.getMockImplementation()).toHaveBeenCalledWith('https://godbolt.org#mockFragment');
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

        // Create URL launcher mock
        const urlLauncher = createURLLauncher();

        // Call the function with our mock URL launcher
        attachEventListeners(mockConfig, mockElement, ceFragment, urlLauncher.navigate);

        // Trigger regular click (no Ctrl key)
        mockElement.parentElement.onclick({ctrlKey: false});

        // Verify no navigation occurred
        expect(urlLauncher.getMockImplementation()).not.toHaveBeenCalled();
    });
});
