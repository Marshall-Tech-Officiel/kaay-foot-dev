import { MainLayout } from "@/components/layout/MainLayout"
import { ProfileInfoForm } from "@/components/profile/ProfileInfoForm"
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"

export default function Profile() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <Breadcrumbs />
        <h1 className="text-2xl font-bold">Mon Profil</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <ProfileInfoForm />
          <PasswordChangeForm />
        </div>
      </div>
    </MainLayout>
  )
}