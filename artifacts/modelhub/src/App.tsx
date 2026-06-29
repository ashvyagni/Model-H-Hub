import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import Dashboard from '@/pages/Dashboard';
import Providers from '@/pages/Providers';
import Models from '@/pages/Models';
import Playground from '@/pages/Playground';
import History from '@/pages/History';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/not-found';
import Shell from '@/components/layout/Shell';

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/providers" component={Providers} />
        <Route path="/models" component={Models} />
        <Route path="/playground" component={Playground} />
        <Route path="/history" component={History} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster theme="dark" position="bottom-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
