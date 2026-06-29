import React, { useState } from 'react';
import { useListProviders, useCreateProvider, useDeleteProvider, useDetectProvider, useTestProvider, getListProvidersQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Server, Plus, Trash2, CheckCircle2, ShieldAlert, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function Providers() {
  const queryClient = useQueryClient();
  const { data: providers, isLoading } = useListProviders();
  const deleteProvider = useDeleteProvider();
  const testProvider = useTestProvider();
  
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to remove this provider?')) {
      await deleteProvider.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListProvidersQueryKey() });
      toast.success('Provider removed');
    }
  };

  const handleTest = async (id: number) => {
    const promise = testProvider.mutateAsync({ id });
    toast.promise(promise, {
      loading: 'Testing connection...',
      success: (data) => data.success ? `Connected! Latency: ${data.latencyMs}ms` : `Failed: ${data.message}`,
      error: 'Test failed',
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Providers</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage API keys and connections to model hosts.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus size={16} /> Add Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-muted-foreground">Loading...</div>
        ) : providers?.length === 0 ? (
          <div className="col-span-full p-12 border border-dashed border-border rounded-xl text-center space-y-4">
            <Server size={32} className="mx-auto text-muted-foreground opacity-50" />
            <div className="text-muted-foreground">No providers configured yet.</div>
            <Button onClick={() => setIsAdding(true)} variant="secondary">Add your first provider</Button>
          </div>
        ) : (
          providers?.map(provider => (
            <div key={provider.id} className="border border-border bg-card rounded-xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-md">
                    <Server size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{provider.name}</h3>
                    <div className="text-xs text-muted-foreground">{provider.providerType}</div>
                  </div>
                </div>
                <Badge variant={provider.enabled ? 'default' : 'outline'} className={provider.enabled ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}>{provider.enabled ? 'Enabled' : 'Disabled'}</Badge>
              </div>
              
              <div className="text-xs text-muted-foreground font-mono truncate bg-background p-2 rounded border border-border">
                {provider.baseUrl || 'Default Base URL'}
              </div>

              <div className="flex gap-2 mt-auto pt-2 border-t border-border">
                <Button variant="secondary" size="sm" className="flex-1 gap-2" onClick={() => handleTest(provider.id)}>
                  <Activity size={14} /> Test
                </Button>
                <Button variant="outline" size="icon" className="shrink-0 text-destructive hover:text-destructive" onClick={() => handleDelete(provider.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdding && <AddProviderDialog open={isAdding} onOpenChange={setIsAdding} />}
    </div>
  );
}

function AddProviderDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const createProvider = useCreateProvider();
  const detectProvider = useDetectProvider();
  
  const [apiKey, setApiKey] = useState('');
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [detected, setDetected] = useState<any>(null);

  const handleKeyBlur = async () => {
    if (!apiKey) return;
    try {
      const result = await detectProvider.mutateAsync({ data: { apiKey, baseUrl } });
      if (result.detected) {
        setDetected(result);
        if (!name && result.name) setName(result.name);
        if (!baseUrl && result.suggestedBaseUrl) setBaseUrl(result.suggestedBaseUrl);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!name || (!apiKey && !baseUrl)) {
      toast.error('Name and API key or Base URL required');
      return;
    }
    await createProvider.mutateAsync({
      data: {
        name,
        apiKey,
        baseUrl: baseUrl || undefined,
        providerType: detected?.providerType || 'openai-compatible',
        enabled: true
      }
    });
    queryClient.invalidateQueries({ queryKey: getListProvidersQueryKey() });
    toast.success('Provider added');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-md bg-card rounded-xl border border-border shadow-2xl p-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add Provider</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input 
                type="password" 
                placeholder="sk-..." 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)} 
                onBlur={handleKeyBlur}
              />
            </div>
            
            {detected && (
              <div className="bg-secondary/50 border border-border rounded-md p-3 flex items-start gap-3">
                {detected.confidence > 80 ? <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={16} /> : <ShieldAlert className="text-yellow-500 shrink-0 mt-0.5" size={16} />}
                <div>
                  <div className="text-sm font-medium">Detected: {detected.name || detected.providerType}</div>
                  <div className="text-xs text-muted-foreground mt-1">Confidence: {detected.confidence}% &bull; {detected.reason}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Provider Name</Label>
              <Input placeholder="e.g. OpenAI Production" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Base URL (Optional)</Label>
              <Input placeholder="https://api.openai.com/v1" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createProvider.isPending}>Save Provider</Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
