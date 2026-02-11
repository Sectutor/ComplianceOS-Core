import React, { createContext, useContext, useState, useEffect } from 'react';

export interface BrandingConfig {
    appName: string;
    logoUrl: string | null;
    primaryColor: string;
    logoSize: number; // Percentage scale (50-200)
}

interface BrandingContextType extends BrandingConfig {
    updateBranding: (config: Partial<BrandingConfig>) => void;
    resetBranding: () => void;
}

const defaultBranding: BrandingConfig = {
    appName: 'GRCompliance',
    logoUrl: null,
    primaryColor: '#0066CC',
    logoSize: 100,
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider = ({ children }: { children: React.ReactNode }) => {
    // Load from localStorage if available
    const [config, setConfig] = useState<BrandingConfig>(() => {
        const saved = localStorage.getItem('branding-config');
        return saved ? JSON.parse(saved) : defaultBranding;
    });

    useEffect(() => {
        localStorage.setItem('branding-config', JSON.stringify(config));
        // Apply primary color to CSS variable if needed
        document.documentElement.style.setProperty('--primary', config.primaryColor);
    }, [config]);

    const updateBranding = (newConfig: Partial<BrandingConfig>) => {
        setConfig((prev) => ({ ...prev, ...newConfig }));
    };

    const resetBranding = () => {
        setConfig(defaultBranding);
    };

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

export const BrandLogo = ({ className = "", showText = true }: { className?: string, showText?: boolean }) => {
    const { appName, logoUrl, logoSize } = useBranding();
    const scale = logoSize / 100;

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {logoUrl ? (
                <img
                    src={logoUrl}
                    alt={appName}
                    className="h-10 w-auto object-contain transition-all"
                    style={{ height: `${2.5 * scale}rem` }} // Base 2.5rem (h-10) * scale
                />
            ) : (
                <div
                    className="bg-blue-600/10 p-2 rounded-lg transition-all"
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
                        className="h-8 w-8 text-blue-600"
                    >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    </svg>
                </div>
            )}
            {showText && <span className="font-bold text-xl tracking-tight">{appName}</span>}
        </div>
    );
};
