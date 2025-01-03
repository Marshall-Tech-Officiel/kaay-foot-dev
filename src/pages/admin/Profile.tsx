import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { ProfileInfoForm } from "@/components/profile/ProfileInfoForm"
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm"

export default function AdminProfile() {
  return (
    <MainLayout>
      <div className="container mx-auto space-y-8 p-4">
        <Breadcrumbs />
        
        <div className="grid gap-8 md:grid-cols-2">
          <ProfileInfoForm />
          <PasswordChangeForm />
        </div>
      </div>
    </MainLayout>
  )
}