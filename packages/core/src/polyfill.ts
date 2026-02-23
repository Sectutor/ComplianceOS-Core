const g = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {};

if (typeof (g as any).DOMMatrix === 'undefined') {
    (g as any).DOMMatrix = class DOMMatrix {
        constructor() { }
        static fromFloat32Array() { return new DOMMatrix(); }
        static fromFloat64Array() { return new DOMMatrix(); }
        static fromMatrix() { return new DOMMatrix(); }
    };
}

// Add other critical browser globals
if (typeof (g as any).window === 'undefined') (g as any).window = g;
if (typeof (g as any).self === 'undefined') (g as any).self = g;
if (typeof (g as any).document === 'undefined') {
    (g as any).document = {
        createElement: () => ({
            setAttribute: () => { },
            style: {},
            appendChild: () => { },
            getContext: () => ({ fillRect: () => { }, measureText: () => ({ width: 0 }) })
        }),
        getElementsByTagName: () => [],
        documentElement: { style: {} },
        addEventListener: () => { },
        removeEventListener: () => { },
    };
}
if (typeof (g as any).navigator === 'undefined') (g as any).navigator = { userAgent: 'Node.js' };
if (typeof (g as any).location === 'undefined') {
    (g as any).location = {
        href: 'https://app.grcompliance.com/',
        origin: 'https://app.grcompliance.com',
        protocol: 'https:',
        host: 'app.grcompliance.com',
        hostname: 'app.grcompliance.com',
        port: '',
        pathname: '/',
        search: '',
        hash: '',
        assign: () => { },
        replace: () => { },
        reload: () => { },
        toString: () => 'https://app.grcompliance.com/',
    };
}

if (typeof (g as any).Node === 'undefined') (g as any).Node = class Node { };
if (typeof (g as any).Element === 'undefined') (g as any).Element = class Element { };
if (typeof (g as any).HTMLElement === 'undefined') (g as any).HTMLElement = class HTMLElement extends (g as any).Element { };
if (typeof (g as any).localStorage === 'undefined') (g as any).localStorage = { getItem: () => null, setItem: () => { }, removeItem: () => { }, clear: () => { } };
if (typeof (g as any).sessionStorage === 'undefined') (g as any).sessionStorage = { getItem: () => null, setItem: () => { }, removeItem: () => { }, clear: () => { } };
