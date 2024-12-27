import { Home, Users, Briefcase, Calendar, User, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
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

type UserRole = "admin" | "proprietaire" | "gerant" | "reserviste"

// Menu items selon le rôle
const adminMenu = [
  { title: "Dashboard", icon: Home, path: "/admin" },
  { title: "Gestion Terrains", icon: Briefcase, path: "/admin/terrains" },
  { title: "Gestion Propriétaires", icon: Users, path: "/admin/proprietaires" },
  { title: "Profil", icon: User, path: "/admin/profil" },
]

const proprietaireMenu = [
  { title: "Dashboard", icon: Home, path: "/proprietaire" },
  { title: "Mes Terrains", icon: Briefcase, path: "/proprietaire/terrains" },
  { title: "Mes Gérants", icon: Users, path: "/proprietaire/gerants" },
  { title: "Réservations", icon: Calendar, path: "/proprietaire/reservations" },
  { title: "Profil", icon: User, path: "/proprietaire/profil" },
]

const gerantMenu = [
  { title: "Dashboard", icon: Home, path: "/gerant" },
  { title: "Terrains Assignés", icon: Briefcase, path: "/gerant/terrains" },
  { title: "Réservations", icon: Calendar, path: "/gerant/reservations" },
  { title: "Profil", icon: User, path: "/gerant/profil" },
]

const reservisteMenu = [
  { title: "Accueil", icon: Home, path: "/reserviste" },
  { title: "Mes Réservations", icon: Calendar, path: "/reserviste/reservations" },
  { title: "Profil", icon: User, path: "/reserviste/profil" },
]

export function AppSidebar() {
  const navigate = useNavigate()
  // TODO: Récupérer le rôle de l'utilisateur depuis le contexte d'authentification
  const userRole: UserRole = "admin" // Temporaire pour le développement

  // Sélectionner le menu selon le rôle
  const getMenuItems = () => {
    switch (userRole) {
      case "admin":
        return adminMenu
      case "proprietaire":
        return proprietaireMenu
      case "gerant":
        return gerantMenu
      case "reserviste":
        return reservisteMenu
      default:
        return []
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold">Mini-Foot</h1>
          <div className="h-1 w-16 bg-red-500 mt-1" />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getMenuItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
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
          className="w-full justify-start"
          onClick={() => {
            // TODO: Implémenter la déconnexion
            console.log("Déconnexion")
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}