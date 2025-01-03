import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card } from "@/components/ui/card"

interface TerrainCarouselProps {
  photos: { url: string }[]
}

export function TerrainCarousel({ photos }: TerrainCarouselProps) {
  if (photos.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="aspect-video bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">Aucune image</span>
        </div>
      </Card>
    )
  }

  return (
    <Carousel className="relative">
      <CarouselContent>
        {photos.map((photo, index) => (
          <CarouselItem key={index}>
            <Card className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2" />
      <CarouselNext className="absolute right-4 top-1/2" />
    </Carousel>
  )
}