import { SidebarProvider } from '@/components/ui/sidebar';
import AppShell from '@/components/layout/AppShell';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppShell>
        {children}
      </AppShell>
    </SidebarProvider>
  );
}
