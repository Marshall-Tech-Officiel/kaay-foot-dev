
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
      console.log("Fetching role for user:", userId)
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .single()
      console.log("Role fetch result:", { data, error })

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
        console.log("1. Starting auth init...")
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log("2. Session:", session)
        
        if (!mounted) {
          console.log("Component unmounted, stopping initialization")
          return
        }
        
        if (session?.user) {
          console.log("3. User found:", session.user.id)
          setUser(session.user)
          
          const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", session.user.id)
            .single()
          console.log("4. Profile data:", data, "Error:", error)
          
          if (data?.role) {
            console.log("5. Setting role:", data.role)
            setRole(data.role)
          }
        } else {
          console.log("No session found")
          setUser(null)
          setRole("")
        }
      } catch (error) {
        console.error("6. Auth error:", error)
        if (!mounted) return
        setUser(null)
        setRole("")
      } finally {
        console.log("7. Setting isLoading false")
        if (mounted) setIsLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id)
        if (!mounted) {
          console.log("Component unmounted, ignoring auth change")
          return
        }
        
        try {
          if (event === 'SIGNED_OUT' || !session) {
            console.log("User signed out or no session")
            setUser(null)
            setRole("")
            queryClient.clear()
          } else if (session?.user) {
            console.log("Session user found:", session.user.id)
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
      console.log("Cleaning up auth effect")
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, role, isLoading }
}
