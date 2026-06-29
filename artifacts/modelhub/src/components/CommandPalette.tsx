import React from 'react';
import { Command } from 'cmdk';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogTitle, DialogPortal, DialogOverlay } from '@radix-ui/react-dialog';
import { Search } from 'lucide-react';

export function CommandPalette({ open, onOpenChange, nav }: { open: boolean, onOpenChange: (open: boolean) => void, nav: any[] }) {
  const [, setLocation] = useLocation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
        <DialogContent className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-card rounded-xl border border-border shadow-2xl overflow-hidden p-0 z-50 animate-in fade-in zoom-in-95 duration-200">
          <DialogTitle className="sr-only">Command Palette</DialogTitle>
          <Command className="w-full flex flex-col text-foreground bg-transparent font-sans" loop>
            <div className="flex items-center border-b border-border px-4 py-3">
              <Search size={16} className="text-muted-foreground mr-2 shrink-0" />
              <Command.Input 
                autoFocus 
                placeholder="Type a command or search..." 
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No results found.</Command.Empty>
              <Command.Group heading="Navigation" className="text-xs text-muted-foreground font-medium px-2 py-2">
                {nav.map(item => (
                  <Command.Item 
                    key={item.href} 
                    onSelect={() => { setLocation(item.href); onOpenChange(false); }}
                    className="flex items-center gap-2 px-2 py-2 mt-1 rounded-md text-sm text-foreground cursor-pointer data-[selected=true]:bg-secondary data-[selected=true]:text-foreground transition-colors outline-none"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
