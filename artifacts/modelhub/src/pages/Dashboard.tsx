import React from 'react';
import { useGetDashboardStats, getGetDashboardStatsQueryKey } from '@workspace/api-client-react';
import { Activity, Server, Cuboid, DollarSign, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() }});

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading dashboard...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">Real-time metrics for your AI infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Connected Providers" value={stats?.connectedProviders || 0} icon={Server} />
        <StatCard title="Available Models" value={stats?.availableModels || 0} icon={Cuboid} />
        <StatCard title="Requests Today" value={stats?.requestsToday || 0} icon={Activity} />
        <StatCard title="Cost Today" value={`$${(stats?.costToday || 0).toFixed(4)}`} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            {stats?.recentActivity?.length ? (
              <div className="divide-y divide-border">
                {stats.recentActivity.map((act: any) => (
                  <div key={act.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${act.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {act.status === 'success' ? <Activity size={16} /> : <Clock size={16} />}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{act.model}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{act.providerName} &bull; {formatDistanceToNow(new Date(act.createdAt))} ago</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium tabular-nums">{act.latencyMs}ms</div>
                      <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">{act.totalTokens} tokens</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">No recent activity</div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Provider Usage</h2>
          <div className="border border-border rounded-xl bg-card p-5 space-y-6">
            {stats?.requestsByProvider?.length ? (
              stats.requestsByProvider.map((p: any) => (
                <div key={p.providerName} className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{p.providerName}</span>
                    <span className="text-muted-foreground tabular-nums">{p.requestCount} reqs</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${Math.min(100, (p.requestCount / (stats.requestsToday || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center">No provider usage recorded</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <div className="border border-border bg-card rounded-xl p-5 flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 bg-secondary/50 rounded-md">
          <Icon size={16} className="text-foreground opacity-80" />
        </div>
      </div>
      <div className="text-3xl font-bold mt-4 tracking-tight tabular-nums">{value}</div>
    </div>
  );
}
