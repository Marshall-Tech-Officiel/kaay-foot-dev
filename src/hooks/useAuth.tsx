
import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { useNavigate } from "react-router-dom"
import { queryClient } from "@/lib/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useSession } from "./useSession"
import { toast } from "sonner"

export function useAuth() {
  const { session, isLoading: sessionLoading } = useSession()
  const [role, setRole] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const handleSession = async () => {
      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", session.user.id)
            .single()

          if (error) {
            console.error("Error fetching user role:", error)
            throw error
          }

          setRole(data?.role || "")
          setIsLoading(false)
        } catch (error) {
          console.error("Session handling error:", error)
          // Clear everything and redirect to login
          setRole("")
          queryClient.clear()
          await supabase.auth.signOut()
          navigate('/login')
          toast.error("Session expirée. Veuillez vous reconnecter.")
        }
      } else if (!sessionLoading) {
        // If there's no session and we're not loading, clear everything
        setRole("")
        setIsLoading(false)
        queryClient.clear()
        navigate('/login')
      }
    }

    handleSession()
  }, [session, sessionLoading, navigate])

  // Return both the user and role status
  return {
    user: session?.user || null,
    role,
    isLoading: isLoading || sessionLoading
  }
}
