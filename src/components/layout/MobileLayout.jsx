import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Users, Clock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/people', icon: Users, label: 'People' },
  { path: '/activity', icon: Clock, label: 'Activity' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function MobileLayout({ session, onLogout }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                  isActive 
                    ? "text-primary bg-primary/8" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}