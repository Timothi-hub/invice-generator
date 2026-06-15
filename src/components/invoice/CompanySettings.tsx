import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CompanyProfile } from '@/types/invoice';
import { Settings, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface CompanySettingsProps {
  profile: CompanyProfile;
  onSave: (profile: Partial<CompanyProfile>) => Promise<{ error: Error | null }>;
}

const CompanySettings: React.FC<CompanySettingsProps> = ({ profile, onSave }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CompanyProfile>(profile);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Please upload PNG or JPEG image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateField('logoUrl', reader.result as string);
      toast.success('Logo loaded. Click Save to apply.');
    };
    reader.readAsDataURL(file);
  };

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
            <Label>Company Logo</Label>
            {form.logoUrl && (
              <div className="flex items-center gap-3 p-2 border rounded-md bg-muted/30">
                <img src={form.logoUrl} alt="Logo preview" className="h-12 w-12 object-contain bg-white rounded" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => updateField('logoUrl', '')}
                >
                  <X className="w-4 h-4 mr-1" /> Remove
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {form.logoUrl ? 'Change Logo' : 'Upload Logo (PNG/JPEG)'}
            </Button>
            <p className="text-xs text-muted-foreground">
              PNG or JPEG, max 2MB
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
