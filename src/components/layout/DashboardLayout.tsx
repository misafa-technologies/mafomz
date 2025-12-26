import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Background mesh gradient */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'var(--gradient-mesh)' }}
      />
      
      <Sidebar />
      
      <main className="ml-64 min-h-screen">
        <div className="relative z-10 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
