
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("Session error:", sessionError)
          throw sessionError
        }
        
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
        // Ne pas throw l'erreur ici pour éviter de bloquer l'initialisation
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true)
        try {
          console.log("Auth state changed:", event, session?.user?.id)
          
          if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            setUser(null)
            setRole("")
            return
          }

          // Handle token refresh
          if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed successfully')
            if (!session?.user) {
              throw new Error('No user data after token refresh')
            }
          }

          if (session?.user) {
            setUser(session.user)
            await fetchUserRole(session.user.id)
          } else {
            // Si pas de session, on considère que l'utilisateur n'est pas connecté
            setUser(null)
            setRole("")
          }
        } catch (error) {
          console.error("Error in auth state change:", error)
          // En cas d'erreur de refresh token, on déconnecte l'utilisateur
          await supabase.auth.signOut()
          setUser(null)
          setRole("")
        } finally {
          setIsLoading(false)
        }
      }
    )

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .single()

      if (error) {
        console.error("Error fetching user role:", error)
        throw error
      }

      if (!data) {
        throw new Error("No role found for user")
      }

      setRole(data.role)
    } catch (error) {
      console.error("Error in fetchUserRole:", error)
      setRole("")
      throw error // Re-throw to be handled by le caller
    }
  }

  return { user, role, isLoading }
}
