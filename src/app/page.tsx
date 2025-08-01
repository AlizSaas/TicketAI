import Link from "next/link"
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ticket, Users, Shield, BarChart3, Clock, CheckCircle } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">TicketFlow</h1>
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Get Started</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">Streamline Your Support Workflow</h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Efficiently manage tickets, assign to moderators, and track progress with our comprehensive ticket
            management system.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="text-lg px-8 py-3">
                  Start Free Trial
                </Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/onboarding">
                <Button size="lg" className="text-lg px-8 py-3">
                  Go to Dashboard
                </Button>
              </Link>
            </SignedIn>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">1000+</div>
              <div className="text-gray-600">Companies</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Manage Tickets</h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From ticket creation to resolution, our platform provides all the tools your team needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Smart Ticket Management</CardTitle>
              <CardDescription>
                Create, categorize, and track tickets with intelligent priority assignment and status updates.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Assign different roles - Users create tickets, Moderators resolve them, and Admins manage everything.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Secure & Compliant</CardTitle>
              <CardDescription>
                Enterprise-grade security with company isolation and comprehensive audit trails.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>
                Track performance metrics, resolution times, and team productivity with detailed reports.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Real-time Updates</CardTitle>
              <CardDescription>
                Get instant notifications and updates on ticket status changes and assignments.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle>Easy Integration</CardTitle>
              <CardDescription>
                Simple onboarding process with company codes and seamless team collaboration.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Roles Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Built for Every Role</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you&apos;re submitting tickets, moderating requests, or managing the entire system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-2 border-blue-200 hover:border-blue-400 transition-colors">
              <CardHeader>
                <Badge variant="secondary" className="mx-auto mb-4 bg-blue-100 text-blue-800">
                  USER
                </Badge>
                <CardTitle className="text-blue-900">Submit & Track</CardTitle>
                <CardDescription>
                  Create tickets, track progress, and communicate with moderators about your issues.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Submit support tickets</li>
                  <li>• Track ticket status</li>
                  <li>• Add notes and updates</li>
                  <li>• View ticket history</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-green-200 hover:border-green-400 transition-colors">
              <CardHeader>
                <Badge variant="secondary" className="mx-auto mb-4 bg-green-100 text-green-800">
                  MODERATOR
                </Badge>
                <CardTitle className="text-green-900">Resolve & Support</CardTitle>
                <CardDescription>
                  Handle assigned tickets, update status, and provide solutions to user problems.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• View assigned tickets</li>
                  <li>• Update ticket status</li>
                  <li>• Add resolution notes</li>
                  <li>• Manage workload</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-purple-200 hover:border-purple-400 transition-colors">
              <CardHeader>
                <Badge variant="secondary" className="mx-auto mb-4 bg-purple-100 text-purple-800">
                  ADMIN
                </Badge>
                <CardTitle className="text-purple-900">Manage & Control</CardTitle>
                <CardDescription>
                  Oversee all tickets, manage user roles, and maintain system-wide settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• View all tickets</li>
                  <li>• Manage user roles</li>
                  <li>• Assign tickets</li>
                  <li>• System analytics</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Support Process?</h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of companies already using TicketFlow to streamline their support operations.
          </p>

          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Get Started Free
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Go to Dashboard
              </Button>
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Ticket className="h-6 w-6" />
              <span className="text-xl font-bold">TicketFlow</span>
            </div>
            <div className="text-gray-400 text-sm">© 2024 TicketFlow. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
