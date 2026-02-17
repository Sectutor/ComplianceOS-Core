
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(viteConfig, defineConfig({
    test: {
        globals: true,
        environment: 'node', // Changed from happy-dom for backend testing
        setupFiles: './test/setup.ts', // Corrected path
        css: true,
        testTimeout: 10000,
    },
}));
