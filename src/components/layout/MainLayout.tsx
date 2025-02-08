
import { useState } from "react"
import { Menu } from "lucide-react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Button } from "@/components/ui/button"
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet"
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
      <div className="flex min-h-screen w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="fixed top-4 left-4 z-50 md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Ouvrir le menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader className="text-left">
                <SheetTitle>Menu Navigation</SheetTitle>
                <SheetDescription>
                  Accédez à toutes les fonctionnalités de l&apos;application
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 h-[calc(100vh-8rem)] overflow-y-auto">
                <AppSidebar />
              </div>
            </SheetContent>
          </Sheet>
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
