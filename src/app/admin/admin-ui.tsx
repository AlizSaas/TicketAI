"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Shield,
  Crown,
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  TrendingUp,
  Filter,
  RotateCcw,
  Search,
  Key,
  Trash2,
  RefreshCwIcon,
} from "lucide-react"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import kyInstance from "@/lib/ky"
import InvitationCodesModal from "@/components/invitation-codes-model"
import ManageUserModal from "@/components/manage-user-model"
import Link from "next/link"

import { DialogHeader } from "@/components/ui/dialog"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import CustomersTableSkeleton from "@/components/cus-ske"
import { useDeleteCodeMutation } from "@/lib/mutation" // Add this import
import { toast } from "sonner"
import { AllCompanyData, UserFilters, TicketFilters } from "@/lib/types"
import InfiniteScrollContainer from "@/components/infinite-scroll-container"

import { getRoleBadge, getStatusBadge, getPriorityBadge } from "@/lib/adminFun"
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs"
import { deleteTicket, deleteUser } from "./action"



export default function AdminDashboard() {
  const { user: userLogged } = useUser()
  const [selectedUser, setSelectedUser] = useState<AllCompanyData["users"][number] | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedTicket, setSelectedTicket] = useState<AllCompanyData["tickets"][number] | null>(null)
  const queryClient = useQueryClient();

  // Filter states
  const [userFilters, setUserFilters] = useState<UserFilters>({
    role: "ALL",
    search: "",
  })

  const [ticketFilters, setTicketFilters] = useState<TicketFilters>({
    status: "ALL",
    priority: "ALL",
    category: "ALL",
    assignedTo: "ALL",
    createdBy: "ALL",
    search: "",
  }) // Optimistically set initial filters

  // Fetch data with React Query
  const {
    data,
    error,
    isPending: isPendingData,
  } = useQuery({
    queryKey: ["adminData"],
    queryFn: () => {
      return kyInstance.get("/api/admin").json<AllCompanyData>()
    },
  })

  // Add this after the existing useQuery hook
  const  deleteCode = useDeleteCodeMutation()
  
  const handleUserRoleUpdated = () => {
  queryClient.invalidateQueries({ queryKey: ["adminData"] });
  userLogged?.reload()
  setSelectedUser(null); // Optionally close the modal
};

const handleDeleteUser = async (userId: string) => {
  try {
    await deleteUser(userId);
    toast.success("User deleted successfully!");
    queryClient.invalidateQueries({ queryKey: ["adminData"] });
  } catch (error: unknown) {
    // Check for specific error message from backend
    if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: string }).message === "string" && (error as { message: string }).message.includes("cannot delete an ADMIN")) {
      toast.error("You cannot delete an admin user.");
    } else {
      toast.error("Failed to delete user.");
    }
  }
}

const  handleDeleteTicket = async (ticketId: string) => {
  try {
    await deleteTicket(ticketId);
    toast.success("Ticket deleted successfully!");
    queryClient.invalidateQueries({ queryKey: ["adminData"] });
  } catch (error) {
    toast.error("Failed to delete ticket.");
    console.error("Delete ticket error:", error);
  }
}

  // Get unique values for filter dropdowns
  const uniqueCategories = useMemo(() => {
    if (!data?.tickets) return []
    const categories = data.tickets
      .map((ticket) => ticket.category)
      .filter((category, index, self) => category && self.indexOf(category) === index)
    return categories
  }, [data]) // Get unique categories for filter dropdowns

  const uniqueAssignees = useMemo(() => {
    if (!data?.tickets) return []
    const assignees = data.tickets
      .map((ticket) => ticket.assignedToName)
      .filter((assignee, index, self) => assignee && self.indexOf(assignee) === index)
    return assignees
  }, [data]) // Get unique assignees for filter dropdowns

  const uniqueCreators = useMemo(() => {
    if (!data?.tickets) return []
    const creators = data.tickets
      .map((ticket) => ticket.createdByName)
      .filter((creator, index, self) => creator && self.indexOf(creator) === index)
    return creators
  }, [data])

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!data?.users) return []
    return data.users.filter((user) => {
      const roleMatch = userFilters.role === "ALL" || user.role === userFilters.role
      const searchMatch =
        userFilters.search === "" ||
        user.firstname?.toLowerCase().includes(userFilters.search.toLowerCase()) ||
        user.email?.toLowerCase().includes(userFilters.search.toLowerCase())

      return roleMatch && searchMatch
    })
  }, [data, userFilters])

  // Filter tickets
  const filteredTickets = useMemo(() => {
    if (!data?.tickets) return []
    return data.tickets.filter((ticket) => {
      const statusMatch = ticketFilters.status === "ALL" || ticket.status === ticketFilters.status
      const priorityMatch = ticketFilters.priority === "ALL" || ticket.priority === ticketFilters.priority
      const categoryMatch = ticketFilters.category === "ALL" || ticket.category === ticketFilters.category
      const assignedToMatch = ticketFilters.assignedTo === "ALL" || ticket.assignedToName === ticketFilters.assignedTo
      const createdByMatch = ticketFilters.createdBy === "ALL" || ticket.createdByName === ticketFilters.createdBy
      const searchMatch =
        ticketFilters.search === "" ||
        ticket.title.toLowerCase().includes(ticketFilters.search.toLowerCase()) ||
        ticket.description.toLowerCase().includes(ticketFilters.search.toLowerCase())

      return statusMatch && priorityMatch && categoryMatch && assignedToMatch && createdByMatch && searchMatch
    })
  }, [data, ticketFilters])

  // Calculate stats from filtered data
  const companyStats = useMemo(() => {
    if (!data)
      return {
        totalUsers: 0,
        totalModerators: 0,
        totalTickets: 0,
        pendingTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        rejectedTickets: 0,
        urgentTickets: 0,
        totalCodes: 0,
        usedCodes: 0,
      }

    const totalUsers = filteredUsers.length
    const totalModerators = filteredUsers.filter((user) => user.role === "MODERATOR").length
    const totalTickets = filteredTickets.length
    const pendingTickets = filteredTickets.filter((ticket) => ticket.status === "PENDING").length
    const inProgressTickets = filteredTickets.filter((ticket) => ticket.status === "IN_PROGRESS").length
    const resolvedTickets = filteredTickets.filter((ticket) => ticket.status === "RESOLVED").length
    const rejectedTickets = filteredTickets.filter((ticket) => ticket.status === "REJECTED").length
    const urgentTickets = filteredTickets.filter((ticket) => ticket.priority === "URGENT").length
    const totalCodes = data.codes?.length || 0
    const usedCodes = data.codes?.filter((code) => code.used).length || 0

    return {
      totalUsers,
      totalModerators,
      totalTickets,
      pendingTickets,
      inProgressTickets,
      resolvedTickets,
      rejectedTickets,
      urgentTickets,
      totalCodes,
      usedCodes,
    }
  }, [data, filteredUsers, filteredTickets])

  // Sort filtered tickets by creation date (most recent first)
  const recentTickets = useMemo(() => {
    return filteredTickets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }, [filteredTickets])



  const handleUserFilterChange = (filterType: keyof UserFilters, value: string) => {
    setUserFilters((prev) => ({
      ...prev,
      [filterType]: value,
    })) // Optimistically update the filter state
  }

  const handleTicketFilterChange = (filterType: keyof TicketFilters, value: string) => {
    setTicketFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
  }

  const resetUserFilters = () => {
    setUserFilters({
      role: "ALL",
      search: "",
    })
  }

  const resetTicketFilters = () => {
    setTicketFilters({
      status: "ALL",
      priority: "ALL",
      category: "ALL",
      assignedTo: "ALL",
      createdBy: "ALL",
      search: "",
    })
  }



  const hasActiveUserFilters = userFilters.role !== "ALL" || userFilters.search !== ""
  const hasActiveTicketFilters =
    ticketFilters.status !== "ALL" ||
    ticketFilters.priority !== "ALL" ||
    ticketFilters.category !== "ALL" ||
    ticketFilters.assignedTo !== "ALL" ||
    ticketFilters.createdBy !== "ALL" ||
    ticketFilters.search !== ""

  // Loading state
  if (isPendingData) {
    return <CustomersTableSkeleton />
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <XCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
              <p className="text-gray-600 mb-4">There was an error loading the company data.</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!data) {
    return <CustomersTableSkeleton />
  }
  

  const handleDeleteCode = (codeId: string) => {
    deleteCode.mutate(codeId)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your company users, moderators, and tickets - {data._count?.users || 0} users,{" "}
            {data._count?.tickets || 0} tickets
          </p>
        </div>

        {/* Company Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {hasActiveUserFilters ? "Filtered" : "Total"} Users
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companyStats.totalUsers}</div>
              <p className="text-xs text-gray-500 mt-1">
                {hasActiveUserFilters ? "Matching filters" : "Company employees"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Moderators</CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companyStats.totalModerators}</div>
              <p className="text-xs text-gray-500 mt-1">Team moderators</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {hasActiveTicketFilters ? "Filtered" : "Total"} Tickets
              </CardTitle>
              <Ticket className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companyStats.totalTickets}</div>
              <p className="text-xs text-gray-500 mt-1">{companyStats.pendingTickets} pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Invitation Codes</CardTitle>
              <Key className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companyStats.totalCodes}</div>
              <p className="text-xs text-gray-500 mt-1">{companyStats.usedCodes} used</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 gap-10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Team Members ({filteredUsers.length})</TabsTrigger>
            <TabsTrigger value="tickets">Tickets ({filteredTickets.length})</TabsTrigger>
            <TabsTrigger value="codes">Codes ({data.codes?.length || 0})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ticket Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Status Overview</CardTitle>
                  <CardDescription>
                    {hasActiveTicketFilters ? "Filtered ticket distribution" : "Current ticket distribution"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        {companyStats.pendingTickets}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">In Progress</span>
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        {companyStats.inProgressTickets}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Resolved</span>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {companyStats.resolvedTickets}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium">Rejected</span>
                      </div>
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        {companyStats.rejectedTickets}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                  <CardDescription>Key metrics for your team</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Resolution Rate</span>
                      <Badge className="bg-green-100 text-green-800">
                        {companyStats.totalTickets > 0
                          ? Math.round((companyStats.resolvedTickets / companyStats.totalTickets) * 100)
                          : 0}
                        %
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Urgent Tickets</span>
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        {companyStats.urgentTickets}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Moderators</span>
                      <span className="text-sm text-gray-600">{companyStats.totalModerators}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Users</span>
                      <span className="text-sm text-gray-600">{companyStats.totalUsers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Members Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* User Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  User Filters
                  {hasActiveUserFilters && (
                    <Badge variant="secondary" className="ml-2">
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Filter team members by role and search</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Search Users</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by name or email..."
                        value={userFilters.search}
                        onChange={(e) => handleUserFilterChange("search", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Role</Label>
                    <Select value={userFilters.role} onValueChange={(value) => handleUserFilterChange("role", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Roles</SelectItem>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="MODERATOR">Moderator</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {hasActiveUserFilters && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      Showing {filteredUsers.length} of {data.users?.length || 0} users
                    </p>
                    <Button variant="outline" size="sm" onClick={resetUserFilters}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Team Members</span>
                  <Badge variant="outline" className="text-sm">
                    {filteredUsers.length} members
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {hasActiveUserFilters
                    ? "Filtered view of users and moderators in your company"
                    : "Manage users and moderators in your company"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredUsers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Skills</TableHead>
                       
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                        <TableHead>Delete</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{user.firstname || "Unknown"}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.skills?.slice(0, 2).map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {user.skills?.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{user.skills.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                                Manage
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                             className="text-red-600 hover:text-red-700 hover:bg-red-50"
                             size="sm" variant="outline" onClick={() => handleDeleteUser(user.id)}>
                             <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    {hasActiveUserFilters ? (
                      <>
                        <p className="text-gray-500 mb-2">No users match your filters</p>
                        <p className="text-sm text-gray-400 mb-4">Try adjusting your filter criteria</p>
                        <Button variant="outline" onClick={resetUserFilters}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset Filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500">No users found</p>
                        <p className="text-sm text-gray-400">Invite team members to get started.</p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            {/* Ticket Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Ticket Filters
                  {hasActiveTicketFilters && (
                    <Badge variant="secondary" className="ml-2">
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Filter tickets by status, priority, assignment, and more</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by title or description..."
                    value={ticketFilters.search}
                    onChange={(e) => handleTicketFilterChange("search", e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Status</Label>
                    <Select
                      value={ticketFilters.status}
                      onValueChange={(value) => handleTicketFilterChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Priority</Label>
                    <Select
                      value={ticketFilters.priority}
                      onValueChange={(value) => handleTicketFilterChange("priority", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Priorities</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Category</Label>
                    <Select
                      value={ticketFilters.category}
                      onValueChange={(value) => handleTicketFilterChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Categories</SelectItem>
                        {uniqueCategories.map((category) => (
                          <SelectItem key={category} value={category!}>
                            {category}
                          </SelectItem>
                        ))}
                        <SelectItem value="null">No Category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Assigned To</Label>
                    <Select
                      value={ticketFilters.assignedTo}
                      onValueChange={(value) => handleTicketFilterChange("assignedTo", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Assignees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Assignees</SelectItem>
                        {uniqueAssignees.map((assignee) => (
                          <SelectItem key={assignee} value={assignee!}>
                            {assignee}
                          </SelectItem>
                        ))}
                        <SelectItem value="null">Unassigned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Created By</Label>
                    <Select
                      value={ticketFilters.createdBy}
                      onValueChange={(value) => handleTicketFilterChange("createdBy", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Creators" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Creators</SelectItem>
                        {uniqueCreators.map((creator) => (
                          <SelectItem key={creator} value={creator!}>
                            {creator}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {hasActiveTicketFilters && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      Showing {filteredTickets.length} of {data.tickets?.length || 0} tickets
                    </p>
                    <Button variant="outline" size="sm" onClick={resetTicketFilters}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset All
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">Pending</p>
                      <p className="text-2xl font-bold">{companyStats.pendingTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">In Progress</p>
                      <p className="text-2xl font-bold">{companyStats.inProgressTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Resolved</p>
                      <p className="text-2xl font-bold">{companyStats.resolvedTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Resolution Rate</p>
                      <p className="text-2xl font-bold">
                        {companyStats.totalTickets > 0
                          ? Math.round((companyStats.resolvedTickets / companyStats.totalTickets) * 100)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Tickets</span>
                  <Badge variant="outline" className="text-sm">
                    {recentTickets.length} tickets
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {hasActiveTicketFilters ? "Filtered tickets in your company" : "Latest tickets in your company"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentTickets.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                        <TableHead>Delete</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTickets.map((ticket) => (
                        <TableRow key={ticket.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Link
                              href={`/admin/${ticket.id}`}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                            >
                              {ticket.title}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getRoleBadge(ticket.createdByRole)}
                              <div>
                                <div className="font-medium">{ticket.createdByName}</div>
                              
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {ticket.assignedToName ? (
                              <div className="flex items-center space-x-2">
                                {getRoleBadge(ticket.assignedToRole)}
                                <span className="text-sm">{ticket.assignedToName}</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                Unassigned
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button onClick={() => setSelectedTicket(ticket)} size="sm" variant="outline">
                              View Details
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button onClick={() => handleDeleteTicket(ticket.id)} size="sm" variant="outline">
                            <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    {hasActiveTicketFilters ? (
                      <>
                        <p className="text-gray-500 mb-2">No tickets match your filters</p>
                        <p className="text-sm text-gray-400 mb-4">Try adjusting your filter criteria</p>
                        <Button variant="outline" onClick={resetTicketFilters}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset Filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500">No tickets found</p>
                        <p className="text-sm text-gray-400">Tickets will appear here when users create them.</p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Codes Tab */}
            <TabsContent value="codes" className="space-y-6">
            <Card>
              <CardHeader>
              <CardTitle>Invitation Codes</CardTitle>
              <CardDescription>Manage invitation codes for your company</CardDescription>
              </CardHeader>
              <CardContent>
              <InfiniteScrollContainer onBottomReached={() => {}} className="">
                {data.codes && data.codes.length > 0 ? (
                <Table>
                  <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Delete</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {data.codes.map((code) => (
                    <TableRow key={code.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{code.code}</div>
                    </TableCell>
                    <TableCell>
                      {code.used ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Used
                      </Badge>
                      ) : (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        <Key className="w-3 h-3 mr-1" />
                        Available
                      </Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(code.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={code.used}
                        onClick={() => {
                        navigator.clipboard.writeText(code.code)
                        toast.success("Code copied to clipboard");
                        }}
                      >
                        {code.used ? "Used" : "Copy"}
                      </Button>
                     
                      </div>
                    </TableCell>
                    <TableCell>
                     <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCode(code.id)}
                                  disabled={deleteCode.isPending}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  {deleteCode.isPending && deleteCode.variables === code.id ? (
                                     
                                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>

                    </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
                ) : (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No invitation codes found</p>
                  <p className="text-sm text-gray-400">Create codes to invite new team members.</p>
                </div>
                )}
              </InfiniteScrollContainer>
              </CardContent>
            </Card>
            </TabsContent>
        </Tabs>

        {selectedTicket && (
          <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Ticket Details
                </DialogTitle>
                <DialogDescription>View ticket information and status</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedTicket.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                      {selectedTicket.category && <Badge variant="outline">{selectedTicket.category}</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-600">Submitted on</Label>
                      <div className="font-medium">{new Date(selectedTicket.createdAt).toLocaleDateString()}</div>
                      <div className="text-gray-500">{new Date(selectedTicket.createdAt).toLocaleTimeString()}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Last updated</Label>
                      <div className="font-medium">{new Date(selectedTicket.updatedAt).toLocaleDateString()}</div>
                      <div className="text-gray-500">{new Date(selectedTicket.updatedAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Description</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">{selectedTicket.description}</div>
                  </div>
                  {selectedTicket.assignedToId && (
                    <div>
                      <Label className="text-gray-600">Assigned to</Label>
                      <div className="mt-1 p-3 bg-blue-50 rounded-md">
                        <div className="text-sm text-gray-600">Name: {selectedTicket.assignedToName}</div>
                      </div>
                    </div>
                  )}
                  {selectedTicket.relatedSkills && selectedTicket.relatedSkills.length > 0 && (
                    <div>
                      <Label className="text-gray-600">Related Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTicket.relatedSkills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Team Management */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>Manage your team and invite new members</CardDescription>
          </CardHeader>
          <CardContent>
            <InvitationCodesModal />
          </CardContent>
        </Card>

        {/* User Management Modal */}
        {selectedUser && (
          <ManageUserModal user={selectedUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} onUpdate={handleUserRoleUpdated} />
        )}
      </div>
    </div>
  )
}
