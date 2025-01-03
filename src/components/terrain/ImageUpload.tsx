import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ImageUploadProps {
  onImagesChange: (files: File[]) => void
  maxFiles?: number
  maxSize?: number // in bytes
}

export function ImageUpload({ onImagesChange, maxFiles = 5, maxSize = 2 * 1024 * 1024 }: ImageUploadProps) {
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPreviews = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))

    if (previews.length + newPreviews.length > maxFiles) {
      toast.error(`Vous ne pouvez pas télécharger plus de ${maxFiles} images`)
      return
    }

    setPreviews(prev => {
      const updated = [...prev, ...newPreviews]
      onImagesChange(updated.map(p => p.file))
      return updated
    })
  }, [maxFiles, onImagesChange, previews.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize,
    maxFiles: maxFiles - previews.length,
  })

  const removeImage = (index: number) => {
    setPreviews(prev => {
      const updated = prev.filter((_, i) => i !== index)
      onImagesChange(updated.map(p => p.file))
      return updated
    })
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Déposez les images ici...</p>
        ) : (
          <p>Glissez et déposez des images ici, ou cliquez pour sélectionner</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {`Maximum ${maxFiles} images, ${Math.round(maxSize / 1024 / 1024)}MB par image`}
        </p>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={preview.preview} className="relative aspect-square group">
              <img
                src={preview.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}