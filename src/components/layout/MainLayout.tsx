
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { useAuth } from "@/hooks/useAuth"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 bg-gradient-to-br from-[#E0F2E9] to-[#CDE9E0]">
          <div className="h-full w-full overflow-x-auto">
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}

