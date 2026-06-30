import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
