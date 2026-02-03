import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Badge } from "@complianceos/ui/ui/badge";
import { Loader2, Search, ArrowLeft, Plus, ExternalLink, Globe, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function GlobalVendorCatalog() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [searchTerm, setSearchTerm] = useState("");
    const [, setLocation] = useLocation();

    const PAGE_SIZE = 12;
    const [page, setPage] = useState(0);

    const { data: globalVendors, isLoading, isPreviousData } = trpc.globalVendors.list.useQuery({
        search: searchTerm,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE
    }, {
        keepPreviousData: true
    });

    // Reset page when search changes
    React.useEffect(() => {
        setPage(0);
    }, [searchTerm]);

    const importMutation = trpc.globalVendors.import.useMutation({
        onSuccess: (vendor) => {
            toast.success(`Successfully imported ${vendor.name}`);
            setLocation(`/clients/${clientId}/vendors/${vendor.id}`);
        },
        onError: (err) => {
            toast.error(`Failed to import: ${err.message}`);
        }
    });

    const handleImport = (vendorId: number) => {
        importMutation.mutate({
            clientId,
            globalVendorId: vendorId
        });
    };

    return (
        <div className="p-6 space-y-6 page-transition">
            <Breadcrumb items={[
                { label: "Vendors", href: `/clients/${clientId}/vendors/all` },
                { label: "Global Catalog", active: true }
            ]} />

            <div className="flex justify-between items-end animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Global Vendor Catalog</h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl">
                        Discover and add vendors from our community-driven database of over 500 trust centers.
                        Pre-verified vendors include direct links to security portals and trust scores.
                    </p>
                </div>
                <Link href={`/clients/${clientId}/vendors/all`}>
                    <Button variant="ghost" className="text-slate-500 hover:text-slate-900">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
                    </Button>
                </Link>
            </div>

            <div className="relative max-w-md animate-slide-up">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search 500+ vendors by name or domain..."
                    className="pl-10 h-11 bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} className="animate-pulse bg-slate-50 h-48 border-none" />
                    ))}
                </div>
            ) : (
                <div className="space-y-8 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {globalVendors?.map((vendor) => (
                            <Card key={vendor.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200 overflow-hidden bg-white/50 backdrop-blur-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-indigo-200 transition-colors">
                                            {vendor.faviconUrl ? (
                                                <img src={vendor.faviconUrl} alt={vendor.name} className="w-8 h-8 object-contain" />
                                            ) : (
                                                <Globe className="w-6 h-6 text-slate-400" />
                                            )}
                                        </div>
                                        {vendor.platform && (
                                            <Badge variant="outline" className="bg-indigo-50/50 text-indigo-700 border-indigo-100 font-medium">
                                                {vendor.platform}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">{vendor.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1.5 mt-1 font-medium text-slate-500">
                                            <Globe className="w-3.5 h-3.5" />
                                            {(() => {
                                                try {
                                                    const url = vendor.website?.startsWith('http') ? vendor.website : `https://${vendor.website}`;
                                                    return new URL(url).hostname;
                                                } catch (e) {
                                                    return vendor.website || 'No website';
                                                }
                                            })()}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {vendor.trustCenterUrl && (
                                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50">
                                                <ShieldCheck className="w-4 h-4" />
                                                <span className="text-xs font-semibold">Verified Trust Center</span>
                                                <a
                                                    href={vendor.trustCenterUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="ml-auto hover:scale-110 transition-transform"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        )}

                                        <Button
                                            className="w-full bg-slate-900 hover:bg-indigo-600 text-white shadow-lg shadow-slate-200 group-hover:shadow-indigo-100 transition-all rounded-xl py-6"
                                            onClick={() => handleImport(vendor.id)}
                                            disabled={importMutation.isPending}
                                        >
                                            {importMutation.isPending && importMutation.variables?.globalVendorId === vendor.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <Plus className="w-4 h-4 mr-2" />
                                            )}
                                            Add to Organization
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {globalVendors?.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">No vendors found</h3>
                            <p className="text-slate-500 mt-1 max-w-xs mx-auto">Try searching for a different name or browse our community database later.</p>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {globalVendors && globalVendors.length > 0 && (
                        <div className="flex justify-center gap-4 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0 || isLoading}
                            >
                                Previous
                            </Button>
                            <span className="flex items-center text-sm font-medium text-slate-500">
                                Page {page + 1}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => p + 1)}
                                disabled={globalVendors.length < PAGE_SIZE || isLoading || isPreviousData}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-8 text-slate-400 text-sm font-medium">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Powered by TrustLists Open Source Database</span>
            </div>
        </div>
    );
}
