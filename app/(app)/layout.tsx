// app/(app)/layout.tsx
import { Sidebar } from '@/components/common/Sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'hsl(222 47% 11%)' }}>
      <Sidebar />
      <main className="flex-1 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
