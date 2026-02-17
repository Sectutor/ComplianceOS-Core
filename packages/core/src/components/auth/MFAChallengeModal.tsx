import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Button } from "@complianceos/ui/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2, LogOut, ShieldCheck, ChevronRight, Smartphone } from "lucide-react";

type Factor = {
  id: string;
  factor_type: 'totp' | 'phone';
  friendly_name?: string;
  status: 'verified' | 'unverified';
};

export default function MFAChallengeModal({ open, onOpenChange, factorId: initialFactorId }: { open: boolean, onOpenChange: (v: boolean) => void, factorId?: string }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [selectedFactorId, setSelectedFactorId] = useState<string | undefined>(initialFactorId);
  const [showFactorList, setShowFactorList] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollFactorId, setEnrollFactorId] = useState<string | undefined>(undefined);
  const [enrollQrSvg, setEnrollQrSvg] = useState<string | undefined>(undefined);
  const [enrollCode, setEnrollCode] = useState("");

  useEffect(() => {
    const fetchFactors = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) {
          console.error("[MFA Challenge] Error listing factors:", error);
          return;
        }

        if (data) {
          const factorList = (data as any).factors || (data as any).all || [];
          const verifiedFactors = factorList.filter((f: any) => f && f.status === 'verified') as Factor[];
          setFactors(verifiedFactors);

          // If current selected is still missing, pick first verified one
          if (!selectedFactorId || !verifiedFactors.find(f => f.id === selectedFactorId)) {
            const match = initialFactorId ? verifiedFactors.find(f => f.id === initialFactorId) : null;
            const targetId = match?.id || verifiedFactors[0]?.id;
            if (targetId) setSelectedFactorId(targetId);
          }
        }
      } catch (err: any) {
        console.error("[MFA Challenge] Critical error:", err);
      }
    };
    if (open) fetchFactors();
  }, [open, initialFactorId]);

  const handleVerify = async () => {
    // Sanitize code: remove spaces, dashes, etc.
    const cleanCode = code.replace(/[^0-9]/g, '');
    if (cleanCode.length !== 6) {
      toast.error("Please enter a 6-digit verification code.");
      return;
    }

    if (!selectedFactorId) {
      toast.error("No authenticator found. Enroll below to continue.");
      return;
    }

    setLoading(true);
    try {
      console.log("[MFA Verify Debug] Attempting verify with factor:", selectedFactorId);

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        console.error("[MFA Verify Debug] No active session found. User might have been signed out.");
      } else {
        // Basic JWT check for sub claim
        const parts = currentSession.access_token.split('.');
        if (parts.length === 3) {
          try {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            console.log("[MFA Verify Debug] Token Payload:", { sub: payload.sub, aal: payload.aal, aud: payload.aud });
            if (!payload.sub) console.warn("[MFA Verify Debug] CRITICAL: sub claim is MISSING in access_token!");
          } catch (e) {
            console.error("[MFA Verify Debug] Failed to decode JWT payload safely.");
          }
        }
      }

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: selectedFactorId,
        code: cleanCode
      });

      if (error) {
        console.error("[MFA Verify Error]", error);
        toast.error(`Verification failed: ${error.message}`);
        return;
      }

      await supabase.auth.refreshSession();
      toast.success("MFA verified correctly. Welcome back!");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onOpenChange(false);
    window.location.href = '/auth/login';
  };

  const startEnrollInline = async () => {
    setLoading(true);
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Authenticator-${Math.random().toString(36).slice(2, 6)}`
      });
      if (error) {
        toast.error(error.message);
        setEnrolling(false);
        return;
      }
      setEnrollFactorId(data.id);
      setEnrollQrSvg((data as any).totp?.qr_code);
    } catch (e: any) {
      toast.error(e.message || "Failed to start enrollment");
      setEnrolling(false);
    } finally {
      setLoading(false);
    }
  };

  const confirmEnrollInline = async () => {
    if (!enrollFactorId) return;
    const clean = enrollCode.replace(/[^0-9]/g, '');
    if (clean.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollFactorId,
        code: clean
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      await supabase.auth.refreshSession();
      toast.success("MFA enabled");
      setEnrolling(false);
      setEnrollCode("");
      setEnrollFactorId(undefined);
      setEnrollQrSvg(undefined);
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = (data as any)?.factors?.filter((f: any) => f.status === 'verified') || [];
      setFactors(verified);
      setSelectedFactorId(verified[0]?.id);
      setShowFactorList(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to verify");
    } finally {
      setLoading(false);
    }
  };

  const currentFactor = factors.find(f => f.id === selectedFactorId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white relative">
          <div className="absolute top-4 right-4 opacity-10">
            <ShieldCheck className="w-24 h-24" />
          </div>
          <DialogHeader className="relative z-10 pt-4">
            <div className="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              {showFactorList ? "Select Factor" : "Security Verification"}
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-base">
              {showFactorList
                ? "Choose an authenticator to use for verification."
                : `Enter the code from ${currentFactor?.friendly_name || "your authenticator app"} to authorize access.`
              }
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6 bg-white dark:bg-slate-950">
          {!showFactorList ? (
            <div className="space-y-4">
              {factors.length > 0 ? (
                <Input
                  placeholder="000 000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center text-3xl h-16 tracking-[0.5em] font-mono border-2 focus-visible:ring-blue-500"
                  maxLength={7}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
              ) : (
                <div className="space-y-3">
                  {!enrolling ? (
                    <>
                      <div className="text-sm text-slate-600">
                        You don’t have an authenticator yet. Enroll TOTP to continue.
                      </div>
                      <Button className="w-full h-12" onClick={startEnrollInline} disabled={loading}>
                        {loading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Starting…</>) : "Enroll Authenticator"}
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={() => { window.location.href = '/settings/security?mfa=enroll'; }}>
                        Open Security Settings
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      {enrollQrSvg ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 rounded-xl border bg-white" dangerouslySetInnerHTML={{ __html: enrollQrSvg }} />
                          <Input
                            placeholder="Enter code from app"
                            value={enrollCode}
                            onChange={(e) => setEnrollCode(e.target.value)}
                            className="text-center text-xl h-12 font-mono"
                            maxLength={7}
                          />
                          <Button className="w-full h-12" onClick={confirmEnrollInline} disabled={loading}>
                            {loading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Verifying…</>) : "Verify & Enable"}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-6 text-slate-500">
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing enrollment…
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {factors.length > 1 && (
                <button
                  onClick={() => setShowFactorList(true)}
                  className="w-full text-xs text-blue-600 hover:underline flex items-center justify-center gap-1"
                >
                  Switch to another authenticator <ChevronRight className="w-3 h-3" />
                </button>
              )}

              <div className="flex flex-col gap-3 pt-2">
                {factors.length > 0 && (
                  <Button
                    onClick={handleVerify}
                    disabled={code.replace(/[^0-9]/g, '').length < 6 || loading}
                    className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : "Authorize Session"}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full text-slate-500 hover:text-red-600 hover:bg-red-50 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out and try later
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {factors.map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedFactorId(f.id);
                    setShowFactorList(false);
                    setCode("");
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedFactorId === f.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-300'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedFactorId === f.id ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      < Smartphone className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{f.friendly_name || "Authenticator App"}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{f.factor_type}</div>
                    </div>
                  </div>
                  {selectedFactorId === f.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </button>
              ))}
              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => setShowFactorList(false)}
              >
                Back to verification
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
