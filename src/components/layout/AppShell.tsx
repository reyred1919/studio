'use client';

import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Target, LayoutDashboard, ListChecks, CalendarDays, History, Settings } from 'lucide-react';
import Image from 'next/image';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { state } = useSidebar();

  const menuItems = [
    { href: '/', label: 'داشبورد', icon: LayoutDashboard },
    { href: '/', label: 'مدیریت اهداف', icon: Target },
    { href: '/tasks', label: 'مدیریت وظیفه‌ها', icon: ListChecks },
    { href: '/calendar', label: 'تقویم', icon: CalendarDays },
    { href: '/timeline', label: 'زمان‌نمای چرخه OKR', icon: History },
  ];

  return (
    <>
      <Sidebar collapsible="icon" side="right">
        <SidebarHeader className="p-4 items-center border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <Image src="https://placehold.co/40x40.png" alt="لوگو برنامه" width={36} height={36} className="rounded-full" data-ai-hint="لوگو دایره" />
            {state === 'expanded' && <span className="text-lg font-semibold text-sidebar-foreground">ردیاب OKR</span>}
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href + item.label}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    tooltip={{ children: item.label, side: 'left', className: 'font-body' }}
                    asChild
                  >
                    <a>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        {/* You can add a SidebarFooter here if needed */}
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <AppHeader />
        <main className="flex-grow">
          {children}
        </main>
         <footer className="py-8 text-center text-sm text-muted-foreground border-t mt-auto">
           ردیاب OKR &copy; {new Date().getFullYear()} - روی آنچه مهم است تمرکز کنید.
        </footer>
      </SidebarInset>
    </>
  );
}
