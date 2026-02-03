
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock IntersectionObserver
const MockIntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// Mock ResizeObserver
const MockResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

vi.stubGlobal('ResizeObserver', MockResizeObserver);
