import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CompanyProfile } from '@/types/invoice';
import { Settings, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface CompanySettingsProps {
  profile: CompanyProfile;
  onSave: (profile: Partial<CompanyProfile>) => Promise<{ error: Error | null }>;
}

const CompanySettings: React.FC<CompanySettingsProps> = ({ profile, onSave }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CompanyProfile>(profile);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await onSave(form);
    setSaving(false);

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved!');
      setOpen(false);
    }
  };

  const updateField = <K extends keyof CompanyProfile>(field: K, value: CompanyProfile[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Company Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
              placeholder="Your Company Name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={form.logoUrl || ''}
              onChange={(e) => updateField('logoUrl', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL to your company logo
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="directorName">Director/Owner Name</Label>
            <Input
              id="directorName"
              value={form.directorName}
              onChange={(e) => updateField('directorName', e.target.value)}
              placeholder="Your Name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Your business address"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="www.yourcompany.com"
            />
          </div>

          <Button onClick={handleSave} className="w-full btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanySettings;
