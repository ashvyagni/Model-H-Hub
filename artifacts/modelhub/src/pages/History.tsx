import React, { useState } from 'react';
import { useListHistory, useUpdateHistory, useDeleteHistory, getListHistoryQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Star, Trash2, Clock, Terminal, Activity, ArrowRight, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

export default function History() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showStarred, setShowStarred] = useState(false);
  const [, setLocation] = useLocation();

  const { data: history, isLoading } = useListHistory({
    search: search || undefined,
    starred: showStarred ? true : undefined,
    limit: 50
  });

  const updateHistory = useUpdateHistory();
  const deleteHistory = useDeleteHistory();

  const toggleStar = async (id: number, current: boolean) => {
    await updateHistory.mutateAsync({ id, data: { starred: !current } });
    queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() });
  };

  const handleDelete = async (id: number) => {
    if(confirm('Delete this record?')) {
      await deleteHistory.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() });
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Request History</h1>
          <p className="text-muted-foreground text-sm mt-1">Audit log of all API interactions.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search prompts or models..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9"
            />
          </div>
          <Button 
            variant={showStarred ? 'default' : 'outline'} 
            onClick={() => setShowStarred(!showStarred)}
            size="icon"
            className="shrink-0"
            title="Show Starred Only"
          >
            <Star size={16} className={showStarred ? "fill-current" : ""} />
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : history?.items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No history found.</div>
        ) : (
          <div className="divide-y divide-border">
            {history?.items.map(item => (
              <div key={item.id} className="p-4 hover:bg-secondary/20 transition-colors flex flex-col gap-3 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleStar(item.id, item.starred)} className="text-muted-foreground hover:text-yellow-500 transition-colors">
                      <Star size={16} className={item.starred ? "fill-yellow-500 text-yellow-500" : ""} />
                    </button>
                    <Badge variant="outline" className={`uppercase font-mono text-[10px] ${item.status === 'success' ? 'border-green-500/40 text-green-400' : 'border-red-500/40 text-red-400'}`}>
                      {item.status}
                    </Badge>
                    <span className="font-semibold text-sm">{item.model}</span>
                    <span className="text-muted-foreground text-xs">&bull; {item.providerName}</span>
                    <span className="text-muted-foreground text-xs flex items-center gap-1"><Clock size={12}/> {formatDistanceToNow(new Date(item.createdAt))} ago</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1"><Activity size={12}/> {item.latencyMs}ms</span>
                    <span>{item.totalTokens || 0} tkns</span>
                    {item.costEstimate && <span>${item.costEstimate.toFixed(5)}</span>}
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Replay in Playground" onClick={() => setLocation('/playground')}>
                        <Play size={12} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {(item.rawRequest || item.rawResponse) && (
                  <div className="pl-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.rawRequest && (
                      <div className="bg-background border border-border rounded-md p-3 max-h-32 overflow-y-auto text-xs font-mono text-muted-foreground">
                        <div className="flex items-center gap-2 mb-2 text-foreground font-sans font-medium"><Terminal size={12}/> Prompt</div>
                        {parseContent(item.rawRequest)}
                      </div>
                    )}
                    {item.rawResponse && (
                      <div className="bg-background border border-border rounded-md p-3 max-h-32 overflow-y-auto text-xs font-mono text-foreground">
                        <div className="flex items-center gap-2 mb-2 text-primary font-sans font-medium"><ArrowRight size={12}/> Response</div>
                        {parseContent(item.rawResponse)}
                      </div>
                    )}
                  </div>
                )}
                {item.errorMessage && (
                  <div className="pl-7 text-sm text-red-500 font-mono bg-red-500/10 p-3 rounded-md border border-red-500/20">
                    {item.errorMessage}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function parseContent(str: string) {
  try {
    const obj = JSON.parse(str);
    if (obj.messages) return obj.messages.map((m:any) => `[${m.role}] ${m.content}`).join('\n\n');
    if (obj.content) return obj.content;
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return str;
  }
}
