import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Users, Shield, Zap, BarChart3 } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: CheckCircle,
      title: "Status Tracking",
      description: "Track tickets through Pending, In Progress, Resolved, and Rejected states",
      badges: ["Real-time", "Automated"],
    },
    {
      icon: AlertTriangle,
      title: "Priority Management",
      description: "Organize tickets by Low, Medium, High, and Urgent priority levels",
      badges: ["Smart Sorting", "Alerts"],
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Assign tickets to team members and track progress collaboratively",
      badges: ["Assignment", "Notifications"],
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Three-tier permission system: Users, Moderators, and Admins",
      badges: ["Security", "Permissions"],
    },
    {
      icon: Zap,
      title: "Skill Matching",
      description: "Match tickets to users based on their skills and expertise",
      badges: ["AI-Powered", "Efficient"],
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive reporting and analytics for ticket performance",
      badges: ["Insights", "Reports"],
    },
  ]

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features for Modern Teams</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage tickets efficiently and keep your team productive
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {feature.badges.map((badge, badgeIndex) => (
                      <Badge key={badgeIndex} variant="secondary" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
