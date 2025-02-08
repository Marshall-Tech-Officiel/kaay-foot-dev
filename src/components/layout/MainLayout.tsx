
import { useState } from "react"
import { Menu } from "lucide-react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/useAuth"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
      <div className="flex min-h-screen w-full relative">
        {/* Sidebar pour desktop (>1024px) */}
        <div className="hidden lg:block">
          <AppSidebar />
        </div>

        {/* Menu burger et sidebar pour mobile (<1024px) */}
        <div className="fixed top-4 left-4 z-50 lg:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="bg-white hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="p-0 w-72 border-r shadow-lg"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="h-full overflow-y-auto">
                <AppSidebar />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Contenu principal */}
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
