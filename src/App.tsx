import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import Login from "@/pages/auth/Login"
import Register from "@/pages/auth/Register"
import ForgotPassword from "@/pages/auth/ForgotPassword"
import AdminDashboard from "@/pages/admin/Dashboard"
import ProprietaireDashboard from "@/pages/proprietaire/Dashboard"
import GerantDashboard from "@/pages/gerant/Dashboard"
import ReservisteAccueil from "@/pages/reserviste/Accueil"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import Profile from "@/pages/profile/Profile"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="/proprietaire/*" element={<ProtectedRoute allowedRoles={["proprietaire"]} />}>
            <Route path="dashboard" element={<ProprietaireDashboard />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="/gerant/*" element={<ProtectedRoute allowedRoles={["gerant"]} />}>
            <Route path="dashboard" element={<GerantDashboard />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="/reserviste/*" element={<ProtectedRoute allowedRoles={["reserviste"]} />}>
            <Route path="accueil" element={<ReservisteAccueil />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Login />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  )
}