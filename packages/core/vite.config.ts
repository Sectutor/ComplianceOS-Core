import path from "path";
import fs from "fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from '@tailwindcss/vite';

// Dual-licensing build configuration
// BUILD_TYPE can be: 'AGPLv3' (Community), 'COMMERCIAL' (Enterprise), or 'TRIAL'
const buildType = process.env.BUILD_TYPE || 'AGPLv3';
const forceDisablePremium = process.env.VITE_ENABLE_PREMIUM === 'false';

// For commercial builds, check if premium package exists
const premiumPath = path.resolve(__dirname, "../premium/src");
const hasPremium = (buildType === 'COMMERCIAL' || buildType === 'TRIAL') &&
    !forceDisablePremium &&
    fs.existsSync(premiumPath);

// Set license type for the build
const licenseType = buildType === 'AGPLv3' ? 'AGPLv3 Community' :
    buildType === 'TRIAL' ? 'Commercial Trial' :
        'Commercial Enterprise';

console.log(`[Vite] Building ${licenseType} edition (Build Type: ${buildType})`);
console.log(`[Vite] Premium features: ${hasPremium ? 'ENABLED' : 'DISABLED'}`);

export default defineConfig({
    plugins: [react(), tailwindcss()],
    define: {
        "process.env.BUILD_TYPE": JSON.stringify(buildType),
        "process.env.VITE_ENABLE_PREMIUM": JSON.stringify(process.env.VITE_ENABLE_PREMIUM || "true"),
    },
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
                timeout: parseInt(process.env.VITE_PROXY_TIMEOUT || '60000'),
                proxyTimeout: parseInt(process.env.VITE_PROXY_TIMEOUT || '60000'),
                // Add error handling for proxy errors
                configure: (proxy, _options) => {
                    const DEBUG_PROXY = process.env.DEBUG_PROXY === 'true';
                    
                    proxy.on('error', (err, req, res: any) => {
                        console.error('[Vite Proxy Error]', err.message, req.url);
                        if (res && !res.headersSent) {
                            res.writeHead(502, { 'Content-Type': 'application/json' });
                            const trpcErrorPayload = {
                                error: {
                                    message: 'Proxy Error: ' + err.message,
                                    code: -32603,
                                    data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 502 }
                                }
                            };
                            res.end(JSON.stringify([trpcErrorPayload]));
                        }
                    });
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                        if (DEBUG_PROXY) console.log('[Vite Proxy Request]', req.method, req.url, '->', proxyReq.path);
                    });
                    proxy.on('proxyRes', (proxyRes, req, _res) => {
                        if (DEBUG_PROXY) console.log('[Vite Proxy Response]', proxyRes.statusCode, req.url);
                    });
                },
                bypass: (req) => {
                    // Do not proxy OAuth callback routes - handle them in the frontend
                    if (req.url?.includes('/api/oauth/')) {
                        return req.url;
                    }
                }
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
