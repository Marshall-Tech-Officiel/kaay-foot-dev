import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [telephone, setTelephone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (!authData.user?.id) {
        throw new Error("No user ID returned from signup")
      }

      // 2. Wait for the session to be established
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError

      if (!session) {
        throw new Error("No session established after signup")
      }

      // 3. Create the profile using the established session
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email,
          nom,
          prenom,
          telephone,
          role: 'reserviste'
        })

      if (profileError) {
        console.error("Profile creation error:", profileError)
        // Clean up by signing out if profile creation fails
        await supabase.auth.signOut()
        throw profileError
      }

      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
      })

      navigate('/login')
    } catch (error: any) {
      console.error("Registration error:", error)
      toast({
        variant: "destructive",
        title: "Erreur lors de l'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#E0F2E9] to-[#CDE9E0] p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-green-800">
            Mini-Foot
            <div className="h-1 w-24 bg-red-500 mx-auto mt-1" />
          </h1>
          <p className="text-gray-600">
            Créez votre compte réserviste
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg space-y-6">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  type="text"
                  placeholder="Votre prénom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  type="text"
                  placeholder="Votre nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="Votre numéro de téléphone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Votre adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Votre mot de passe"
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
                  Inscription en cours...
                </>
              ) : (
                "S'inscrire"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <a
              href="#"
              className="text-gray-500 hover:text-gray-700"
              onClick={(e) => {
                e.preventDefault()
                navigate('/login')
              }}
            >
              Déjà un compte ? Connectez-vous
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}