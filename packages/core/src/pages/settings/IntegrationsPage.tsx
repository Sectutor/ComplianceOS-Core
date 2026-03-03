import { useState, useEffect } from "react";
import { useSearchParams } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { IntegrationMarketplace } from "@/components/integrations/IntegrationMarketplace";
import { IntegrationConnections } from "@/components/integrations/IntegrationConnections";
import { Breadcrumb } from "@/components/Breadcrumb";
import { motion, AnimatePresence } from "framer-motion";

export default function IntegrationsPage() {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<"marketplace" | "connections">("marketplace");
    
    // Check if redirected from OAuth with success
    useEffect(() => {
        if (searchParams.get("connected") === "true") {
            setActiveTab("connections");
        }
    }, [searchParams]);

    return (
        <div className="relative min-h-[calc(100vh-3.5rem)] -mx-4 -my-8 px-4 py-8 md:-mx-8 md:-mt-8 md:pl-11 md:pr-8 bg-slate-50/50 text-slate-900 overflow-hidden page-transition">
            {/* Ambient Light Mode Background Glows */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-purple-500/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
            </div>

            <div className="relative z-10 space-y-8">
                <Breadcrumb
                    items={[
                        { label: "Settings", href: "/settings" },
                        { label: "Integrations" },
                    ]}
                />

                <div className="flex flex-col gap-2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tight">Integrations</h1>
                        <p className="text-slate-600 font-medium mt-2 text-lg">
                            Connect to external services to sync data, automate workflows, and enhance your compliance program.
                        </p>
                    </motion.div>
                </div>

                {/* Styled Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        className={`px-8 py-4 text-sm font-extrabold uppercase tracking-widest transition-all relative ${activeTab === "marketplace"
                            ? "text-blue-600"
                            : "text-slate-500 hover:text-slate-900"
                            }`}
                        onClick={() => setActiveTab("marketplace")}
                    >
                        Marketplace
                        {activeTab === "marketplace" && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                            />
                        )}
                    </button>
                    <button
                        className={`px-8 py-4 text-sm font-extrabold uppercase tracking-widest transition-all relative ${activeTab === "connections"
                            ? "text-blue-600"
                            : "text-slate-500 hover:text-slate-900"
                            }`}
                        onClick={() => setActiveTab("connections")}
                    >
                        My Connections
                        {activeTab === "connections" && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                            />
                        )}
                    </button>
                </div>

                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === "marketplace" ? (
                        <IntegrationMarketplace onConnectionCreated={() => setActiveTab("connections")} />
                    ) : (
                        <IntegrationConnections />
                    )}
                </motion.div>
            </div>
        </div>
    );
}
