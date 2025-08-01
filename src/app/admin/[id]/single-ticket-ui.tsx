"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Mail,
  Calendar,
  AlertTriangle,
  FileText,
  Tag,
  Users,
  ArrowLeft,
  Edit,
  MessageSquare,
} from "lucide-react"
import { useState } from "react"
import type { $Enums } from "@prisma/client"
import Link from "next/link"

type TicketData = {
  id: string
  createdAt: Date
  updatedAt: Date
  companyId: string
  title: string
  description: string
  status: $Enums.Status
  priority: $Enums.Priority
  category: string | null
  createdById: string
  createdByName: string | null
  createdByEmail: string | null
  createdByRole: $Enums.Role
  assignedToId: string | null
  assignedToName: string | null
  assignedToEmail: string | null
  assignedToRole: $Enums.Role
  notes: string | null
  relatedSkills: string[]
} | null

interface SingleITicketPageProps {
  userData: TicketData
}

export default function SingleITicketPage({ userData: ticketData }: SingleITicketPageProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket Not Found</h2>
              <p className="text-gray-600 mb-4">The ticket you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <Button asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: $Enums.Status) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50">
            <Clock className="w-4 h-4 mr-2" />
            Pending
          </Badge>
        )
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">
            <Loader2 className="w-4 h-4 mr-2" />
            In Progress
          </Badge>
        )
      case "RESOLVED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
            <CheckCircle className="w-4 h-4 mr-2" />
            Resolved
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50">
            <XCircle className="w-4 h-4 mr-2" />
            Rejected
          </Badge>
        )
    }
  }

  const getPriorityBadge = (priority: $Enums.Priority) => {
    const variants = {
      LOW: "text-gray-600 border-gray-600 bg-gray-50",
      MEDIUM: "text-blue-600 border-blue-600 bg-blue-50",
      HIGH: "text-orange-600 border-orange-600 bg-orange-50",
      URGENT: "text-red-600 border-red-600 bg-red-50",
    }

    const icons = {
      LOW: <Tag className="w-4 h-4 mr-2" />,
      MEDIUM: <Tag className="w-4 h-4 mr-2" />,
      HIGH: <AlertTriangle className="w-4 h-4 mr-2" />,
      URGENT: <AlertTriangle className="w-4 h-4 mr-2" />,
    }

    return (
      <Badge variant="outline" className={variants[priority]}>
        {icons[priority]}
        {priority}
      </Badge>
    )
  }

  const getRoleBadge = (role: $Enums.Role) => {
    const variants = {
      USER: "bg-blue-100 text-blue-800",
      MODERATOR: "bg-purple-100 text-purple-800",
      ADMIN: "bg-red-100 text-red-800",
    }
    return <Badge className={variants[role]}>{role}</Badge>
  }

  const getStatusColor = (status: $Enums.Status) => {
    switch (status) {
      case "PENDING":
        return "border-l-yellow-500 bg-yellow-50"
      case "IN_PROGRESS":
        return "border-l-blue-500 bg-blue-50"
      case "RESOLVED":
        return "border-l-green-500 bg-green-50"
      case "REJECTED":
        return "border-l-red-500 bg-red-50"
      default:
        return "border-l-gray-500 bg-gray-50"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Ticket className="w-6 h-6 text-gray-600" />
                <span className="text-sm text-gray-500 font-mono">#{ticketData.id.slice(-8)}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{ticketData.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                {getStatusBadge(ticketData.status)}
                {getPriorityBadge(ticketData.priority)}
                {ticketData.category && (
                  <Badge variant="outline" className="bg-gray-50">
                    <Tag className="w-3 h-3 mr-1" />
                    {ticketData.category}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Comment
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{ticketData.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Related Skills */}
            {ticketData.relatedSkills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Related Skills
                  </CardTitle>
                  <CardDescription>Skills associated with this ticket</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ticketData.relatedSkills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-sm capitalize">
                        {skill.replace(/([a-z])([A-Z])/g, '$1 $2')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {ticketData.notes && (
              <Card className={`border-l-4 ${getStatusColor(ticketData.status)}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Notes
                  </CardTitle>
                  <CardDescription>Additional information about this ticket</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{ticketData.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(ticketData.status)}</div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium text-gray-600">Priority</Label>
                  <div className="mt-1">{getPriorityBadge(ticketData.priority)}</div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium text-gray-600">Category</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="bg-gray-50">
                      {ticketData.category || "No category"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium text-gray-600">Created</Label>
                  <div className="mt-1 text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(ticketData.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(ticketData.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                  <div className="mt-1 text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(ticketData.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(ticketData.updatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creator Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Created By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="font-medium text-gray-900">{ticketData.createdByName || "Unknown User"}</div>
                    {ticketData.createdByEmail && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <Mail className="w-3 h-3" />
                        {ticketData.createdByEmail}
                      </div>
                    )}
                  </div>
                  <div>{getRoleBadge(ticketData.createdByRole)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ticketData.assignedToId ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Assigned To</Label>
                      <div className="mt-1">
                        <div className="font-medium text-gray-900">
                          {ticketData.assignedToName || "Unknown Assignee"}
                        </div>
                        {ticketData.assignedToEmail && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <Mail className="w-3 h-3" />
                            {ticketData.assignedToEmail}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>{getRoleBadge(ticketData.assignedToRole)}</div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Not assigned yet</p>
                    <Button size="sm" className="mt-2">
                      Assign Ticket
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ticketData.status === "PENDING" && (
                  <Button className="w-full" size="sm">
                    <Loader2 className="w-4 h-4 mr-2" />
                    Start Working
                  </Button>
                )}
                {ticketData.status === "IN_PROGRESS" && (
                  <>
                    <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Resolved
                    </Button>
                    <Button variant="destructive" className="w-full" size="sm">
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Ticket
                    </Button>
                  </>
                )}
                {(ticketData.status === "RESOLVED" || ticketData.status === "REJECTED") && (
                  <div className="text-center py-2">
                    <Badge variant="outline" className="text-sm">
                      {ticketData.status === "RESOLVED" ? "Completed" : "Closed"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
