
import { Home, Users, Briefcase, Calendar, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

type UserRole = "admin" | "proprietaire" | "gerant" | "reserviste"

const menuItems = {
  admin: [
    { title: "Dashboard", icon: Home, path: "/admin/dashboard" },
    { title: "Gestion Terrains", icon: Briefcase, path: "/admin/terrains" },
    { title: "Gestion Propriétaires", icon: Users, path: "/admin/proprietaires" },
    { title: "Profil", icon: User, path: "/admin/profil" },
  ],
  proprietaire: [
    { title: "Dashboard", icon: Home, path: "/proprietaire/dashboard" },
    { title: "Mes Terrains", icon: Briefcase, path: "/proprietaire/terrains" },
    { title: "Gestion Gérants", icon: Users, path: "/proprietaire/gerants" },
    { title: "Réservations", icon: Calendar, path: "/proprietaire/reservations" },
    { title: "Profil", icon: User, path: "/proprietaire/profil" },
  ],
  gerant: [
    { title: "Dashboard", icon: Home, path: "/gerant/dashboard" },
    { title: "Terrains Assignés", icon: Briefcase, path: "/gerant/terrains" },
    { title: "Réservations", icon: Calendar, path: "/gerant/reservations" },
    { title: "Profil", icon: User, path: "/gerant/profil" },
  ],
  reserviste: [
    { title: "Accueil", icon: Home, path: "/reserviste/accueil" },
    { title: "Mes Réservations", icon: Calendar, path: "/reserviste/reservations" },
    { title: "Profil", icon: User, path: "/reserviste/profil" },
  ]
}

interface AppSidebarProps {
  isMobile?: boolean
  role?: UserRole
  onNavigate?: (path: string) => void
  onLogout?: () => void
}

export function AppSidebar({ 
  isMobile = false,
  role = "admin",
  onNavigate = (path) => console.log(`Navigate to: ${path}`),
  onLogout = () => console.log("Logout clicked")
}: AppSidebarProps) {
  const currentMenuItems = menuItems[role] || menuItems.admin

  const menuContent = (
    <div className="flex flex-col h-full bg-[#2F7A3B]">
      {!isMobile && (
        <div className="p-4">
          <div className="flex flex-col items-center">
            <img 
              src="/kaayfoot-logo.png"
              alt="Kaay-Foot Logo" 
              className="h-16 w-16 object-contain rounded-full bg-white p-2"
            />
          </div>
        </div>
      )}

      <div className="flex-1 px-4 py-2">
        <div className="mb-2">
          <span className="text-sm font-medium text-white/70">Menu</span>
        </div>
        <nav className="space-y-1">
          {currentMenuItems.map((item) => (
            <Button
              key={item.title}
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10"
              onClick={() => onNavigate(item.path)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </Button>
          ))}
        </nav>
      </div>

      <div className="p-4 mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start text-white hover:bg-white/10"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </Button>
      </div>
    </div>
  )

  if (!isMobile) {
    return (
      <div className="h-full">
        {menuContent}
      </div>
    )
  }

  return menuContent
}
