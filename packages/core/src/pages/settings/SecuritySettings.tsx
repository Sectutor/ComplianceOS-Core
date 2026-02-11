import { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@complianceos/ui/ui/dialog";
import { Badge } from "@complianceos/ui/ui/badge";
import { Loader2, RotateCw, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import MFAChallengeModal from "@/components/auth/MFAChallengeModal";

type Factor = {
  id: string;
  factor_type: "totp" | "phone";
  friendly_name?: string | null;
  status?: string | null;
};

export default function SecuritySettings() {
  const { selectedClientId } = useClientContext();
  const [loading, setLoading] = useState(false);
  const [factors, setFactors] = useState<Factor[]>([]);
  const autoEnrollStarted = useRef(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [requireMfa, setRequireMfa] = useState<boolean>(false);
  const [enrollPolicyError, setEnrollPolicyError] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyFactorId, setVerifyFactorId] = useState<string | undefined>(undefined);
  const [currentAal, setCurrentAal] = useState<'aal1' | 'aal2' | null>(null);
  const clientQuery = (trpc.clients as any).get?.useQuery({ id: selectedClientId }, { enabled: !!selectedClientId });
  const updateClient = (trpc.clients as any).update?.useMutation({
    onSuccess: () => {
      toast.success("Client security settings updated");
    }
  });
  const sendEvent = (trpc.notifications as any).sendEvent?.useMutation();

  const fetchFactors = async (retryCount = 0) => {
    setLoading(true);
    try {
      // Use getUser() for a fresh server-side check of the auth state
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      console.log("[MFA] fetchFactors - User:", user ? "Auth OK" : "Missing", "ID:", user?.id);

      if (userErr || !user) {
        setFactors([]);
        return;
      }

      const { data: listData, error: listErr } = await supabase.auth.mfa.listFactors();
      console.log("[MFA] listFactors Response:", listData);

      // Refresh session to get latest AAL info
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setCurrentAal((aalData?.currentLevel as any) || null);

      if (listErr) {
        console.error("[MFA] Error listing factors:", listErr.message);
        setFactors([]);
      } else {
        const apiFactors = (listData as any)?.factors || (listData as any)?.all || [];
        const userFactors = (user as any)?.factors || [];
        const combined = [...apiFactors, ...userFactors];
        const seen = new Set<string>();
        const unique = combined.filter((f: any) => {
          if (!f?.id) return false;
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return true;
        });
        setFactors(unique);

        // If list is empty and we just enrolled/verified, retry twice with increasing delays
        if (unique.length === 0 && retryCount < 2) {
          console.log(`[MFA] No factors found yet, retrying... (${retryCount + 1}/2)`);
          setTimeout(() => fetchFactors(retryCount + 1), 1500 * (retryCount + 1));
        }
      }
    } catch (e: any) {
      console.error("[MFA] Critical failure in fetchFactors:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactors();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldEnroll = params.get('mfa') === 'enroll';

    // Only auto-start if valid, no factors exist, not already loading, and we haven't tried yet this mount
    if (shouldEnroll && factors.length === 0 && !loading && !autoEnrollStarted.current) {
      autoEnrollStarted.current = true;

      // Clean up the URL so it doesn't trigger again on back-navigation or refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      startEnrollTotp();
    }
  }, [factors.length, loading]);

  useEffect(() => {
    setRequireMfa(!!clientQuery?.data?.requireMfa);
  }, [clientQuery?.data?.requireMfa]);

  useEffect(() => {
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      const level = (data?.currentLevel as any) || null;
      setCurrentAal(level);
      if (level === 'aal2') setEnrollPolicyError(null);
    });
  }, [factors.length, showVerifyModal]);

  const startEnrollTotp = async () => {
    setLoading(true);
    try {
      // 1. Clean up stale UNVERIFIED factors to prevent clutter and 422 conflicts
      const { data: listData, error: listError } = await supabase.auth.mfa.listFactors();
      const { data: { user } } = await supabase.auth.getUser();

      if (!listError || user) {
        // combine factors from both sources to ensure we catch unverified ones
        const allFactors = [
          ...((listData as any)?.factors || []),
          ...((user as any)?.factors || [])
        ];

        // Use a Set to unique-ify by ID
        const seen = new Set();
        const uniqueFactors = allFactors.filter(f => {
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return true;
        });

        console.log("[MFA Debug] Checking factors for cleanup:", uniqueFactors);

        for (const f of uniqueFactors) {
          if (f.status === 'unverified') {
            console.log("[MFA Debug] Removing stale unverified factor:", f.id);
            try {
              await supabase.auth.mfa.unenroll({ factorId: f.id });
            } catch (err) {
              console.warn("[MFA Debug] Failed to unenroll stale factor:", f.id);
            }
          }
        }
      }

      const { data: aalInfo } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalInfo?.currentLevel !== 'aal2') {
        setEnrollPolicyError('Your authentication provider requires AAL2 to enroll new factors. Verify an existing authenticator to continue.');
        const { data: lf } = await supabase.auth.mfa.listFactors();
        const totp = lf?.factors?.find((f: any) => f.factor_type === 'totp' && f.status === 'verified') || lf?.factors?.find((f: any) => f.factor_type === 'totp');
        setVerifyFactorId(totp?.id || undefined);
        setShowVerifyModal(!!totp?.id);
        setCurrentAal((aalInfo?.currentLevel as any) || null);
        return;
      }
      setCurrentAal('aal2');

      // 2. Start enrollment with a UNIQUE name
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const uniqueName = `App-${timestamp}-${randomSuffix}`;

      console.log("[MFA Debug] Starting enrollment with name:", uniqueName);
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: uniqueName
      });

      if (error) {
        console.error("[MFA Debug] Enroll Error:", error);
        toast.error(`Enrollment failed: ${error.message}`);
        if (typeof error?.message === 'string' && error.message.toLowerCase().includes('aal2 required')) {
          setEnrollPolicyError('Your authentication provider requires AAL2 to enroll new factors. Disable this policy temporarily to enroll the first authenticator, then re-enable.');
        }
        return;
      }

      console.log("[MFA Debug] New Factor created:", data.id);
      setFactorId(data.id);
      setQrSvg(data.totp.qr_code);
      setShowEnroll(true);
      setEnrollPolicyError(null);
    } catch (e: any) {
      toast.error(e.message || "An unexpected error occurred during enrollment.");
    } finally {
      setLoading(false);
    }
  };

  const confirmEnroll = async () => {
    if (!factorId || !verifyCode) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode
      });

      if (error) {
        console.error("[MFA Debug] Verify Error:", error);
        toast.error(`Verification failed: ${error.message} (Error code: ${error.status || 'unknown'})`);
        if (error.message.includes("422") || error.status === 422) {
          console.warn("[MFA Debug] 422 usually means the code is invalid, already used, or project MFA settings are off.");
        }
        return;
      }

      console.log("[MFA Debug] Verification Success!");

      toast.success("MFA successfully enabled! Your account is now more secure.");

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email && sendEvent?.mutateAsync) {
          await sendEvent.mutateAsync({
            event: "SECURITY_MFA_CHANGED",
            to: user.email,
            data: { action: "enabled", timestamp: new Date().toISOString() },
            clientId: selectedClientId
          }).catch((e: any) => console.warn("[MFA] Notification event failed:", e.message));
        }
      } catch (notifErr) {
        // Ignore notification errors to not block the UI
      }

      setShowEnroll(false);
      setVerifyCode("");
      await supabase.auth.refreshSession();
      await fetchFactors();
    } catch (err: any) {
      console.error("[MFA] Enrollment confirmation failed:", err.message);
      toast.error("Failed to complete enrollment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    toast.promise(fetchFactors(), {
      loading: 'Updating security status...',
      success: 'Status updated',
      error: 'Failed to refresh'
    });
  };

  const unenroll = async (id: string) => {
    if (!confirm("Are you sure you want to disable MFA? This will reduce your account security.")) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (error) {
        toast.error(`Failed to disable MFA: ${error.message}`);
        return;
      }

      toast.success("MFA factor removed successfully.");

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email && sendEvent?.mutateAsync) {
          await sendEvent.mutateAsync({
            event: "SECURITY_MFA_CHANGED",
            to: user.email,
            data: { action: "disabled", timestamp: new Date().toISOString() },
            clientId: selectedClientId
          }).catch(() => { });
        }
      } catch (err) { }

      await fetchFactors();
    } catch (err: any) {
      toast.error("Failed to unenroll: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRequireMfa = (value: boolean) => {
    setRequireMfa(value);
    if (selectedClientId) {
      updateClient.mutate({ id: selectedClientId, requireMfa: value });
    }
  };

  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Settings', href: '/settings' }, { label: 'Security', active: true }]} />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security</h1>
          <p className="text-muted-foreground mt-2">
            Manage multi-factor authentication and enforcement for your workspace.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Multi-Factor Authentication</CardTitle>
              <CardDescription>Protect accounts with an extra verification step.</CardDescription>
            </div>
            <Button onClick={startEnrollTotp} className="gap-2" variant={factors.length > 0 ? "outline" : "default"} disabled={loading}>
              <ShieldCheck className={`h-4 w-4 ${factors.length > 0 ? "text-green-500" : ""}`} />
              {factors.length > 0 ? "Add Authenticator" : "Enable TOTP"}
            </Button>
          </CardHeader>
          <CardContent>
            {enrollPolicyError && (
              <div className="p-3 mb-4 rounded-md border bg-yellow-50 text-yellow-700 text-sm">
                {enrollPolicyError}
                {factors.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const totp = factors.find((f) => f.factor_type === "totp");
                        setVerifyFactorId(totp?.id || undefined);
                        setShowVerifyModal(true);
                      }}
                    >
                      Verify now
                    </Button>
                    <Button
                      onClick={async () => {
                        const { data: aalInfo } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                        if (aalInfo?.currentLevel !== 'aal2') {
                          const { data: lf } = await supabase.auth.mfa.listFactors();
                          const totp = lf?.factors?.find((f: any) => f.factor_type === 'totp' && f.status === 'verified') || lf?.factors?.find((f: any) => f.factor_type === 'totp');
                          setVerifyFactorId(totp?.id || undefined);
                          setShowVerifyModal(!!totp?.id);
                          return;
                        }
                        setEnrollPolicyError(null);
                        setCurrentAal('aal2');
                        await fetchFactors();
                        startEnrollTotp();
                      }}
                      variant="ghost"
                      disabled={loading}
                    >
                      Retry enroll
                    </Button>
                  </div>
                )}
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Enrolled Factors</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh} title="Refresh MFA Status">
                      <RotateCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {factors.length === 0 && (
                      <div className="text-sm text-gray-500">No factors enrolled.</div>
                    )}
                    {factors.map((f) => (
                      <div key={f.id} className="flex items-center justify-between p-5 border-2 rounded-2xl bg-[#002C43] border-slate-700/50 group hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/30 transition-all duration-300 cursor-default">
                        <div className="flex items-center gap-5">
                          <div className={`relative flex h-3 w-3`}>
                            {f.status === 'verified' && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            )}
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${f.status === 'verified' ? 'bg-blue-400' : 'bg-amber-400'}`}></span>
                          </div>

                          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 flex flex-col items-center justify-center min-w-[70px]">
                            <span className="text-[10px] font-black text-blue-300 tracking-tighter uppercase">{f.factor_type}</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase -mt-0.5">TYPE</span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-lg font-black text-white leading-none">
                              {f.friendly_name || "Authenticator App"}
                            </span>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${f.status === 'verified'
                                ? 'text-blue-100 bg-blue-600/40 border border-blue-500/50'
                                : 'text-amber-100 bg-amber-600/40 border border-amber-500/50'
                                }`}>
                                {f.status} status
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {f.status !== 'verified' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-opacity"
                              onClick={() => {
                                setFactorId(f.id);
                                setQrSvg(null);
                                setShowEnroll(true);
                              }}
                            >
                              Verify
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50 transition-opacity" onClick={() => unenroll(f.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Workspace Enforcement</div>
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-[#0a89c9] border-[#0a89c9]/20 shadow-sm">
                    <div>
                      <div className="font-semibold text-white">Require MFA for all users</div>
                      <div className="text-sm text-white/90">Users must verify MFA before accessing protected features.</div>
                    </div>
                    <Button
                      variant={requireMfa ? "secondary" : "outline"}
                      onClick={() => toggleRequireMfa(!requireMfa)}
                      className={requireMfa ? "bg-white text-[#0a89c9] hover:bg-white/90 border-transparent shadow-none" : "bg-transparent text-white border-white/40 hover:bg-white/10"}
                    >
                      {requireMfa ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEnroll} onOpenChange={setShowEnroll}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enable Authenticator App (TOTP)</DialogTitle>
            <DialogDescription>Scan the QR code and enter the code to confirm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {qrSvg && (
              <div className="w-64 h-64 mx-auto bg-white p-4 rounded-xl border flex items-center justify-center shadow-inner overflow-hidden">
                {qrSvg.startsWith('data:image') ? (
                  <img
                    alt="Authenticator QR"
                    src={qrSvg}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{
                      __html: qrSvg.includes('<svg') ? qrSvg : `<svg>${qrSvg}</svg>`
                    }}
                  />
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input id="code" placeholder="123456" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnroll(false)}>Cancel</Button>
            <Button onClick={confirmEnroll} disabled={!verifyCode}>Enable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <MFAChallengeModal
        open={showVerifyModal}
        onOpenChange={async (o) => {
          setShowVerifyModal(o);
          if (!o) {
            const { data: aalInfo } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            await fetchFactors();
            if (aalInfo?.currentLevel === 'aal2') {
              setEnrollPolicyError(null);
              setCurrentAal('aal2');
              startEnrollTotp();
            }
          }
        }}
        factorId={verifyFactorId}
      />
    </DashboardLayout>
  );
}
