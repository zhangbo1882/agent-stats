'use client';

import { Menu, X, LayoutDashboard, Code, Plug, Server, History, FileText, FolderTree, Settings, Activity, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPage: string;
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Skills', path: '/skills', icon: Code },
  { name: 'Plugins', path: '/plugins', icon: Plug },
  { name: 'MCP', path: '/mcp', icon: Server },
  { name: 'Projects', path: '/projects', icon: FolderTree },
  { name: 'Debug', path: '/debug', icon: Activity },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar({ isOpen, onToggle, currentPage }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r transition-all duration-300',
        !isOpen && '-translate-x-full'
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b px-4">
          <h1 className="text-lg font-bold">Agent Stats</h1>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-accent rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.path;

            return (
              <a
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
