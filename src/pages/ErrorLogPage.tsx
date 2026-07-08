import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getErrorLog,
  clearErrorLog,
  downloadErrorLog,
  type ErrorLogEntry,
} from '@/lib/errorLogger';
import { Download, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const typeColors: Record<ErrorLogEntry['type'], string> = {
  error: 'text-red-600',
  unhandledrejection: 'text-orange-600',
  'console.error': 'text-amber-600',
  manual: 'text-blue-600',
};

const ErrorLogPage = () => {
  const [entries, setEntries] = useState<ErrorLogEntry[]>([]);
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const refresh = () => setEntries([...getErrorLog()].reverse());

  useEffect(() => {
    refresh();
  }, []);

  if (adminLoading) return <AppLayout title="Error Log"><p className="text-muted-foreground">Loading…</p></AppLayout>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleClear = () => {
    clearErrorLog();
    refresh();
    toast.success('Error log cleared');
  };

  const handleDownload = () => {
    downloadErrorLog();
    toast.success('Log downloaded');
  };

  return (
    <AppLayout title="Error Log">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Recent Errors ({entries.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={entries.length === 0}>
              <Download className="w-4 h-4 mr-1" /> Download .txt
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClear} disabled={entries.length === 0}>
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No errors logged. Errors will appear here automatically as they occur.
            </p>
          ) : (
            <ScrollArea className="h-[70vh] pr-3">
              <div className="space-y-3">
                {entries.map((e, idx) => (
                  <div key={idx} className="border rounded-md p-3 bg-muted/30 text-sm font-mono">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</span>
                      <span className={`text-xs font-semibold ${typeColors[e.type]}`}>[{e.type}]</span>
                    </div>
                    <div className="break-words whitespace-pre-wrap">{e.message}</div>
                    {e.source && (
                      <div className="text-xs text-muted-foreground mt-1">source: {e.source}</div>
                    )}
                    {e.url && (
                      <div className="text-xs text-muted-foreground truncate">url: {e.url}</div>
                    )}
                    {e.stack && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-muted-foreground">Stack trace</summary>
                        <pre className="text-xs mt-1 whitespace-pre-wrap break-words text-muted-foreground">{e.stack}</pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default ErrorLogPage;