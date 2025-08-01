"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Users, Shield, Crown } from "lucide-react"
import { changeUserRole } from "@/app/admin/action"


type SelectedUser = {
    id: string;
    clerkId: string;
    email: string;
    firstname: string | null;
    role: string;
    skills: string[];
    createdAt: Date;
    updatedAt: Date;
    _count: {
        tickets: number;
        assigned: number;
    } | null;
}
interface ManageUserModalProps {
  user: SelectedUser 
  isOpen: boolean
  onClose: () => void
}

export default function ManageUserModal({ user, isOpen, onClose }: ManageUserModalProps) {
  const [selectedRole, setSelectedRole] = useState(user.role)
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleUpdate = async (userId:string, role:string) => {
    if (selectedRole === user.role) return

    setIsLoading(true)
    try {
      // Add your API call here
      await changeUserRole(user.id, selectedRole) 
      toast.success(`User role updated to ${selectedRole}`)
      onClose()
    } catch (error) {
      toast.error("Failed to update user role")
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "USER":
        return <Users className="w-4 h-4" />
      case "MODERATOR":
        return <Shield className="w-4 h-4" />
      case "ADMIN":
        return <Crown className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage User</DialogTitle>
          <DialogDescription>Update user role and permissions</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="space-y-2">
            <Label>User Information</Label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{user.firstname}</span>
              </div>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-600">Company: {user.id}</p>
              <div className="flex space-x-2 mt-2">
                <Badge variant="outline">{user._count?.tickets} tickets created</Badge>
                <Badge variant="outline">{user._count?.assigned} tickets assigned</Badge>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value: "USER" | "MODERATOR" | "ADMIN") => setSelectedRole(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>User</span>
                  </div>
                </SelectItem>
                <SelectItem value="MODERATOR">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Moderator</span>
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4" />
                    <span>Admin</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => handleRoleUpdate(user.id, selectedRole)}
              disabled={isLoading || selectedRole === user.role}
            >
              {isLoading ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
