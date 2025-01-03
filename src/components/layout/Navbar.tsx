import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Icons } from '@/components/Icons'
import { Button } from '@/components/ui/button'

const MENUS_BY_ROLE: Record<string, Array<{ icon: string; label: string; path: string }>> = {
  admin: [
    { icon: "LayoutDashboard", label: "Dashboard", path: "/admin" },
    { icon: "Briefcase", label: "Gestion Terrains", path: "/admin/terrains" },
    { icon: "Users", label: "Gestion Propriétaires", path: "/admin/proprietaires" },
    { icon: "User", label: "Profil", path: "/admin/profil" },
  ],
  proprietaire: [
    { icon: "LayoutDashboard", label: "Dashboard", path: "/proprietaire" },
    { icon: "Briefcase", label: "Mes Terrains", path: "/proprietaire/terrains" },
    { icon: "Users", label: "Gestion Gérants", path: "/proprietaire/gerants" },
    { icon: "Calendar", label: "Réservations", path: "/proprietaire/reservations" },
    { icon: "User", label: "Profil", path: "/proprietaire/profil" },
  ],
  gerant: [
    { icon: "LayoutDashboard", label: "Dashboard", path: "/gerant" },
    { icon: "Briefcase", label: "Terrains Assignés", path: "/gerant/terrains" },
    { icon: "Calendar", label: "Réservations", path: "/gerant/reservations" },
    { icon: "User", label: "Profil", path: "/gerant/profil" },
  ],
  reserviste: [
    { icon: "Home", label: "Accueil", path: "/reserviste" },
    { icon: "Calendar", label: "Mes Réservations", path: "/reserviste/reservations" },
    { icon: "User", label: "Profil", path: "/reserviste/profil" },
  ]
}

export function Navbar() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function getUserRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()
        
        if (profile) {
          setUserRole(profile.role)
        }
      }
    }

    getUserRole()
  }, [])

  const menuItems = userRole ? MENUS_BY_ROLE[userRole] : []

  return (
    <nav
      className="fixed left-0 top-0 z-50 h-full bg-white transition-all duration-300 w-full border-r shadow-sm"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-center border-b">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-12 w-auto"
          />
        </div>

        <div className="flex-1 space-y-2 p-4">
          {menuItems.map((item) => {
            const Icon = Icons[item.icon]
            return (
              <Button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setIsOpen(false)
                }}
                variant="ghost"
                className="flex w-full items-center justify-start space-x-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            )
          })}
        </div>

        <div className="border-t p-4">
          <Button
            onClick={async () => {
              await supabase.auth.signOut()
              navigate('/login')
            }}
            variant="ghost"
            className="flex w-full items-center justify-start space-x-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <Icons.LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}