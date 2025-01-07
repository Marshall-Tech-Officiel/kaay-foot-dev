import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import Index from "@/pages/Index"
import Login from "@/pages/auth/Login"
import Register from "@/pages/auth/Register"
import ForgotPassword from "@/pages/auth/ForgotPassword"
import AdminDashboard from "@/pages/admin/Dashboard"
import AdminTerrains from "@/pages/admin/Terrains"
import AdminProprietaires from "@/pages/admin/Proprietaires"
import AdminProfil from "@/pages/admin/Profil"
import ProprietaireDashboard from "@/pages/proprietaire/Dashboard"
import ProprietaireTerrains from "@/pages/proprietaire/Terrains"
import ProprietaireGerants from "@/pages/proprietaire/Gerants"
import ProprietaireReservations from "@/pages/proprietaire/Reservations"
import ProprietaireProfil from "@/pages/proprietaire/Profil"
import GerantDashboard from "@/pages/gerant/Dashboard"
import GerantTerrains from "@/pages/gerant/Terrains"
import GerantReservations from "@/pages/gerant/Reservations"
import GerantProfil from "@/pages/gerant/Profile"
import ReservisteAccueil from "@/pages/reserviste/Accueil"
import ReservisteReservations from "@/pages/reserviste/Reservations"
import ReservisteProfil from "@/pages/reserviste/Profile"
import TerrainDetails from "@/pages/reserviste/TerrainDetails"
import Error403 from "@/pages/Error403"
import Error404 from "@/pages/Error404"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

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
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/403" element={<Error403 />} />
          <Route path="/404" element={<Error404 />} />

          {/* Admin routes */}
          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="terrains" element={<AdminTerrains />} />
            <Route path="proprietaires" element={<AdminProprietaires />} />
            <Route path="profil" element={<AdminProfil />} />
          </Route>

          {/* Proprietaire routes */}
          <Route path="/proprietaire/*" element={<ProtectedRoute allowedRoles={["proprietaire"]} />}>
            <Route path="dashboard" element={<ProprietaireDashboard />} />
            <Route path="terrains" element={<ProprietaireTerrains />} />
            <Route path="gerants" element={<ProprietaireGerants />} />
            <Route path="reservations" element={<ProprietaireReservations />} />
            <Route path="profil" element={<ProprietaireProfil />} />
          </Route>

          {/* Gerant routes */}
          <Route path="/gerant/*" element={<ProtectedRoute allowedRoles={["gerant"]} />}>
            <Route path="dashboard" element={<GerantDashboard />} />
            <Route path="terrains" element={<GerantTerrains />} />
            <Route path="reservations" element={<GerantReservations />} />
            <Route path="profil" element={<GerantProfil />} />
          </Route>

          {/* Reserviste routes */}
          <Route path="/reserviste/*" element={<ProtectedRoute allowedRoles={["reserviste"]} />}>
            <Route path="accueil" element={<ReservisteAccueil />} />
            <Route path="reservations" element={<ReservisteReservations />} />
            <Route path="profil" element={<ReservisteProfil />} />
            <Route path="terrain/:id" element={<TerrainDetails />} />
          </Route>

          {/* Catch all route - redirect to login */}
          <Route path="*" element={<Error404 />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  )
}