import { useState } from "react"
import { Star } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface TerrainRatingProps {
  terrainId: string
}

export function TerrainRating({ terrainId }: TerrainRatingProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [hoveredRating, setHoveredRating] = useState(0)

  const { data: userRating } = useQuery({
    queryKey: ["terrain-rating", terrainId, user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from("terrain_ratings")
        .select("rating")
        .eq("terrain_id", terrainId)
        .eq("user_id", user.id)
        .maybeSingle()
      return data?.rating || 0
    },
    enabled: !!user,
  })

  const { data: averageRating } = useQuery({
    queryKey: ["terrain-average-rating", terrainId],
    queryFn: async () => {
      const { data } = await supabase
        .from("terrain_ratings")
        .select("rating")
        .eq("terrain_id", terrainId)
      
      if (!data || data.length === 0) return 0
      const sum = data.reduce((acc, curr) => acc + curr.rating, 0)
      return Number((sum / data.length).toFixed(1))
    },
  })

  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      if (!user) throw new Error("User not authenticated")

      const { data: existingRating } = await supabase
        .from("terrain_ratings")
        .select()
        .eq("terrain_id", terrainId)
        .eq("user_id", user.id)
        .maybeSingle()

      if (existingRating) {
        const { error } = await supabase
          .from("terrain_ratings")
          .update({ rating })
          .eq("terrain_id", terrainId)
          .eq("user_id", user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("terrain_ratings")
          .insert([{ terrain_id: terrainId, user_id: user.id, rating }])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terrain-rating"] })
      queryClient.invalidateQueries({ queryKey: ["terrain-average-rating"] })
      toast({
        title: "Note enregistrée",
        description: "Merci d'avoir noté ce terrain !",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de votre note.",
        variant: "destructive",
      })
    },
  })

  const handleRate = (rating: number) => {
    rateMutation.mutate(rating)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((rating) => (
            <Button
              key={rating}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onMouseEnter={() => setHoveredRating(rating)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => handleRate(rating)}
            >
              <Star
                className={`h-5 w-5 ${
                  rating <= (hoveredRating || userRating || 0)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            </Button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {averageRating > 0 ? `${averageRating} / 5` : "Aucune note"}
        </span>
      </div>
      {!user && (
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour noter ce terrain
        </p>
      )}
    </div>
  )
}