'use client'
import { Button } from "@/components/ui/button"
import { SignUpButton } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { ArrowRight, Ticket, Users, Building2 } from "lucide-react"

export function HeroSection() {
  const { user, isSignedIn } = useUser()

  return (
    <section className="relative py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Streamline Your
            <span className="text-blue-600 block">Ticket Management</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Organize, track, and resolve tickets efficiently with role-based access control. Perfect for companies
            managing internal requests and support workflows.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {!isSignedIn && (
              <SignUpButton mode="modal">
                <Button size="lg" className="text-lg px-8 py-3">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignUpButton>
            )}
            <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent">
              Watch Demo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Ticketing</h3>
              <p className="text-gray-600 text-center">
                Create, assign, and track tickets with priority levels and status updates
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Role Management</h3>
              <p className="text-gray-600 text-center">User, Moderator, and Admin roles with granular permissions</p>
            </div>

            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Company Structure</h3>
              <p className="text-gray-600 text-center">
                Organize teams with invitation codes and company-wide visibility
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
