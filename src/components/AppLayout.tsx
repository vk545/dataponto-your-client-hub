import { AppSidebar } from "./AppSidebar";
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  useNotifications({ userId: user?.id, enabled: !!user });

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className={isMobile ? "pt-14 min-h-screen" : "ml-64 min-h-screen"}>
        {children}
      </main>
    </div>
  );
}
