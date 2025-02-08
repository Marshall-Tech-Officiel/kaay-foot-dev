
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { AppSidebar } from "./AppSidebar"

export function AppNavigation() {
  const isMobile = useIsMobile()

  if (!isMobile) {
    return (
      <div className="hidden md:block">
        <AppSidebar />
      </div>
    )
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-white/80 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-4">
          <img 
            src="/kaayfoot-logo.png" 
            alt="Kaay-Foot Logo" 
            className="h-10 w-10 object-contain rounded-full bg-white p-1"
          />
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="p-4 text-left">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Menu de navigation principal de l'application
                </SheetDescription>
              </SheetHeader>
              <div className="h-[calc(100vh-4rem)]">
                <AppSidebar />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      <div className="h-16" /> {/* Spacer pour compenser la navbar fixed */}
    </>
  )
}
