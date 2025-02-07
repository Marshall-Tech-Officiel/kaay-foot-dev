
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { User } from "@supabase/supabase-js"
import { useNavigate } from "react-router-dom"
import { queryClient } from "@/lib/react-query"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const fetchUserRole = async (userId: string): Promise<string> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single()

    if (error || !data) return ""
    return data.role
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          const userRole = await fetchUserRole(session.user.id)
          setRole(userRole)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setRole("")
        queryClient.clear()
        setIsLoading(false)
        return
      }

      if (session?.user) {
        setUser(session.user)
        const userRole = await fetchUserRole(session.user.id)
        setRole(userRole)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, role, isLoading }
}
