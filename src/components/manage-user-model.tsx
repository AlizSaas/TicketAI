"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Users, Shield, Crown, X } from "lucide-react"
import { changeUserRole, updateUserSkills } from "@/app/admin/action"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useUser } from "@clerk/nextjs" // Import useUser hook

type SelectedUser = {
  id: string
  clerkId: string
  email: string
  firstname: string | null
  role: string
  skills: string[]
  createdAt: Date
  updatedAt: Date
  _count: {
    tickets: number
    assigned: number
  } | null
}

interface ManageUserModalProps {
  user: SelectedUser
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void // Optional callback for additional actions after any update
}

export default function ManageUserModal({ user, isOpen, onClose, onUpdate }: ManageUserModalProps) {
  const [selectedRole, setSelectedRole] = useState(user.role)
  const [newSkill, setNewSkill] = useState("")
  const [currentSkills, setCurrentSkills] = useState<string[]>(user.skills)
  const [isLoading, setIsLoading] = useState(false)
  const [isSkillsLoading, setIsSkillsLoading] = useState(false)
  const [userState, setUserState] = useState(user) // local state for displayed user

  const { user: loggedUser } = useUser() // Get the currently logged-in user

  // Update local state when user prop changes (e.g., after a successful update and re-fetch)
  useEffect(() => {
    setUserState(user)
    setSelectedRole(user.role)
    setCurrentSkills(user.skills)
  }, [user])

  // Check if the logged-in user is trying to manage their own account
  const isManagingSelf = loggedUser?.id === userState.clerkId

  // Check if the logged-in user is an admin
  // Assuming role is stored in publicMetadata.role. Adjust if your Clerk setup is different.
  const isAdmin = loggedUser?.publicMetadata?.role === "ADMIN" 

  // If the logged-in user is not an admin, don't render the modal content
  if (!isAdmin) {
    return null
  }

  const handleRoleUpdate = async () => {
    if (selectedRole === userState.role) return // No change
    setIsLoading(true)
    try {
      await changeUserRole(userState.id, selectedRole)
      toast.success(`User role updated to ${selectedRole}`)
      setUserState((prev) => ({ ...prev, role: selectedRole }))
      onClose()
      onUpdate?.() // Call optional callback if provided
    } catch (error) {
      toast.error("Failed to update user role")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSkill = () => {
    const skillToAdd = newSkill.trim()
    if (skillToAdd && !currentSkills.includes(skillToAdd)) {
      setCurrentSkills((prev) => [...prev, skillToAdd])
      setNewSkill("")
    } else if (currentSkills.includes(skillToAdd)) {
      toast.info("Skill already exists.")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setCurrentSkills((prev) => prev.filter((skill) => skill !== skillToRemove))
  }

  const handleSaveSkills = async () => {
    // Check if skills have actually changed
    if (JSON.stringify(currentSkills.sort()) === JSON.stringify(userState.skills.sort())) {
      toast.info("No changes to save.")
      return
    }

    setIsSkillsLoading(true)
    try {
       await updateUserSkills(userState.id, currentSkills)
      
        toast.success("User skills updated successfully!")
        setUserState((prev) => ({ ...prev, skills: currentSkills }))
        onUpdate?.() // Call optional callback if provided
        onClose()
      
     
     
    } catch (error) {
      toast.error("An unexpected error occurred while updating skills.")
      console.error("Error updating skills:", error)
    } finally {
      setIsSkillsLoading(false)
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage User</DialogTitle>
          <DialogDescription>Update user role and permissions</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="role" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="role">Manage Role</TabsTrigger>
            <TabsTrigger value="skills">Manage Skills</TabsTrigger>
          </TabsList>
          <TabsContent value="role" className="pt-4">
            <div className="space-y-6">
              {/* User Info */}
              <div className="space-y-2">
                <Label>User Information</Label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{userState.firstname}</span>
                  </div>
                  <p className="text-sm text-gray-600">{userState.email}</p>
                  <p className="text-sm text-gray-600">Company: {userState.id}</p>
                  <div className="flex space-x-2 mt-2">
                    <Badge variant="outline">{userState._count?.tickets} tickets created</Badge>
                    <Badge variant="outline">{userState._count?.assigned} tickets assigned</Badge>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <span>Current role:</span>
                    <Badge>
                      {getRoleIcon(userState.role)} {userState.role}
                    </Badge>
                  </div>
                </div>
              </div>
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Role</Label>
                {isManagingSelf ? (
                  <div className="text-center py-4 text-red-500 border border-red-200 rounded-md bg-red-50">
                    <p>You cannot change your own role.</p>
                  </div>
                ) : (
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
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRoleUpdate}
                  disabled={isLoading || selectedRole === userState.role || isManagingSelf}
                >
                  {isLoading ? "Updating..." : "Update Role"}
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="skills" className="pt-4">
            {userState.role === "MODERATOR" ? (
              isManagingSelf ? (
                <div className="text-center py-8 text-red-500 border border-red-200 rounded-md bg-red-50">
                  <p>You cannot manage your own skills.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="new-skill">Add New Skill</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="new-skill"
                        placeholder="e.g., JavaScript, React"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddSkill()
                          }
                        }}
                      />
                      <Button onClick={handleAddSkill} disabled={!newSkill.trim() || isSkillsLoading}>
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Current Skills</Label>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-gray-50">
                      {currentSkills.length > 0 ? (
                        currentSkills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {skill}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0.5 rounded-full hover:bg-gray-200"
                              onClick={() => handleRemoveSkill(skill)}
                              disabled={isSkillsLoading}
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove skill</span>
                            </Button>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No skills added yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveSkills}
                      disabled={
                        isSkillsLoading ||
                        JSON.stringify(currentSkills.sort()) === JSON.stringify(userState.skills.sort())
                      }
                    >
                      {isSkillsLoading ? "Saving..." : "Save Skills"}
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Skill management is only available for Moderators.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
