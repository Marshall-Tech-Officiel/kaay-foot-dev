
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

      if (error || !data) throw error || new Error("No role found")
      setRole(data.role)
    } catch (error) {
      console.error("Error in fetchUserRole:", error)
      setRole("")
    }
  }

  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (session?.user) {
          setUser(session.user)
          await fetchUserRole(session.user.id)
        } else {
          setUser(null)
          setRole("")
        }
      } catch (error) {
        if (!mounted) return
        console.error("Error initializing auth:", error)
        setUser(null)
        setRole("")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        try {
          if (event === 'SIGNED_OUT' || !session) {
            setUser(null)
            setRole("")
            queryClient.clear()
          } else if (session?.user) {
            setUser(session.user)
            await fetchUserRole(session.user.id)
          }
        } catch (error) {
          console.error("Auth state change error:", error)
          setUser(null)
          setRole("")
        } finally {
          if (mounted) setIsLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, role, isLoading }
}
