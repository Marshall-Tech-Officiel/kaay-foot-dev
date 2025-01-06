import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { PrivateRoute } from "@/components/auth/PrivateRoute"

// Pages
import Index from "@/pages/Index"
import Login from "@/pages/auth/Login"
import Register from "@/pages/auth/Register"
import Error404 from "@/pages/Error404"
import Error403 from "@/pages/Error403"

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard"
import AdminTerrains from "@/pages/admin/Terrains"
import AdminProprietaires from "@/pages/admin/Proprietaires"
import AdminProfil from "@/pages/admin/Profil"

// Proprietaire Pages
import ProprietaireDashboard from "@/pages/proprietaire/Dashboard"
import ProprietaireTerrains from "@/pages/proprietaire/Terrains"
import ProprietaireTerrainDetails from "@/pages/proprietaire/TerrainDetails"
import ProprietaireGerants from "@/pages/proprietaire/Gerants"
import ProprietaireReservations from "@/pages/proprietaire/Reservations"
import ProprietaireProfil from "@/pages/proprietaire/Profil"

// Gerant Pages
import GerantDashboard from "@/pages/gerant/Dashboard"
import GerantTerrains from "@/pages/gerant/Terrains"
import GerantTerrainDetails from "@/pages/gerant/TerrainDetails"
import GerantReservations from "@/pages/gerant/Reservations"
import GerantProfile from "@/pages/gerant/Profile"

// Reserviste Pages
import ReservisteAccueil from "@/pages/reserviste/Accueil"
import ReservisteProfile from "@/pages/reserviste/Profile"
import ReservisteReservations from "@/pages/reserviste/Reservations"
import TerrainDetails from "@/pages/reserviste/TerrainDetails"

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    errorElement: <Error404 />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/admin",
    element: <PrivateRoute allowedRoles={["admin"]}><Outlet /></PrivateRoute>,
    children: [
      {
        path: "dashboard",
        element: <AdminDashboard />,
      },
      {
        path: "terrains",
        element: <AdminTerrains />,
      },
      {
        path: "proprietaires",
        element: <AdminProprietaires />,
      },
      {
        path: "profile",
        element: <AdminProfil />,
      },
    ],
  },
  {
    path: "/proprietaire",
    element: <PrivateRoute allowedRoles={["proprietaire"]}><Outlet /></PrivateRoute>,
    children: [
      {
        path: "dashboard",
        element: <ProprietaireDashboard />,
      },
      {
        path: "terrains",
        element: <ProprietaireTerrains />,
      },
      {
        path: "terrains/:id",
        element: <ProprietaireTerrainDetails />,
      },
      {
        path: "gerants",
        element: <ProprietaireGerants />,
      },
      {
        path: "reservations",
        element: <ProprietaireReservations />,
      },
      {
        path: "profil",
        element: <ProprietaireProfil />,
      },
    ],
  },
  {
    path: "/gerant",
    element: <PrivateRoute allowedRoles={["gerant"]}><Outlet /></PrivateRoute>,
    children: [
      {
        path: "dashboard",
        element: <GerantDashboard />,
      },
      {
        path: "terrains",
        element: <GerantTerrains />,
      },
      {
        path: "terrains/:id",
        element: <GerantTerrainDetails />,
      },
      {
        path: "reservations",
        element: <GerantReservations />,
      },
      {
        path: "profile",
        element: <GerantProfile />,
      },
    ],
  },
  {
    path: "/reserviste",
    element: <PrivateRoute allowedRoles={["reserviste"]}><Outlet /></PrivateRoute>,
    children: [
      {
        path: "accueil",
        element: <ReservisteAccueil />,
      },
      {
        path: "terrains/:id",
        element: <TerrainDetails />,
      },
      {
        path: "profil",
        element: <ReservisteProfile />,
      },
      {
        path: "reservations",
        element: <ReservisteReservations />,
      },
    ],
  },
  {
    path: "/403",
    element: <Error403 />,
  },
])

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  )
}

export default App