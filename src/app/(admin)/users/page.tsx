import { prisma } from '@/lib/prisma'
import { UserPanel } from './UserPanel'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const [users, session] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    auth(),
  ])

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Benutzerverwaltung</h1>
        <p className="text-sm text-gray-400 mt-1">Nur Admin-Konten — reguläre Benutzer werden nicht benötigt</p>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <UserPanel users={users as any} currentUserId={session?.user?.id ?? ''} />
    </div>
  )
}
