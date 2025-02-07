
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
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
import ProprietaireTerrainDetails from "@/pages/proprietaire/TerrainDetails"
import ProprietaireGerants from "@/pages/proprietaire/Gerants"
import ProprietaireReservations from "@/pages/proprietaire/Reservations"
import ProprietaireProfil from "@/pages/proprietaire/Profil"
import GerantDashboard from "@/pages/gerant/Dashboard"
import GerantTerrains from "@/pages/gerant/Terrains"
import GerantTerrainDetails from "@/pages/gerant/TerrainDetails"
import GerantReservations from "@/pages/gerant/Reservations"
import GerantProfil from "@/pages/gerant/Profile"
import ReservisteAccueil from "@/pages/reserviste/Accueil"
import ReservisteReservations from "@/pages/reserviste/Reservations"
import ReservisteProfil from "@/pages/reserviste/Profile"
import TerrainDetails from "@/pages/reserviste/TerrainDetails"
import Error403 from "@/pages/Error403"
import Error404 from "@/pages/Error404"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      placeholderData: (previousData) => previousData
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
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/terrains" element={<AdminTerrains />} />
            <Route path="/admin/proprietaires" element={<AdminProprietaires />} />
            <Route path="/admin/profil" element={<AdminProfil />} />
          </Route>

          {/* Proprietaire routes */}
          <Route element={<ProtectedRoute allowedRoles={["proprietaire"]} />}>
            <Route path="/proprietaire" element={<Navigate to="/proprietaire/dashboard" replace />} />
            <Route path="/proprietaire/dashboard" element={<ProprietaireDashboard />} />
            <Route path="/proprietaire/terrains" element={<ProprietaireTerrains />} />
            <Route path="/proprietaire/terrains/:id" element={<ProprietaireTerrainDetails />} />
            <Route path="/proprietaire/gerants" element={<ProprietaireGerants />} />
            <Route path="/proprietaire/reservations" element={<ProprietaireReservations />} />
            <Route path="/proprietaire/profil" element={<ProprietaireProfil />} />
          </Route>

          {/* Gerant routes */}
          <Route element={<ProtectedRoute allowedRoles={["gerant"]} />}>
            <Route path="/gerant" element={<Navigate to="/gerant/dashboard" replace />} />
            <Route path="/gerant/dashboard" element={<GerantDashboard />} />
            <Route path="/gerant/terrains" element={<GerantTerrains />} />
            <Route path="/gerant/terrains/:id" element={<GerantTerrainDetails />} />
            <Route path="/gerant/reservations" element={<GerantReservations />} />
            <Route path="/gerant/profil" element={<GerantProfil />} />
          </Route>

          {/* Reserviste routes */}
          <Route element={<ProtectedRoute allowedRoles={["reserviste"]} />}>
            <Route path="/reserviste" element={<Navigate to="/reserviste/accueil" replace />} />
            <Route path="/reserviste/accueil" element={<ReservisteAccueil />} />
            <Route path="/reserviste/reservations" element={<ReservisteReservations />} />
            <Route path="/reserviste/profil" element={<ReservisteProfil />} />
            <Route path="/reserviste/terrain/:id" element={<TerrainDetails />} />
          </Route>

          {/* Catch all route - redirect to 404 */}
          <Route path="*" element={<Error404 />} />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </QueryClientProvider>
  )
}
