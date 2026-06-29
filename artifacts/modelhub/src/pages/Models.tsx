import React from 'react';
import { useListModels } from '@workspace/api-client-react';
import { Cuboid, Eye, Zap, Music, Image as ImageIcon, Box, Code, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function Models() {
  const { data: models, isLoading } = useListModels();
  const [search, setSearch] = React.useState('');

  const filtered = models?.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.modelId.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Models</h1>
          <p className="text-muted-foreground text-sm mt-1">Available capabilities across your connected providers.</p>
        </div>
        <div className="w-full md:w-72">
          <Input placeholder="Search models..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-muted-foreground">Loading...</div>
        ) : filtered?.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-dashed border-border rounded-xl text-muted-foreground">
            No models found. Connect providers to discover models.
          </div>
        ) : (
          filtered?.map(model => (
            <div key={model.id} className="border border-border bg-card rounded-xl p-5 hover:border-primary/50 transition-colors flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-secondary rounded-md mt-1 shrink-0">
                  <Cuboid size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{model.name}</h3>
                  <div className="text-xs text-muted-foreground font-mono truncate mt-0.5">{model.modelId}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-auto">
                {model.contextLength && (
                  <Badge variant="outline" className="text-[10px] gap-1"><Hash size={10} /> {(model.contextLength / 1000).toFixed(0)}k</Badge>
                )}
                {model.supportsVision && <Badge variant="outline" className="text-[10px] gap-1 border-blue-500/40 text-blue-400"><Eye size={10} /> Vision</Badge>}
                {model.supportsReasoning && <Badge variant="outline" className="text-[10px] gap-1 border-green-500/40 text-green-400"><Zap size={10} /> Reasoning</Badge>}
                {model.supportsFunctionCalling && <Badge variant="outline" className="text-[10px] gap-1 border-yellow-500/40 text-yellow-400"><Code size={10} /> Tools</Badge>}
                {model.supportsImageGeneration && <Badge variant="outline" className="text-[10px] gap-1"><ImageIcon size={10} /> Image</Badge>}
                {model.supportsAudio && <Badge variant="outline" className="text-[10px] gap-1"><Music size={10} /> Audio</Badge>}
                {model.supportsEmbeddings && <Badge variant="outline" className="text-[10px] gap-1"><Box size={10} /> Embed</Badge>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
