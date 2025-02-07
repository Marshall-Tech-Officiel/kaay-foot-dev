
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

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .single()

      if (error) throw error
      if (!data) throw new Error("No role found for user")
      
      setRole(data.role)
    } catch (error) {
      console.error("Error in fetchUserRole:", error)
      setRole("")
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        
        if (session?.user) {
          setUser(session.user)
          await fetchUserRole(session.user.id)
        } else {
          setUser(null)
          setRole("")
          navigate('/login')
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setUser(null)
        setRole("")
        navigate('/login')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id)
        setIsLoading(true)
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setRole("")
          queryClient.clear()
          navigate('/login')
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
          await fetchUserRole(session.user.id)
          await queryClient.invalidateQueries()
        } else if (session?.user) {
          setUser(session.user)
          await fetchUserRole(session.user.id)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [navigate])

  return { user, role, isLoading }
}
