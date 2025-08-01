  import { Badge } from "@/components/ui/badge"
import { Users, Shield, Crown, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"
import React from "react"
  export  const getPriorityBadge = (priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT") => {
    const variants = {
      LOW: "text-gray-600 border-gray-600",
      MEDIUM: "text-blue-600 border-blue-600",
      HIGH: "text-orange-600 border-orange-600",
      URGENT: "text-red-600 border-red-600",
    }
    return (
      <Badge variant="outline" className={variants[priority]}>
        {priority}
      </Badge>
    )
  }

  export const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Loader2 className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        )
      case "RESOLVED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolved
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            {status}
          </Badge>
        )
    }
  }
   export const getRoleBadge = (role: string) => {
    switch (role) {
      case "USER":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Users className="w-3 h-3 mr-1" />
            User
          </Badge>
        )
      case "MODERATOR":
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-600">
            <Shield className="w-3 h-3 mr-1" />
            Moderator
          </Badge>
        )
      case "ADMIN":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <Crown className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <Users className="w-3 h-3 mr-1" />
            {role}
          </Badge>
        )
    }
  }