import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface BrandingConfig {
    appName: string;
    logoUrl: string | null;
    primaryColor: string;
    logoSize: number; // Percentage scale (50-200)
    sidebarBg: string; // Left-hand color
    headingFont: string;
    bodyFont: string;
    portalTitle: string;
}

export const CURATED_FONTS = [
    { name: 'Inter', family: 'Inter' },
    { name: 'Outfit', family: 'Outfit' },
    { name: 'Montserrat', family: 'Montserrat' },
    { name: 'Roboto', family: 'Roboto' },
    { name: 'Lexend', family: 'Lexend' },
    { name: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans' },
];

export const BRAND_PRESETS = {
    eliteGuardian: {
        name: 'Elite Guardian',
        primaryColor: '#3B82F6',
        sidebarBg: '#020617',
        headingFont: 'Outfit',
        bodyFont: 'Inter',
        description: 'Deep navy and electric blue for a high-security authority look.'
    },
    modernAuditor: {
        name: 'Modern Auditor',
        primaryColor: '#6366F1',
        sidebarBg: '#F8FAFC',
        headingFont: 'Plus Jakarta Sans',
        bodyFont: 'Inter',
        description: 'Clean, minimalist, and trustworthy induction of clarity.'
    },
    cyberGothic: {
        name: 'Cyber Gothic',
        primaryColor: '#06B6D4',
        sidebarBg: '#000000',
        headingFont: 'Lexend',
        bodyFont: 'Inter',
        description: 'Pure black with cyan accents for a futuristic command center.'
    }
};

/**
 * Determines if text should be light or dark based on background color
 * Uses YIQ color space formula
 */
export const getContrastColor = (hexcolor: string) => {
    // If not a valid hex, return white for safety
    if (!hexcolor || hexcolor.length < 6) return '#ffffff';

    // Remove # if present
    const hex = hexcolor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

interface BrandingContextType extends BrandingConfig {
    updateBranding: (config: Partial<BrandingConfig>) => void;
    resetBranding: () => void;
}

import logoUrl from '../assets/logo.png';

const defaultBranding: BrandingConfig = {
    appName: 'GRCompliance',
    logoUrl: logoUrl,
    primaryColor: BRAND_PRESETS.eliteGuardian.primaryColor,
    logoSize: 100,
    sidebarBg: BRAND_PRESETS.eliteGuardian.sidebarBg,
    headingFont: BRAND_PRESETS.eliteGuardian.headingFont,
    bodyFont: BRAND_PRESETS.eliteGuardian.bodyFont,
    portalTitle: 'GRCompliance Portal',
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider = ({ children }: { children: React.ReactNode }) => {
    // Load from localStorage if available
    const [config, setConfig] = useState<BrandingConfig>(() => {
        const saved = localStorage.getItem('branding-config-v3') || localStorage.getItem('branding-config-v2');
        if (saved) {
            try {
                return { ...defaultBranding, ...JSON.parse(saved) };
            } catch (e) {
                return defaultBranding;
            }
        }
        return defaultBranding;
    });

    useEffect(() => {
        localStorage.setItem('branding-config-v3', JSON.stringify(config));

        // Apply variables to document root
        const root = document.documentElement;
        root.style.setProperty('--primary', config.primaryColor);
        root.style.setProperty('--sidebar', config.sidebarBg);

        const sidebarFg = getContrastColor(config.sidebarBg);
        root.style.setProperty('--sidebar-foreground', sidebarFg);
        root.style.setProperty('--sidebar-border', sidebarFg === '#ffffff' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)');

        // Font Loading Logic - Defensive against undefined
        const fontsToLoad = [config.headingFont, config.bodyFont].filter(Boolean);
        fontsToLoad.forEach(font => {
            if (typeof font !== 'string') return;
            const fontId = `branding-font-${font.replace(/\s+/g, '-').toLowerCase()}`;
            if (!document.getElementById(fontId)) {
                const link = document.createElement('link');
                link.id = fontId;
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
                document.head.appendChild(link);
            }
        });

        // Apply fonts
        if (config.headingFont) root.style.setProperty('--font-heading', `${config.headingFont}, sans-serif`);
        if (config.bodyFont) root.style.setProperty('--font-body', `${config.bodyFont}, sans-serif`);

        // Apply typography globally if needed
        document.body.style.fontFamily = `var(--font-body)`;

        // Update document title
        if (config.portalTitle) {
            document.title = config.portalTitle;
        }
    }, [config]);

    const updateBranding = useCallback((newConfig: Partial<BrandingConfig>) => {
        setConfig((prev) => ({ ...prev, ...newConfig }));
    }, []);

    const resetBranding = useCallback(() => {
        setConfig(defaultBranding);
    }, []);

    return (
        <BrandingContext.Provider value={{ ...config, updateBranding, resetBranding }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (!context) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};

export const BrandLogo = ({ className = "", showText = false, invert = false }: { className?: string, showText?: boolean, invert?: boolean }) => {
    const { appName, logoUrl: configLogoUrl, logoSize } = useBranding();
    const scale = (logoSize / 100) * 1.2; // Adjusted base scale

    // Check if we have the white logo file
    const displayLogo = configLogoUrl;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {displayLogo ? (
                <img
                    src={displayLogo}
                    alt={appName}
                    className="h-12 w-auto object-contain transition-all"
                    style={{ height: `${3 * scale}rem` }}
                />
            ) : (
                <div
                    className={`${invert ? 'bg-white/20' : 'bg-blue-600/10'} p-2 rounded-lg transition-all`}
                    style={{ transform: `scale(${scale})` }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`h-8 w-8 ${invert ? 'text-white' : 'text-blue-600'}`}
                    >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    </svg>
                </div>
            )}
            {showText && !displayLogo && <span className={`font-bold text-lg tracking-tight ${invert ? 'text-white' : ''}`}>{appName}</span>}
        </div>
    );
};
