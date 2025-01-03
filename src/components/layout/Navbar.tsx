import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Icons } from '@/components/Icons'

const MENUS_BY_ROLE: Record<string, Array<{ icon: string; label: string; path: string }>> = {
  admin: [
    { icon: "LayoutDashboard", label: "Dashboard", path: "/admin/dashboard" },
    { icon: "Users", label: "Propriétaires", path: "/admin/proprietaires" },
    { icon: "User", label: "Profil", path: "/admin/profile" }
  ],
  proprietaire: [
    { icon: "LayoutDashboard", label: "Dashboard", path: "/proprietaire/dashboard" },
    { icon: "Pitch", label: "Mes Terrains", path: "/proprietaire/terrains" },
    { icon: "Users", label: "Mes Gérants", path: "/proprietaire/gerants" },
    { icon: "CalendarDays", label: "Réservations", path: "/proprietaire/reservations" },
    { icon: "User", label: "Profil", path: "/proprietaire/profile" }
  ],
  gerant: [
    { icon: "LayoutDashboard", label: "Dashboard", path: "/gerant/dashboard" },
    { icon: "Pitch", label: "Terrains Assignés", path: "/gerant/terrains" },
    { icon: "CalendarDays", label: "Réservations", path: "/gerant/reservations" },
    { icon: "User", label: "Profil", path: "/gerant/profile" }
  ],
  reserviste: [
    { icon: "Home", label: "Accueil", path: "/reserviste/accueil" },
    { icon: "CalendarDays", label: "Mes Réservations", path: "/reserviste/reservations" },
    { icon: "User", label: "Profil", path: "/reserviste/profile" }
  ]
}

export function Navbar() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(true)
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
    <nav className="h-full bg-white border-r shadow-sm">
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
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex w-full items-center justify-start space-x-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        <div className="border-t p-4">
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              navigate('/login')
            }}
            className="flex w-full items-center justify-start space-x-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <Icons.LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </nav>
  )
}