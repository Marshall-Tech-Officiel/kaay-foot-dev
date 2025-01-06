import { ProfileInfoForm } from "@/components/profile/ProfileInfoForm"
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm"

export default function Profile() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Mon Profil</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ProfileInfoForm />
        <PasswordChangeForm />
      </div>
    </div>
  )
}