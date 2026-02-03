import { useState, useEffect } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { trpc } from "@/lib/trpc";
import { User, Mail, Phone, MapPin, Briefcase, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ClientContactInfoProps {
  clientId: number;
  contactName?: string | null;
  contactTitle?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
}

export default function ClientContactInfo({
  clientId,
  contactName: initialName,
  contactTitle: initialTitle,
  contactEmail: initialEmail,
  contactPhone: initialPhone,
  address: initialAddress,
}: ClientContactInfoProps) {
  const [contactName, setContactName] = useState(initialName || "");
  const [contactTitle, setContactTitle] = useState(initialTitle || "");
  const [contactEmail, setContactEmail] = useState(initialEmail || "");
  const [contactPhone, setContactPhone] = useState(initialPhone || "");
  const [address, setAddress] = useState(initialAddress || "");
  const [hasChanges, setHasChanges] = useState(false);

  const utils = trpc.useUtils();

  // Track changes
  useEffect(() => {
    const changed =
      contactName !== (initialName || "") ||
      contactTitle !== (initialTitle || "") ||
      contactEmail !== (initialEmail || "") ||
      contactPhone !== (initialPhone || "") ||
      address !== (initialAddress || "");
    setHasChanges(changed);
  }, [contactName, contactTitle, contactEmail, contactPhone, address, initialName, initialTitle, initialEmail, initialPhone, initialAddress]);

  const updateContactMutation = trpc.clients.updateContactInfo.useMutation({
    onSuccess: () => {
      toast.success("Contact information saved");
      utils.clients.get.invalidate({ id: clientId });
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save contact information");
    },
  });

  const handleSave = () => {
    updateContactMutation.mutate({
      clientId,
      contactName: contactName || undefined,
      contactTitle: contactTitle || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      address: address || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contact Information</CardTitle>
        <CardDescription>
          Primary contact details that will appear in exported document headers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Contact Name */}
          <div className="space-y-2">
            <Label htmlFor="contactName" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Contact Name
            </Label>
            <Input
              id="contactName"
              placeholder="John Smith"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>

          {/* Contact Title */}
          <div className="space-y-2">
            <Label htmlFor="contactTitle" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Title / Role
            </Label>
            <Input
              id="contactTitle"
              placeholder="Chief Information Security Officer"
              value={contactTitle}
              onChange={(e) => setContactTitle(e.target.value)}
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email Address
            </Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="john.smith@company.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone Number
            </Label>
            <Input
              id="contactPhone"
              placeholder="+1 (555) 123-4567"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Business Address
          </Label>
          <Textarea
            id="address"
            placeholder="123 Business Street&#10;Suite 456&#10;City, State 12345&#10;Country"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateContactMutation.isPending}
          >
            {updateContactMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Contact Info
              </>
            )}
          </Button>
        </div>

        {/* Preview Note */}
        {(contactName || contactEmail || contactPhone || address) && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Preview in document header:</p>
            <div className="text-sm space-y-0.5">
              {contactName && (
                <p className="font-medium">
                  {contactName}
                  {contactTitle && <span className="font-normal text-muted-foreground"> - {contactTitle}</span>}
                </p>
              )}
              {contactEmail && <p className="text-muted-foreground">{contactEmail}</p>}
              {contactPhone && <p className="text-muted-foreground">{contactPhone}</p>}
              {address && <p className="text-muted-foreground whitespace-pre-line">{address}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
