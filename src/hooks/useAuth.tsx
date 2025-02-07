
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

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
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setUser(null)
        setRole("")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true)
        try {
          if (event === 'SIGNED_OUT') {
            setUser(null)
            setRole("")
            return
          }

          if (session?.user) {
            setUser(session.user)
            await fetchUserRole(session.user.id)
          } else {
            setUser(null)
            setRole("")
          }
        } catch (error) {
          console.error("Error in auth state change:", error)
          setUser(null)
          setRole("")
        } finally {
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, role, isLoading }
}
