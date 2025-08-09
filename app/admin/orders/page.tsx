"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { Eye, MoreHorizontal, Search, Trash, CreditCard, QrCode } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { orderApi, tableApi, type Order, type OrderStatusInput } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import React from "react"
import { Badge } from "@/components/ui/badge"

// Add a polling interval constant near the top of the component
const POLLING_INTERVAL = 5000 // Poll every 5 seconds

export default function AdminOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<{ _id: string; table_number: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tableFilter, setTableFilter] = useState("all")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [currentOrderDetails, setCurrentOrderDetails] = useState<Order | null>(null)
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false)
  // Add this state variable with the other state declarations
  const [isPolling, setIsPolling] = useState(false)

  // Fetch orders and tables on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch tables for the filter dropdown
        const tablesResponse = await tableApi.getAllTables()
        setTables(
          tablesResponse.tables.map((table) => ({
            _id: table._id,
            table_number: table.table_number,
          })),
        )

        // Fetch orders
        await fetchOrders()
      } catch (error) {
        console.error("Failed to fetch initial data:", error)
        toast({
          title: "Error",
          description: "Failed to load initial data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Add this useEffect for polling after the existing useEffect that fetches initial data
  useEffect(() => {
    // Don't set up polling until we have the initial orders data
    if (isLoading) {
      return
    }

    // Set up polling interval
    const intervalId = setInterval(async () => {
      try {
        setIsPolling(true)

        // Fetch orders based on current filters
        let ordersData: { orders: Order[] }

        if (statusFilter !== "all" && statusFilter) {
          // Fetch orders by status
          ordersData = await orderApi.getOrdersByStatus(statusFilter)
        } else if (tableFilter !== "all" && tableFilter) {
          // Fetch orders by table
          ordersData = await orderApi.getOrdersByTable(tableFilter)
        } else {
          // Fetch all orders
          ordersData = await orderApi.getAllOrders()
        }

        // Sort orders by creation date (newest first)
        const sortedOrders = [...ordersData.orders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

        // Check if there are any changes in orders
        const currentOrderIds = orders.map((order) => order._id).join(",")
        const newOrderIds = sortedOrders.map((order) => order._id).join(",")

        // Only update state if there are changes (new orders, status changes, etc.)
        if (currentOrderIds !== newOrderIds || JSON.stringify(orders) !== JSON.stringify(sortedOrders)) {
          setOrders(sortedOrders)

          // Show a subtle notification about the update
          toast({
            title: "Orders Updated",
            description: "Order list has been refreshed with the latest data.",
            variant: "default",
          })
        }
      } catch (error) {
        console.error("Failed to refresh orders:", error)
        // Don't show error toast to avoid disrupting the user experience
      } finally {
        setIsPolling(false)
      }
    }, POLLING_INTERVAL)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [isLoading, statusFilter, tableFilter, orders, toast])

  // Fetch orders based on filters
  const fetchOrders = async () => {
    try {
      let ordersData: { orders: Order[] }

      if (statusFilter !== "all" && statusFilter) {
        // Fetch orders by status
        ordersData = await orderApi.getOrdersByStatus(statusFilter)
      } else if (tableFilter !== "all" && tableFilter) {
        // Fetch orders by table
        ordersData = await orderApi.getOrdersByTable(tableFilter)
      } else {
        // Fetch all orders
        ordersData = await orderApi.getAllOrders()
      }

      // Add this inside the fetchOrders function, right after getting the orders data
      console.log("Orders from API:", ordersData.orders)

      // Sort orders by creation date (newest first)
      const sortedOrders = [...ordersData.orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )

      setOrders(sortedOrders)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Apply filters when they change
  useEffect(() => {
    if (!isLoading) {
      fetchOrders()
    }
  }, [statusFilter, tableFilter, isLoading])

  // Update the getTableNumber function to handle null/deleted tables
  const getTableNumber = (table: Table | string | undefined | null) => {
    if (!table) return "Table Deleted"
    if (typeof table === "string") {
      const foundTable = tables.find((t) => t._id === table)
      return foundTable ? `Table ${foundTable.table_number}` : "Table Deleted"
    }
    return `Table ${table.table_number}`
  }

  // Update the filter orders function to handle null tables
  const filteredOrders = orders.filter((order) => {
    const orderNumber = order.order_number.toLowerCase()
    const orderId = order._id.toLowerCase()
    let tableInfo = "Table Deleted"

    if (order.table) {
      tableInfo = typeof order.table === "string" ? order.table : `Table ${order.table.table_number}`
    }

    return (
      orderNumber.includes(searchTerm.toLowerCase()) ||
      orderId.includes(searchTerm.toLowerCase()) ||
      tableInfo.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Update the handleUpdateStatus function to also update payment status when order is marked complete
  const handleUpdateStatus = async () => {
    if (!currentOrder) return

    try {
      const statusData: OrderStatusInput = {
        status: currentOrder.status as "pending" | "preparing" | "served" | "complete" | "cancelled",
      }

      await orderApi.updateOrderStatus(currentOrder._id, statusData)

      // If the order is being marked as complete, also update the payment status to paid
      if (currentOrder.status === "complete" && currentOrder.payment_status !== "paid") {
        // Create a partial order update with just the payment status
        const updateData = {
          payment_status: "paid",
        }

        await orderApi.updateOrder(currentOrder._id, updateData)

        toast({
          title: "Success",
          description: "Order status updated and payment marked as paid",
        })
      } else {
        toast({
          title: "Success",
          description: "Order status updated successfully",
        })
      }

      // Refresh orders
      fetchOrders()

      setIsStatusDialogOpen(false)
    } catch (error) {
      console.error("Failed to update order status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  // Update payment status
  const handleUpdatePaymentStatus = async () => {
    if (!currentOrder) return

    try {
      // Create a partial order update with just the payment status
      const updateData = {
        payment_status: currentOrder.payment_status === "pending" ? "paid" : "pending",
      }

      await orderApi.updateOrder(currentOrder._id, updateData)

      toast({
        title: "Success",
        description: "Payment status updated successfully",
      })

      // Refresh orders
      fetchOrders()

      setIsPaymentDialogOpen(false)
    } catch (error) {
      console.error("Failed to update payment status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update payment status",
        variant: "destructive",
      })
    }
  }

  // Delete an order
  const handleDeleteOrder = async () => {
    if (!currentOrder) return

    try {
      await orderApi.deleteOrder(currentOrder._id)

      toast({
        title: "Success",
        description: "Order deleted successfully",
      })

      // Refresh orders
      fetchOrders()

      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Failed to delete order:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete order",
        variant: "destructive",
      })
    }
  }

  const openViewDialog = async (order: Order) => {
    setCurrentOrder(order)
    setCurrentOrderDetails(null) // Initialize to null
    setIsLoadingOrderDetails(true)

    try {
      // Fetch detailed order information to get full customization details
      const { order: orderDetails } = await orderApi.getOrder(order._id)
      console.log("Detailed order:", orderDetails)
      setCurrentOrderDetails(orderDetails)
    } catch (error) {
      console.error("Failed to fetch order details:", error)
      setCurrentOrderDetails(order)
    } finally {
      setIsLoadingOrderDetails(false)
      setIsViewDialogOpen(true)
    }
  }

  const openStatusDialog = (order: Order) => {
    setCurrentOrder(order)
    setIsStatusDialogOpen(true)
  }

  const openPaymentDialog = (order: Order) => {
    setCurrentOrder(order)
    setIsPaymentDialogOpen(true)
  }

  const openDeleteDialog = (order: Order) => {
    setCurrentOrder(order)
    setIsDeleteDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800"
      case "served":
        return "bg-blue-100 text-blue-800"
      case "preparing":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "cash":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
            <CreditCard className="h-3 w-3" /> Cash
          </Badge>
        )
      case "online_payment":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
            <QrCode className="h-3 w-3" /> QR Code
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
            Unknown
          </Badge>
        )
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Paid
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Pending
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
            Unknown
          </Badge>
        )
    }
  }

  const getTableNumberDisplay = (table: Table | string | undefined) => {
    if (!table) return "Unknown Table"
    if (typeof table === "string") {
      const foundTable = tables.find((t) => t._id === table)
      return foundTable ? `Table ${foundTable.table_number}` : table
    }
    return `Table ${table.table_number}`
  }

  // Replace the inferSelectedCustomizations function with this updated version
  const displayCustomizations = (item: any) => {
    // If there are no customizations, return null
    if (!item.customizations || !item.customizations.length) {
      return null
    }

    // Display the actual customizations from the database
    return (
      <div className="text-xs text-muted-foreground pl-4">
        <p className="font-medium mb-1">Customizations:</p>
        <ul className="space-y-1">
          {item.customizations.map((customization: any, index: number) => (
            <li key={index}>
              {customization.option_name}: <span className="font-medium">{customization.selection}</span>
              {customization.price_addition > 0 && (
                <span className="text-xs ml-1">(+Rs{customization.price_addition.toFixed(2)})</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground">View and manage customer orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="served">Served</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by table" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tables</SelectItem>
            {tables.map((table) => (
              <SelectItem key={table._id} value={table._id}>
                Table {table.table_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Orders</CardTitle>
              <CardDescription>Showing {filteredOrders.length} orders</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <p>Loading orders...</p>
                </div>
              ) : (
                <Table>
                  {/* Add this to the Table component to show a loading indicator during polling */}
                  {/* Find the TableHeader component and add this after the Actions column */}
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      // In the TableRow mapping, add a null check for order.table
                      filteredOrders.map((order) => (
                        // Also add the same column to the TableRow to maintain alignment
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">{order._id}</TableCell>
                          <TableCell>{getTableNumberDisplay(order.table)}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>Rs{order.total_amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(order.status)}`}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getPaymentMethodBadge(order.payment_method || "cash")}
                              {getPaymentStatusBadge(order.payment_status || "pending")}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openViewDialog(order)}>
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openStatusDialog(order)}>
                                  <Eye className="mr-2 h-4 w-4" /> Update Status
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPaymentDialog(order)}>
                                  <CreditCard className="mr-2 h-4 w-4" /> Update Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDeleteDialog(order)}>
                                  <Trash className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Orders</CardTitle>
              <CardDescription>Orders placed today</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-4">
                Filter implementation would show today's orders here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>This Week's Orders</CardTitle>
              <CardDescription>Orders placed this week</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-4">
                Filter implementation would show this week's orders here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {currentOrderDetails?._id} - {currentOrderDetails && getTableNumberDisplay(currentOrderDetails.table)}
            </DialogDescription>
          </DialogHeader>
          {isLoadingOrderDetails ? (
            <div className="py-8 text-center">
              <p>Loading order details...</p>
            </div>
          ) : (
            <div className="py-4">
              {currentOrderDetails && (
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p>{formatDate(currentOrderDetails.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(currentOrderDetails.status)}`}
                    >
                      {currentOrderDetails.status.charAt(0).toUpperCase() + currentOrderDetails.status.slice(1)}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              {currentOrderDetails && (
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    {getPaymentMethodBadge(currentOrderDetails.payment_method || "cash")}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    {getPaymentStatusBadge(currentOrderDetails.payment_status || "pending")}
                  </div>
                </div>
              )}

              {currentOrderDetails && (
                <div className="border rounded-md p-4 mb-4">
                  <h3 className="font-medium mb-2">Order Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentOrderDetails.items.map((item, index) => (
                        <React.Fragment key={index}>
                          <TableRow>
                            <TableCell>{typeof item.item === "string" ? item.item : item.item.name}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {item.price !== undefined ? `Rs${item.price.toFixed(2)}` : "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.price !== undefined ? `Rs${(item.quantity * item.price).toFixed(2)}` : `Rs${0}`}
                            </TableCell>
                          </TableRow>
                          {item.customizations && item.customizations.length > 0 && (
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={4} className="py-1">
                                {displayCustomizations(item)}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-between font-medium mt-4 pt-4 border-t">
                    <span>Total</span>
                    <span>Rs{currentOrderDetails.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      {console.log("Current order status:", currentOrder?.status)}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>Change the status of order {currentOrder?._id}</DialogDescription>
          </DialogHeader>
          {currentOrder && (
            <div className="py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={currentOrder.status}
                    onValueChange={(value: "pending" | "preparing" | "served" | "complete" | "cancelled") =>
                      setCurrentOrder({ ...currentOrder, status: value })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="served">Served</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {currentOrder.status === "complete" && (
                  <p className="text-sm text-amber-600">
                    {console.log("Showing note for complete status")}
                    Note: Setting status to "Complete" will mark the table as available.
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Status Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Status</DialogTitle>
            <DialogDescription>Change the payment status of order {currentOrder?.order_number}</DialogDescription>
          </DialogHeader>
          {currentOrder && (
            <div className="py-4">
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <div className="mt-1">{getPaymentMethodBadge(currentOrder.payment_method || "cash")}</div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Current Payment Status</p>
                  <div className="mt-1">{getPaymentStatusBadge(currentOrder.payment_status || "pending")}</div>
                </div>

                <div className="pt-2">
                  <p className="font-medium">
                    Mark payment as {currentOrder.payment_status === "pending" ? "Paid" : "Pending"}?
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will update the payment status for this order.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePaymentStatus}>
              Mark as {currentOrder?.payment_status === "pending" ? "Paid" : "Pending"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {currentOrder && (
            <div className="py-4">
              <p>
                <strong>Order:</strong> {currentOrder._id}
              </p>
              <p>
                <strong>Table:</strong> {getTableNumberDisplay(currentOrder.table)}
              </p>
              <p>
                <strong>Total:</strong> Rs{currentOrder.total_amount.toFixed(2)}
              </p>
              <p>
                <strong>Status:</strong> {currentOrder.status}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
