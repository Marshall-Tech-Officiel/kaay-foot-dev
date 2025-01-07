import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

interface ProtectedRouteProps {
  allowedRoles: string[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, profile } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}