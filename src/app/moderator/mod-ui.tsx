"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Ticket, Clock, CheckCircle, XCircle, Loader2, Eye, TrendingUp, Filter, RotateCcw } from "lucide-react"
import { useState, useMemo } from "react"
import { toast } from "sonner"
import { makeTicketInProgress } from "./action" // Update with correct path
import { useQuery } from "@tanstack/react-query"
import kyInstance from "@/lib/ky"
import { useUpdateTicketStatus } from "./use-mutation"
import type { AssignedTicket } from "@/lib/types"

// Types based on the provided AssignedTicket
export type assignedTicketsProps = {
  map(arg0: (ticket: AssignedTicket) => AssignedTicket): assignedTicketsProps | undefined
  assignedTickets: AssignedTicket[]
}

type FilterState = {
  status: string
  priority: string
  category: string
}

export default function ModeratorDashboard() {
  const [selectedTicket, setSelectedTicket] = useState<AssignedTicket | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [filters, setFilters] = useState<FilterState>({
    status: "ALL",
    priority: "ALL",
    category: "ALL",
  })

  const { data, error } = useQuery<assignedTicketsProps>({
    queryKey: ["assignedTickets"],
    queryFn: () => {
      return kyInstance.get("/api/mod").json<assignedTicketsProps>()
    },
  })

  const { mutate: updateStatus, isPending } = useUpdateTicketStatus()

  const assignedTickets = useMemo(() => data?.assignedTickets || [], [data])
  console.log("Assigned Tickets:", assignedTickets)

  // Get unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const categories = assignedTickets
      .map((ticket) => ticket.category)
      .filter((category, index, self) => category && self.indexOf(category) === index)
    return categories
  }, [assignedTickets])

  const filteredTickets = useMemo(() => {
    return assignedTickets.filter((ticket) => {
      const statusMatch = filters.status === "ALL" || ticket.status === filters.status
      const priorityMatch = filters.priority === "ALL" || ticket.priority === filters.priority
      const categoryMatch = filters.category === "ALL" || ticket.category === filters.category

      return statusMatch && priorityMatch && categoryMatch
    })
  }, [assignedTickets, filters])

  const moderatorStats = useMemo(() => {
    const totalAssigned = filteredTickets.length
    const inProgress = filteredTickets.filter((ticket) => ticket.status === "IN_PROGRESS").length
    const resolved = filteredTickets.filter((ticket) => ticket.status === "RESOLVED").length
    const rejected = filteredTickets.filter((ticket) => ticket.status === "REJECTED").length
    const pending = filteredTickets.filter((ticket) => ticket.status === "PENDING").length
    const completionRate = totalAssigned > 0 ? Math.round((resolved / totalAssigned) * 100) : 0

    return {
      totalAssigned,
      inProgress,
      resolved,
      rejected,
      pending,
      completionRate,
    }
  }, [filteredTickets])

  const pendingTickets = filteredTickets.filter((ticket) => ticket.status === "PENDING")
  const inProgressTickets = filteredTickets.filter((ticket) => ticket.status === "IN_PROGRESS")

  const getStatusBadge = (status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED") => {
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
    }
  }

  const getPriorityBadge = (priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT") => {
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

  const handleResolveTicket = async () => {
    if (!selectedTicket) return
    try {
      updateStatus({ ticketId: selectedTicket.id, status: "RESOLVED" })
      toast.success("Ticket resolved successfully!")
      setSelectedTicket(null)
    } catch (error) {
      toast.error("Failed to resolve ticket")
      console.error("Error resolving ticket:", error)
    }
  }

  const handleRejectTicket = async () => {
    if (!selectedTicket) return

    try {
      updateStatus({ ticketId: selectedTicket.id, status: "REJECTED" })
      toast.success("Ticket rejected")
      setSelectedTicket(null)
    } catch (error) {
      toast.error("Failed to reject ticket")
      console.error("Error rejecting ticket:", error)
    }
  }

  const handleStartWorking = async (ticketId: string) => {
    try {
      await makeTicketInProgress(ticketId, "IN_PROGRESS")
      setSelectedTicket(null)
      toast.success("Ticket is now in progress")
      window.location.reload() // Refresh the page to reflect changes
    } catch (error) {
      toast.error("Failed to update ticket status")
    }
  }

  const handleFilterChange = (filterType: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
  }

  const resetFilters = () => {
    setFilters({
      status: "ALL",
      priority: "ALL",
      category: "ALL",
    })
  }

  const hasActiveFilters = filters.status !== "ALL" || filters.priority !== "ALL" || filters.category !== "ALL"

  if (error) {
    console.error("Error fetching assigned tickets:", error)
    toast.error("Failed to load assigned tickets")
    return <div className="text-red-500">Failed to load assigned tickets</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Moderator Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your assigned tickets and help resolve user requests</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(filters).filter((f) => f !== "ALL").length} active
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Filter tickets by status, priority, and category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                <Label className="text-sm font-medium mb-2 block">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
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

              <div className="flex-1 min-w-[150px]">
                <Label className="text-sm font-medium mb-2 block">Priority</Label>
                <Select value={filters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
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

              <div className="flex-1 min-w-[150px]">
                <Label className="text-sm font-medium mb-2 block">Category</Label>
                <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
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

              {hasActiveFilters && (
                <Button variant="outline" onClick={resetFilters} className="flex items-center gap-2 bg-transparent">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </div>

            {hasActiveFilters && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  Showing {filteredTickets.length} of {assignedTickets.length} tickets
                  {filters.status !== "ALL" && ` • Status: ${filters.status}`}
                  {filters.priority !== "ALL" && ` • Priority: ${filters.priority}`}
                  {filters.category !== "ALL" && ` • Category: ${filters.category}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {hasActiveFilters ? "Filtered" : "Assigned"} Tickets
              </CardTitle>
              <Ticket className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moderatorStats.totalAssigned}</div>
              <p className="text-xs text-gray-500 mt-1">
                {hasActiveFilters ? "Matching filters" : "Currently assigned to you"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
              <Loader2 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moderatorStats.inProgress}</div>
              <p className="text-xs text-gray-500 mt-1">Active tickets</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moderatorStats.resolved}</div>
              <p className="text-xs text-gray-500 mt-1">Total resolved</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moderatorStats.completionRate}%</div>
              <p className="text-xs text-gray-500 mt-1">Success rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingTickets.length})</TabsTrigger>
            <TabsTrigger value="active">In Progress ({inProgressTickets.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Performance</CardTitle>
                  <CardDescription>Your ticket resolution statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Completion Rate</span>
                      <Badge className="bg-green-100 text-green-800">{moderatorStats.completionRate}%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tickets Resolved</span>
                      <span className="text-sm text-gray-600">{moderatorStats.resolved}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tickets Rejected</span>
                      <span className="text-sm text-gray-600">{moderatorStats.rejected}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Pending Tickets</span>
                      <span className="text-sm text-gray-600">{moderatorStats.pending}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveTab("pending")}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      View Pending Tickets ({pendingTickets.length})
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveTab("active")}
                    >
                      <Loader2 className="w-4 h-4 mr-2" />
                      Continue In Progress ({inProgressTickets.length})
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => {
                        const firstInProgressTicket = inProgressTickets[0]
                        if (firstInProgressTicket) {
                          setSelectedTicket(firstInProgressTicket)
                        } else {
                          toast.info("No tickets in progress to resolve")
                        }
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolve Tickets ({moderatorStats.inProgress})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* All Assigned Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Assigned Tickets</span>
                  {hasActiveFilters && (
                    <Badge variant="outline" className="text-sm">
                      {filteredTickets.length} of {assignedTickets.length} tickets
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {hasActiveFilters
                    ? "Filtered view of tickets assigned to you"
                    : "Overview of all tickets assigned to you"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTickets.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket) => (
                        <TableRow key={ticket.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="font-medium">{ticket.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.description}</div>
                          </TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ticket.category || "General"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => setSelectedTicket(ticket)}>
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    {hasActiveFilters ? (
                      <>
                        <p className="text-gray-500">No tickets match your filters</p>
                        <p className="text-sm text-gray-400 mb-4">Try adjusting your filter criteria</p>
                        <Button variant="outline" onClick={resetFilters}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset Filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500">No tickets assigned</p>
                        <p className="text-sm text-gray-400">You don&apos;t have any assigned tickets yet.</p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Tickets Tab */}
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pending Tickets</span>
                  {hasActiveFilters && (
                    <Badge variant="outline" className="text-sm">
                      {pendingTickets.length} filtered
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {hasActiveFilters
                    ? "Filtered pending tickets waiting for your attention"
                    : "Tickets waiting for your attention"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTickets.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingTickets.map((ticket) => (
                        <TableRow key={ticket.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="font-medium">{ticket.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.description}</div>
                          </TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ticket.category || "General"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {ticket.relatedSkills.slice(0, 2).map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {ticket.relatedSkills.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{ticket.relatedSkills.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedTicket(ticket)}>
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button size="sm" onClick={() => handleStartWorking(ticket.id)}>
                                Start
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    {hasActiveFilters ? (
                      <>
                        <p className="text-gray-500">No pending tickets match your filters</p>
                        <p className="text-sm text-gray-400 mb-4">Try adjusting your filter criteria</p>
                        <Button variant="outline" onClick={resetFilters}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset Filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500">No pending tickets</p>
                        <p className="text-sm text-gray-400">Great job! You&apos;re all caught up.</p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* In Progress Tickets Tab */}
          <TabsContent value="active" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>In Progress Tickets</span>
                  {hasActiveFilters && (
                    <Badge variant="outline" className="text-sm">
                      {inProgressTickets.length} filtered
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {hasActiveFilters
                    ? "Filtered tickets you're currently working on"
                    : "Tickets you're currently working on"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inProgressTickets.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inProgressTickets.map((ticket) => (
                        <TableRow key={ticket.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="font-medium">{ticket.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.description}</div>
                          </TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ticket.category || "General"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {new Date(ticket.updatedAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {ticket.relatedSkills.slice(0, 2).map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {ticket.relatedSkills.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{ticket.relatedSkills.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => setSelectedTicket(ticket)}>
                              <Eye className="w-3 h-3 mr-1" />
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Loader2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    {hasActiveFilters ? (
                      <>
                        <p className="text-gray-500">No in-progress tickets match your filters</p>
                        <p className="text-sm text-gray-400 mb-4">Try adjusting your filter criteria</p>
                        <Button variant="outline" onClick={resetFilters}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset Filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500">No tickets in progress</p>
                        <p className="text-sm text-gray-400">Start working on pending tickets to see them here.</p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <Dialog
            open={!!selectedTicket}
            onOpenChange={() => {
              setSelectedTicket(null)
            }}
          >
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Ticket Details
                </DialogTitle>
                <DialogDescription>Manage and resolve this ticket</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Ticket Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedTicket.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                      <Badge variant="outline">{selectedTicket.category || "General"}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-600">Created by</Label>
                      <div className="font-medium">Name: {selectedTicket.createdByName}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Created on</Label>
                      <div className="font-medium">{new Date(selectedTicket.createdAt).toLocaleDateString()}</div>
                      <div className="text-gray-500">{new Date(selectedTicket.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Description</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">{selectedTicket.description}</div>
                  </div>
                  {selectedTicket.relatedSkills.length > 0 && (
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
                  {selectedTicket.notes && (
                    <div>
                      <Label className="text-gray-600">Notes</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">{selectedTicket.notes}</div>
                    </div>
                  )}
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col gap-4">
                  {selectedTicket.status === "PENDING" && (
                    <Button
                      onClick={() => handleStartWorking(selectedTicket.id)}
                      className="w-full"
                      disabled={isPending}
                    >
                      <Loader2 className="w-4 h-4 mr-2" />
                      Start Working on This Ticket
                    </Button>
                  )}
                  {(selectedTicket.status === "IN_PROGRESS" || selectedTicket.status === "PENDING") && (
                    <div className="flex gap-3">
                      <Button
                        onClick={handleResolveTicket}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={isPending}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Resolving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Resolve Ticket
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleRejectTicket}
                        variant="destructive"
                        className="flex-1"
                        disabled={isPending}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject Ticket
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  {/* Show message for completed tickets */}
                  {(selectedTicket.status === "RESOLVED" || selectedTicket.status === "REJECTED") && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 text-gray-600">
                        {selectedTicket.status === "RESOLVED" ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span>This ticket has been resolved</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span>This ticket has been rejected</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
