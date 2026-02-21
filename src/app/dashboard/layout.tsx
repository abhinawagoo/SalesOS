import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import { UserProfile } from '@/lib/types'
import ProfileSetupError from '@/components/layout/ProfileSetupError'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, organizations(id, name)')
    .eq('id', user.id)
    .single()

  // Profile missing = setup failed or schema not applied.
  // DO NOT redirect to /auth/login here — that creates an infinite redirect loop
  // (proxy.ts sends authenticated users back to /dashboard/rep immediately).
  if (!profile) {
    return <ProfileSetupError userId={user.id} email={user.email ?? ''} />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={profile as UserProfile} />
      <main className="flex-1 bg-[#0a0a0f] overflow-auto">
        {children}
      </main>
    </div>
  )
}
