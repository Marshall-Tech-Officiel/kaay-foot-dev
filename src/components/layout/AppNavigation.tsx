
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { AppSidebar } from "./AppSidebar"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"

// Définition du type pour s'assurer que role est valide
type UserRole = "admin" | "proprietaire" | "gerant" | "reserviste"

const isValidRole = (role: string): role is UserRole => {
  return ['admin', 'proprietaire', 'gerant', 'reserviste'].includes(role)
}

export function AppNavigation() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { role: rawRole } = useAuth()
  
  // Convertir le role en UserRole valide, par défaut "reserviste"
  const role: UserRole = isValidRole(rawRole) ? rawRole : "reserviste"

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!isMobile) {
    return (
      <div className="hidden md:block w-[280px] min-w-[280px] border-r">
        <AppSidebar
          role={role}
          onNavigate={(path) => navigate(path)}
          onLogout={handleLogout}
        />
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
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="p-4 text-left">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Menu de navigation principal de l'application
                </SheetDescription>
              </SheetHeader>
              <div className="h-[calc(100vh-5rem)]">
                <AppSidebar 
                  isMobile={true}
                  role={role}
                  onNavigate={(path) => navigate(path)}
                  onLogout={handleLogout}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      <div className="h-16" />
    </>
  )
}
