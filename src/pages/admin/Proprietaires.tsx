import { useState } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UserPlus, Search } from "lucide-react"
import { ProprietairesList } from "@/components/proprietaires/ProprietairesList"
import { CreateProprietaireForm } from "@/components/proprietaires/CreateProprietaireForm"

export default function AdminProprietaires() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gestion des Propriétaires</h1>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Ajouter un propriétaire
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un propriétaire</DialogTitle>
              </DialogHeader>
              
              <CreateProprietaireForm
                onSuccess={() => {
                  setIsOpen(false)
                }}
                onCancel={() => setIsOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ProprietairesList searchQuery={searchQuery} />
      </div>
    </MainLayout>
  )
}