import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { PrivateRoute } from "@/components/auth/PrivateRoute"
import { lazy, Suspense } from "react"

// Pages publiques
import Index from "./pages/Index"
const Login = lazy(() => import("./pages/auth/Login"))
const Register = lazy(() => import("./pages/auth/Register"))

// Pages d'erreur
const Error404 = lazy(() => import("./pages/Error404"))
const Error403 = lazy(() => import("./pages/Error403"))

// Pages Admin
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"))
const AdminTerrains = lazy(() => import("./pages/admin/Terrains"))
const AdminProprietaires = lazy(() => import("./pages/admin/Proprietaires"))
const AdminProfil = lazy(() => import("./pages/admin/Profil"))

// Pages Propriétaire
const ProprietaireDashboard = lazy(() => import("./pages/proprietaire/Dashboard"))
const ProprietaireTerrains = lazy(() => import("./pages/proprietaire/Terrains"))
const ProprietaireTerrainDetails = lazy(() => import("./pages/proprietaire/TerrainDetails"))
const ProprietaireGerants = lazy(() => import("./pages/proprietaire/Gerants"))
const ProprietaireReservations = lazy(() => import("./pages/proprietaire/Reservations"))
const ProprietaireProfil = lazy(() => import("./pages/proprietaire/Profil"))

// Pages Gérant
const GerantDashboard = lazy(() => import("./pages/gerant/Dashboard"))
const GerantTerrains = lazy(() => import("./pages/gerant/Terrains"))
const GerantTerrainDetails = lazy(() => import("./pages/gerant/TerrainDetails"))
const GerantReservations = lazy(() => import("./pages/gerant/Reservations"))
const GerantProfile = lazy(() => import("./pages/gerant/Profile"))

// Pages Réserviste
const ReservisteAccueil = lazy(() => import("./pages/reserviste/Accueil"))
const ReservisteReservations = lazy(() => import("./pages/reserviste/Reservations"))
const ReservisteProfile = lazy(() => import("./pages/reserviste/Profile"))

const queryClient = new QueryClient()

const LoadingSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
)

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Routes Admin */}
            <Route path="/admin" element={
              <PrivateRoute allowedRoles={["admin"]}>
                <Navigate to="/admin/dashboard" replace />
              </PrivateRoute>
            } />
            <Route path="/admin/dashboard" element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </PrivateRoute>
            } />
            <Route path="/admin/terrains" element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminTerrains />
              </PrivateRoute>
            } />
            <Route path="/admin/proprietaires" element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminProprietaires />
              </PrivateRoute>
            } />
            <Route path="/admin/profil" element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminProfil />
              </PrivateRoute>
            } />

            {/* Routes Propriétaire */}
            <Route path="/proprietaire" element={
              <PrivateRoute allowedRoles={["proprietaire"]}>
                <Navigate to="/proprietaire/dashboard" replace />
              </PrivateRoute>
            } />
            <Route path="/proprietaire/dashboard" element={
              <PrivateRoute allowedRoles={["proprietaire"]}>
                <ProprietaireDashboard />
              </PrivateRoute>
            } />
            <Route path="/proprietaire/terrains" element={
              <PrivateRoute allowedRoles={["proprietaire"]}>
                <ProprietaireTerrains />
              </PrivateRoute>
            } />
            <Route path="/proprietaire/terrains/:id" element={
              <PrivateRoute allowedRoles={["proprietaire"]}>
                <ProprietaireTerrainDetails />
              </PrivateRoute>
            } />
            <Route path="/proprietaire/gerants" element={
              <PrivateRoute allowedRoles={["proprietaire"]}>
                <ProprietaireGerants />
              </PrivateRoute>
            } />
            <Route path="/proprietaire/reservations" element={
              <PrivateRoute allowedRoles={["proprietaire"]}>
                <ProprietaireReservations />
              </PrivateRoute>
            } />
            <Route path="/proprietaire/profil" element={
              <PrivateRoute allowedRoles={["proprietaire"]}>
                <ProprietaireProfil />
              </PrivateRoute>
            } />

            {/* Routes Gérant */}
            <Route path="/gerant" element={
              <PrivateRoute allowedRoles={["gerant"]}>
                <Navigate to="/gerant/dashboard" replace />
              </PrivateRoute>
            } />
            <Route path="/gerant/dashboard" element={
              <PrivateRoute allowedRoles={["gerant"]}>
                <GerantDashboard />
              </PrivateRoute>
            } />
            <Route path="/gerant/terrains" element={
              <PrivateRoute allowedRoles={["gerant"]}>
                <GerantTerrains />
              </PrivateRoute>
            } />
            <Route path="/gerant/terrains/:id" element={
              <PrivateRoute allowedRoles={["gerant"]}>
                <GerantTerrainDetails />
              </PrivateRoute>
            } />
            <Route path="/gerant/reservations" element={
              <PrivateRoute allowedRoles={["gerant"]}>
                <GerantReservations />
              </PrivateRoute>
            } />
            <Route path="/gerant/profile" element={
              <PrivateRoute allowedRoles={["gerant"]}>
                <GerantProfile />
              </PrivateRoute>
            } />

            {/* Routes Réserviste */}
            <Route path="/reserviste" element={
              <PrivateRoute allowedRoles={["reserviste"]}>
                <Navigate to="/reserviste/accueil" replace />
              </PrivateRoute>
            } />
            <Route path="/reserviste/accueil" element={
              <PrivateRoute allowedRoles={["reserviste"]}>
                <ReservisteAccueil />
              </PrivateRoute>
            } />
            <Route path="/reserviste/reservations" element={
              <PrivateRoute allowedRoles={["reserviste"]}>
                <ReservisteReservations />
              </PrivateRoute>
            } />
            <Route path="/reserviste/profile" element={
              <PrivateRoute allowedRoles={["reserviste"]}>
                <ReservisteProfile />
              </PrivateRoute>
            } />

            {/* Pages d'erreur */}
            <Route path="/403" element={<Error403 />} />
            <Route path="*" element={<Error404 />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
