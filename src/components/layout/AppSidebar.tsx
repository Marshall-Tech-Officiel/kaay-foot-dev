import { Home, Users, Briefcase, Calendar, User, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"

type UserRole = "admin" | "proprietaire" | "gerant" | "reserviste"

// Menu items selon le rôle
const adminMenu = [
  { title: "Dashboard", icon: Home, path: "/admin/dashboard" },
  { title: "Gestion Terrains", icon: Briefcase, path: "/admin/terrains" },
  { title: "Gestion Propriétaires", icon: Users, path: "/admin/proprietaires" },
  { title: "Profil", icon: User, path: "/admin/profil" },
]

const proprietaireMenu = [
  { title: "Dashboard", icon: Home, path: "/proprietaire/dashboard" },
  { title: "Mes Terrains", icon: Briefcase, path: "/proprietaire/terrains" },
  { title: "Gestion Gérants", icon: Users, path: "/proprietaire/gerants" },
  { title: "Réservations", icon: Calendar, path: "/proprietaire/reservations" },
  { title: "Profil", icon: User, path: "/proprietaire/profil" },
]

const gerantMenu = [
  { title: "Dashboard", icon: Home, path: "/gerant/dashboard" },
  { title: "Terrains Assignés", icon: Briefcase, path: "/gerant/terrains" },
  { title: "Réservations", icon: Calendar, path: "/gerant/reservations" },
  { title: "Profil", icon: User, path: "/gerant/profil" },
]

const reservisteMenu = [
  { title: "Accueil", icon: Home, path: "/reserviste/accueil" },
  { title: "Mes Réservations", icon: Calendar, path: "/reserviste/reservations" },
  { title: "Profil", icon: User, path: "/reserviste/profil" },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const { role } = useAuth()

  // Sélectionner le menu selon le rôle
  const getMenuItems = () => {
    const menuMap: Record<UserRole, typeof adminMenu> = {
      admin: adminMenu,
      proprietaire: proprietaireMenu,
      gerant: gerantMenu,
      reserviste: reservisteMenu,
    }
    return menuMap[role as UserRole] || adminMenu
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <Sidebar className="h-full bg-[#2F7A3B]">
      <SidebarHeader className="p-4">
        <div className="flex flex-col items-center">
          <img src="/kaayfoot-logo.png" alt="Kaay-Foot Logo" className="h-16 w-auto object-contain" />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getMenuItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    tooltip={item.title}
                    className="text-white hover:bg-white/10"
                  >
                    <item.icon className="text-white" />
                    <span className="text-white">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-white hover:bg-white/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}