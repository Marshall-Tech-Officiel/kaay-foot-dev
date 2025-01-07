import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single()

        if (profileError) throw profileError

        // Redirection selon le rôle
        switch (profileData.role) {
          case 'admin':
            navigate('/admin/dashboard')
            break
          case 'proprietaire':
            navigate('/proprietaire/dashboard')
            break
          case 'gerant':
            navigate('/gerant/dashboard')
            break
          case 'reserviste':
            navigate('/reserviste/accueil')
            break
          default:
            throw new Error('Rôle non reconnu')
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error.message || "Une erreur est survenue lors de la connexion",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#E0F2E9] to-[#CDE9E0] p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-center">
            <img src="/kaayfoot-logo.png" alt="Kaay-Foot Logo" className="h-24 mx-auto mb-4" />
          </h1>
          <p className="text-gray-600">
            Gérez vos terrains de foot en toute simplicité
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg space-y-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Your Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="space-y-2 text-center text-sm">
            <a
              href="#"
              className="block text-emerald-600 hover:text-emerald-700"
              onClick={(e) => {
                e.preventDefault()
                navigate('/forgot-password')
              }}
            >
              Mot de passe oublié ?
            </a>
            <a
              href="#"
              className="block text-gray-500 hover:text-gray-700"
              onClick={(e) => {
                e.preventDefault()
                navigate('/register')
              }}
            >
              Don't have an account? Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}