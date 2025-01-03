import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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
    <Carousel className="relative w-full">
      <CarouselContent>
        {photos.map((photo, index) => (
          <CarouselItem key={index}>
            <Dialog>
              <DialogTrigger asChild>
                <Card className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]">
                  <div className="aspect-video relative">
                    <img
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </DialogContent>
            </Dialog>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2" />
      <CarouselNext className="absolute right-4 top-1/2" />
    </Carousel>
  )
}