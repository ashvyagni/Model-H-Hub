import React, { useState, useRef, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { usePlaygroundChat, useListProviders, useListModels, getGetSettingsQueryKey, useGetSettings } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Settings2, Trash2, Code2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

export default function Playground() {
  const { data: settings } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const { data: providers } = useListProviders();
  const { data: models } = useListModels();
  
  const [providerId, setProviderId] = useState<number | ''>('');
  const [modelId, setModelId] = useState('');
  
  useEffect(() => {
    if (settings?.defaultProviderId && providerId === '') {
      setProviderId(settings.defaultProviderId);
    }
    if (settings?.defaultModel && modelId === '') {
      setModelId(settings.defaultModel);
    }
  }, [settings]);

  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [temperature, setTemperature] = useState(0.7);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([{ role: 'user', content: 'Hello!' }]);
  const [input, setInput] = useState('');
  const [responseMeta, setResponseMeta] = useState<any>(null);

  const chat = usePlaygroundChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !providerId || !modelId) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setResponseMeta(null);

    try {
      const res = await chat.mutateAsync({
        data: {
          providerId: Number(providerId),
          model: modelId,
          messages: newMessages,
          systemPrompt,
          temperature
        }
      });
      
      setMessages([...newMessages, { role: 'assistant', content: res.content }]);
      setResponseMeta({
        latency: res.latencyMs,
        tokens: res.usage?.totalTokens,
        cost: res.costEstimate
      });
    } catch (e: any) {
      toast.error('Chat failed: ' + e.message);
      setMessages([...newMessages, { role: 'assistant', content: 'Error: ' + e.message }]);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <select 
            className="bg-transparent border border-border rounded text-sm px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
            value={providerId}
            onChange={(e) => setProviderId(Number(e.target.value))}
          >
            <option value="" disabled>Select Provider</option>
            {providers?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select 
            className="bg-transparent border border-border rounded text-sm px-2 py-1 outline-none focus:ring-1 focus:ring-primary max-w-[200px]"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          >
            <option value="" disabled>Select Model</option>
            {models?.filter(m => !providerId || m.providerId === Number(providerId)).map(m => (
              <option key={m.id} value={m.modelId}>{m.name}</option>
            ))}
          </select>
        </div>
        {responseMeta && (
          <div className="flex gap-4 text-xs font-mono text-muted-foreground">
            <span>{responseMeta.latency}ms</span>
            <span>{responseMeta.tokens} tkns</span>
            {responseMeta.cost !== null && <span>${responseMeta.cost.toFixed(5)}</span>}
          </div>
        )}
      </header>

      <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={70} minSize={30} className="flex flex-col bg-background relative">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground border border-border'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chat.isPending && (
              <div className="flex justify-start">
                <div className="bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          
          <div className="p-4 border-t border-border bg-card shrink-0">
            <div className="relative">
              <textarea 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message... (Press Enter to send)"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm min-h-[80px] max-h-48 outline-none focus:ring-1 focus:ring-primary resize-none pr-14"
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim() || chat.isPending} className="absolute bottom-3 right-3 h-8 w-8 rounded-lg">
                <Send size={14} />
              </Button>
            </div>
          </div>
        </Panel>
        
        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize flex items-center justify-center relative">
          <div className="absolute inset-y-0 -left-2 -right-2 z-10" />
          <GripVertical size={12} className="text-muted-foreground" />
        </PanelResizeHandle>
        
        <Panel defaultSize={30} minSize={20} className="bg-card border-l border-border flex flex-col p-4 space-y-6 overflow-y-auto">
          <div className="flex items-center gap-2 font-semibold text-sm border-b border-border pb-2">
            <Settings2 size={16} /> Parameters
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">System Prompt</Label>
            </div>
            <textarea 
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm min-h-[120px] outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Temperature</Label>
                <span className="text-xs font-mono">{temperature}</span>
              </div>
              <input 
                type="range" 
                min="0" max="2" step="0.1" 
                value={temperature} 
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
          
          <div className="mt-auto pt-6">
            <Button variant="outline" className="w-full gap-2 text-muted-foreground" onClick={() => setMessages([])}>
              <Trash2 size={14} /> Clear Chat
            </Button>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
