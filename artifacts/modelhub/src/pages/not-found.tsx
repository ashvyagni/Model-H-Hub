import React from 'react';
import { Link } from 'wouter';
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background animate-in fade-in duration-500">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
        <Terminal size={32} className="text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground mt-2 mb-8">This page could not be found.</p>
      <Link href="/">
        <Button variant="default">Return to Dashboard</Button>
      </Link>
    </div>
  );
}
