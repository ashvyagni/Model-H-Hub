import React, { useEffect } from 'react';
import { useGetSettings, useUpdateSettings, useListProviders, useListModels, getGetSettingsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const { data: providers } = useListProviders();
  const { data: models } = useListModels();
  
  const updateSettings = useUpdateSettings();

  const [form, setForm] = React.useState({
    defaultProviderId: '',
    defaultModel: '',
    streamingEnabled: true,
    autoSave: true,
    retryCount: 3
  });

  useEffect(() => {
    if (settings) {
      setForm({
        defaultProviderId: settings.defaultProviderId?.toString() || '',
        defaultModel: settings.defaultModel || '',
        streamingEnabled: settings.streamingEnabled,
        autoSave: settings.autoSave,
        retryCount: settings.retryCount
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        data: {
          defaultProviderId: form.defaultProviderId ? Number(form.defaultProviderId) : undefined,
          defaultModel: form.defaultModel || undefined,
          streamingEnabled: form.streamingEnabled,
          autoSave: form.autoSave,
          retryCount: form.retryCount
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      toast.success('Settings saved successfully');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure default behaviors and preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="border border-border bg-card rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold">Defaults</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Default Provider</Label>
              <select 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                value={form.defaultProviderId}
                onChange={e => setForm({...form, defaultProviderId: e.target.value})}
              >
                <option value="">None</option>
                {providers?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Default Model</Label>
              <select 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                value={form.defaultModel}
                onChange={e => setForm({...form, defaultModel: e.target.value})}
              >
                <option value="">None</option>
                {models?.filter(m => !form.defaultProviderId || m.providerId.toString() === form.defaultProviderId).map(m => (
                  <option key={m.id} value={m.modelId}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="border border-border bg-card rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold">Playground & API</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="accent-primary w-4 h-4" checked={form.streamingEnabled} onChange={e => setForm({...form, streamingEnabled: e.target.checked})} />
              <div>
                <div className="text-sm font-medium">Enable Streaming</div>
                <div className="text-xs text-muted-foreground">Stream responses word by word in playground</div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="accent-primary w-4 h-4" checked={form.autoSave} onChange={e => setForm({...form, autoSave: e.target.checked})} />
              <div>
                <div className="text-sm font-medium">Auto-save History</div>
                <div className="text-xs text-muted-foreground">Automatically log all playground requests to history</div>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-border">
            <Label>Retry Count (API calls)</Label>
            <div className="mt-2 flex items-center gap-4">
              <input type="range" min="0" max="5" value={form.retryCount} onChange={e => setForm({...form, retryCount: parseInt(e.target.value)})} className="flex-1 accent-primary" />
              <span className="text-sm font-mono bg-secondary px-2 py-1 rounded w-8 text-center">{form.retryCount}</span>
            </div>
          </div>
        </div>

        <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-500 font-semibold">
            <AlertTriangle size={18} /> Danger Zone
          </div>
          <p className="text-sm text-muted-foreground">These actions are irreversible.</p>
          <div className="flex gap-4">
            <Button variant="destructive">Clear All History</Button>
            <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-white">Reset Settings</Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2" disabled={updateSettings.isPending}>
            <Save size={16} /> Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
