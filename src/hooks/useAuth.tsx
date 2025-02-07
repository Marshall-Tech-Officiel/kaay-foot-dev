
import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { useNavigate } from "react-router-dom"
import { queryClient } from "@/lib/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useSession } from "./useSession"

export function useAuth() {
  const { session, isLoading: sessionLoading } = useSession()
  const [role, setRole] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (session?.user) {
      supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching user role:", error)
            setRole("")
          } else {
            setRole(data?.role || "")
          }
          setIsLoading(false)
        })
    } else {
      setRole("")
      setIsLoading(sessionLoading)
      if (!sessionLoading) {
        queryClient.clear()
      }
    }
  }, [session, sessionLoading])

  return {
    user: session?.user || null,
    role,
    isLoading: isLoading || sessionLoading
  }
}
