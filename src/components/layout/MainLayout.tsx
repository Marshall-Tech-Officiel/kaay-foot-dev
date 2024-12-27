import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-[#D3E4FD] to-[#F1F0FB]">
        <AppSidebar />
        <main className="flex-1 p-6 transition-all duration-200">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}