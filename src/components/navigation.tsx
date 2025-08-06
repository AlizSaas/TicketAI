"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"
import { signOut } from "@/lib/auth-client"

export function Navbar() {
  const { data: session ,isPending:isLoading} = useSession()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              Your App
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
            ) : session?.user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">Welcome, {session.user.name}</span>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
