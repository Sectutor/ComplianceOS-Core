import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding, BrandLogo } from "@/config/branding";
import { Button } from "@complianceos/ui/ui/button";
import { Avatar, AvatarFallback } from "@complianceos/ui/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";
import { LogOut, User, ShieldCheck } from "lucide-react";
import { getLoginUrl } from "@/const";

interface AuditorLayoutProps {
    children: ReactNode;
}

export default function AuditorLayout({ children }: AuditorLayoutProps) {
    const { user, signOut } = useAuth();
    const { appName } = useBranding();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Simplified Auditor Header */}
            <header className="h-16 bg-[#001B2B] text-white flex items-center justify-between px-6 shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg">
                        <BrandLogo className="text-white" showText={false} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">{appName}</h1>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Auditor Portal</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:block text-right">
                        <div className="text-sm font-medium text-slate-200">{user?.user_metadata?.full_name || user?.email}</div>
                        <div className="text-xs text-slate-500">External Auditor</div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-white/10 hover:bg-white/10 ring-offset-[#001B2B]">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-indigo-600 text-white font-bold">
                                        {user?.email?.substring(0, 2).toUpperCase() || "AU"}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuItem onClick={() => signOut()} className="text-red-600 cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {children}
            </main>

            {/* Simple Footer */}
            <footer className="py-4 text-center text-xs text-slate-400 border-t bg-white">
                <p>SECURE AUDIT PREVIEW ENVIRONMENT • CONFIDENTIAL</p>
            </footer>
        </div>
    );
}
