import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Navbar } from "./Navbar"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Mobile Menu */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Navbar />
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
  )
}