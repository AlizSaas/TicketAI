import { validateAuthRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AdminAiChat from './components/admin-ai-chat'

export const metadata = {
  title: 'Admin AI Assistant',
}

export default async function AdminAiPage() {
  const user = await validateAuthRequest()

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    select: { role: true, firstname: true },
  })

  if (dbUser?.role !== 'ADMIN') {
    return (
      <div className="flex h-svh items-center justify-center p-6">
        <div className="max-w-sm space-y-2 text-center">
          <h1 className="text-lg font-semibold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            The Admin AI Assistant is only available to company admins.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-svh">
      <AdminAiChat adminName={dbUser.firstname ?? 'Admin'} />
    </div>
  )
}
