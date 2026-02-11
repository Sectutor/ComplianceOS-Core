import path from "path";
import fs from "fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from '@tailwindcss/vite';

// Auto-detect if premium package is available
const premiumPath = path.resolve(__dirname, "../premium/src");
const forceDisablePremium = process.env.VITE_ENABLE_PREMIUM === 'false';
const hasPremium = !forceDisablePremium && fs.existsSync(premiumPath);

console.log(`[Vite] Building with ${hasPremium ? 'Premium' : 'Open Source'} edition.`);

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@complianceos/ui": path.resolve(__dirname, "../ui/src"),
            "@shared": path.resolve(__dirname, "../../shared"),
            "@complianceos/premium": hasPremium
                ? premiumPath
                : path.resolve(__dirname, "./src/mocks/premium"),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:3002',
                changeOrigin: true,
                secure: false,
            },
            '/uploads': {
                target: 'http://127.0.0.1:3002',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    optimizeDeps: {
        include: [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
            'date-fns'
        ]
    }
});
