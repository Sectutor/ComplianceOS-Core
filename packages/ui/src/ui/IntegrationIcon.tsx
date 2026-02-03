
import React from 'react';
import { Cloud, Database, Github, Globe, HardDrive, Layout, Lock, Mail, MessageSquare, Server, Shield, Slack, Terminal, Trello } from 'lucide-react';

export type IntegrationProvider = 'jira' | 'slack' | 'aws' | 'gcp' | 'azure' | 'github' | 'gitlab' | 'okta' | 'google' | 'microsoft' | 'servicenow' | 'salesforce' | 'linear' | 'asana' | string;

interface BrandConfig {
    color: string;
    bgColor: string;
    icon: React.ReactNode;
}

const BRANDING: Record<string, BrandConfig> = {
    jira: {
        color: '#0052CC',
        bgColor: '#E6EFFC',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#0052CC]">
                <path d="M11.53,16.48L11.53,0.5C5.46,0.98 0.51,6.01 0.5,12.18C0.5,18.63 5.73,23.86 12.18,23.86L12.18,23.5L12.18,23.5C12.18,23.5 12.18,23.5 12.18,23.5C12.18,19.63 11.53,16.48 11.53,16.48Z" fillOpacity="0.8"/>
                <path d="M12.18,23.86C18.63,23.86 23.86,18.63 23.86,12.18C23.86,12.18 23.86,12.17 23.86,12.17L12.18,12.17L12.18,23.86Z" fillOpacity="0.6"/>
                <path d="M12.18,0.5L12.18,11.53L23.15,11.53C21.84,5.32 16.4,0.51 9.87,0.5L12.18,0.5Z" />
            </svg>
        )
    },
    slack: {
        color: '#4A154B',
        bgColor: '#F4EDE8',
        icon: <Slack className="w-full h-full text-[#4A154B]" />
    },
    aws: {
        color: '#FF9900',
        bgColor: '#FFF5E5',
        icon: <Cloud className="w-full h-full text-[#FF9900]" />
    },
    github: {
        color: '#181717',
        bgColor: '#E6E6E6',
        icon: <Github className="w-full h-full text-[#181717]" />
    },
    google: {
        color: '#4285F4',
        bgColor: '#E8F0FE',
        icon: <Globe className="w-full h-full text-[#4285F4]" />
    },
    azure: {
        color: '#0078D4',
        bgColor: '#E5F3FB',
        icon: <HardDrive className="w-full h-full text-[#0078D4]" />
    },
    okta: {
        color: '#007DC1',
        bgColor: '#E5F2F9',
        icon: <Shield className="w-full h-full text-[#007DC1]" />
    },
    linear: {
        color: '#5E6AD2',
        bgColor: '#EFEEF9',
        icon: <Layout className="w-full h-full text-[#5E6AD2]" />
    },
    salesforce: {
        color: '#00A1E0',
        bgColor: '#E5F6FC',
        icon: <Cloud className="w-full h-full text-[#00A1E0]" />
    },
    servicenow: {
        color: '#81B5A1',
        bgColor: '#F2F8F6',
        icon: <Server className="w-full h-full text-[#81B5A1]" />
    }
};

const DEFAULT_BRAND: BrandConfig = {
    color: '#64748B',
    bgColor: '#F1F5F9',
    icon: <Globe className="w-full h-full text-slate-500" />
};

export const getBrandConfig = (providerId: string): BrandConfig => {
    const key = providerId.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (BRANDING[key]) return BRANDING[key];
    
    // Heuristics for unknown brands
    if (key.includes('cloud')) return { color: '#0EA5E9', bgColor: '#E0F2FE', icon: <Cloud className="w-full h-full text-sky-500" /> };
    if (key.includes('security')) return { color: '#EF4444', bgColor: '#FEE2E2', icon: <Lock className="w-full h-full text-red-500" /> };
    if (key.includes('mail')) return { color: '#F59E0B', bgColor: '#FEF3C7', icon: <Mail className="w-full h-full text-amber-500" /> };
    
    return DEFAULT_BRAND;
};

interface IntegrationIconProps {
    provider: string;
    className?: string;
}

export function IntegrationIcon({ provider, className = "w-10 h-10" }: IntegrationIconProps) {
    const config = getBrandConfig(provider);
    
    return (
        <div className={`flex items-center justify-center rounded-lg ${className}`} style={{ backgroundColor: config.bgColor }}>
            <div className="w-2/3 h-2/3">
                {config.icon}
            </div>
        </div>
    );
}

export function getIntegrationColor(provider: string): string {
    return getBrandConfig(provider).color;
}

