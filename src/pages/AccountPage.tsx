import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Sun, Moon, Lock, Mail } from 'lucide-react';

const AccountPage = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    setPassword('');
    setConfirm('');
    toast.success('Password updated');
  };

  const handleSendReset = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Password reset link sent to your email');
  };

  return (
    <AppLayout title="Account Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-1">Profile</h2>
          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4" /> {user?.email}
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-3">Appearance</h2>
          <p className="text-sm text-muted-foreground mb-4">Choose a theme for the entire app.</p>
          <div className="flex gap-3">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="flex-1"
            >
              <Sun className="w-4 h-4 mr-2" /> Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="flex-1"
            >
              <Moon className="w-4 h-4 mr-2" /> Dark
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-3">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-pw">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="new-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="confirm-pw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Forgot Password</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Send a password reset link to <strong>{user?.email}</strong>.
          </p>
          <Button variant="outline" onClick={handleSendReset} disabled={resetLoading}>
            {resetLoading ? 'Sending…' : 'Send Reset Link'}
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AccountPage;