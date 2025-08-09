"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Home, Plus, Minus, Clock, CheckCircle, AlertCircle, ChefHat, Utensils, QrCode } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { orderApi, menuApi, tableApi, categoryApi, type Order, type MenuItem, type Table, getQrCode } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

// Add a polling interval constant near the top of the component
const POLLING_INTERVAL = 3000 // Poll every 3 seconds

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [table, setTable] = useState<Table | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [menuItems, setMenuItems] = useState<Record<string, MenuItem[]>>({})
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([])
  const [isAddItemSheetOpen, setIsAddItemSheetOpen] = useState(false)
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false)
  const [currentCustomizeItem, setCurrentCustomizeItem] = useState<MenuItem | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { name: string; price: number }>>({})
  const [customizationPrice, setCustomizationPrice] = useState(0)
  const [cart, setCart] = useState<
    {
      id: string
      itemId: string
      name: string
      price: number
      quantity: number
      customOptions?: Record<string, { name: string; price: number }>
    }[]
  >([])
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)

  // Add a new state variable to track if we're refreshing data
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Add this function to find the QR code with any extension
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

  // Enhance the order status page to include a success message for new orders
  // Add this near the top of the component, after the useState declarations
  const [isNewOrder, setIsNewOrder] = useState(false)

  // Fetch order details on component mount
  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true)
      try {
        // Fetch order details
        const { order } = await orderApi.getOrder(orderId)
        setOrder(order)

        // Fetch table details if available
        if (order.table) {
          const tableId = typeof order.table === "string" ? order.table : order.table._id
          const { table } = await tableApi.getTable(tableId)
          setTable(table)
        }

        // Also fetch menu items for adding to order
        await fetchMenuItems()
      } catch (error) {
        console.error("Failed to fetch order details:", error)
        toast({
          title: "Error",
          description: "Failed to load order details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId, toast])

  // Add this to the useEffect that fetches order data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const { order } = await orderApi.getOrder(params.id)
        setOrder(order)

        // Check if this is a new order (created in the last minute)
        if (order.created_at) {
          const orderTime = new Date(order.created_at).getTime()
          const currentTime = new Date().getTime()
          const timeDiff = currentTime - orderTime
          // If order was created less than 60 seconds ago, show success message
          setIsNewOrder(timeDiff < 60000)
        }

        // Fetch table details if available
        if (order.table) {
          const tableId = typeof order.table === "string" ? order.table : order.table._id
          const { table } = await tableApi.getTable(tableId)
          setTable(table)
        }

        // Also fetch menu items for adding to order
        await fetchMenuItems()
      } catch (error) {
        console.error("Failed to fetch order details:", error)
        toast({
          title: "Error",
          description: "Failed to load order details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id, toast])

  // Add this useEffect for polling after the existing useEffect that fetches order details
  useEffect(() => {
    // Don't set up polling until we have the initial order data
    if (!order || order.status === "complete" || order.status === "cancelled") {
      return
    }

    // Set up polling interval
    const intervalId = setInterval(async () => {
      try {
        setIsRefreshing(true)
        // Fetch latest order data
        const { order: latestOrder } = await orderApi.getOrder(orderId)

        // Only update state if status has changed
        if (latestOrder.status !== order.status) {
          console.log(`Order status changed from ${order.status} to ${latestOrder.status}`)
          setOrder(latestOrder)

          // Show a toast notification about the status change
          toast({
            title: "Order Status Updated",
            description: `Your order status is now: ${latestOrder.status.charAt(0).toUpperCase() + latestOrder.status.slice(1)}`,
          })
        }
      } catch (error) {
        console.error("Failed to refresh order status:", error)
        // Don't show error toast to avoid disrupting the user experience
      } finally {
        setIsRefreshing(false)
      }
    }, POLLING_INTERVAL)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [order, orderId, toast])

  // Add this useEffect to fetch the QR code when dialog opens
  useEffect(() => {
    if (!isQrDialogOpen) return

    const fetchQrCode = async () => {
      try {
        const result = await getQrCode()

        if (result.success && result.imageUrl) {
          setQrCodeUrl(result.imageUrl)
        } else {
          // Fallback to generic QR code if no custom one is found
          setQrCodeUrl(
            `/generic-payment-qr.png?height=200&width=200&query=QR code for payment of Rs${order?.total_amount.toFixed(2)}`,
          )
        }
      } catch (error) {
        console.error("Error fetching QR code:", error)
        // Fallback to generic QR code on error
        setQrCodeUrl(
          `/generic-payment-qr.png?height=200&width=200&query=QR code for payment of Rs${order?.total_amount.toFixed(2)}`,
        )
      }
    }

    fetchQrCode()
  }, [isQrDialogOpen, order?.total_amount])

  // Fetch menu items for adding to order
  const fetchMenuItems = async () => {
    try {
      // Fetch categories
      const categoriesResponse = await categoryApi.getAllCategories()
      setCategories(
        categoriesResponse.categories.map((category: any) => ({
          _id: category._id,
          name: category.name,
        })),
      )

      // Fetch menu items
      const { menuItems } = await menuApi.getAllItems()

      // Group items by category
      const groupedItems: Record<string, MenuItem[]> = {}
      const uncategorizedId = "uncategorized"

      menuItems.forEach((item) => {
        // Skip unavailable items
        if (item.is_available === false) return

        if (!item.category) {
          // Handle items with null category
          if (!groupedItems[uncategorizedId]) {
            groupedItems[uncategorizedId] = []
          }
          groupedItems[uncategorizedId].push({
            ...item,
            category: {
              _id: uncategorizedId,
              name: "Uncategorized",
            },
          })
        } else {
          // Handle items with valid category
          const categoryId = typeof item.category === "string" ? item.category : item.category._id
          if (!groupedItems[categoryId]) {
            groupedItems[categoryId] = []
          }
          groupedItems[categoryId].push(item)
        }
      })

      setMenuItems(groupedItems)
    } catch (error) {
      console.error("Failed to fetch menu items:", error)
      toast({
        title: "Error",
        description: "Failed to load menu items. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-6 w-6 text-orange-500" />
      case "preparing":
        return <ChefHat className="h-6 w-6 text-yellow-500" />
      case "served":
        return <Utensils className="h-6 w-6 text-blue-500" />
      case "complete":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "cancelled":
        return <AlertCircle className="h-6 w-6 text-red-500" />
      default:
        return <Clock className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Your order has been received and is waiting to be processed."
      case "preparing":
        return "Our chefs are preparing your delicious food."
      case "served":
        return "Your food has been served. Enjoy your meal!"
      case "complete":
        return "Your order has been completed. Thank you for dining with us!"
      case "cancelled":
        return "This order has been cancelled."
      default:
        return "Order status unknown."
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "preparing":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "served":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "complete":
        return "bg-green-100 text-green-800 border-green-300"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getTableNumber = () => {
    if (!order) return "Unknown Table"

    if (typeof order.table === "string") {
      return table ? `Table ${table.table_number}` : order.table
    }

    return `Table ${order.table.table_number}`
  }

  // Functions for adding items to order
  const openCustomizeDialog = (item: MenuItem) => {
    setCurrentCustomizeItem(item)
    setSelectedOptions({})
    setCustomizationPrice(0)
    setIsCustomizeDialogOpen(true)
  }

  const handleOptionSelect = (groupName: string, option: { name: string; price_addition: number }) => {
    setSelectedOptions((prev) => {
      const newOptions = {
        ...prev,
        [groupName]: {
          name: option.name,
          price: option.price_addition,
        },
      }

      // Recalculate total customization price
      let totalCustomPrice = 0
      Object.values(newOptions).forEach((option) => {
        totalCustomPrice += option.price
      })

      setCustomizationPrice(totalCustomPrice)
      return newOptions
    })
  }

  // Add this function to handle adding items to cart
  const addToCart = (
    item: MenuItem,
    customOptions?: Record<string, { name: string; price: number }>,
    additionalPrice = 0,
  ) => {
    setCart((prev) => {
      const cartItemId = customOptions ? `${item._id}-${JSON.stringify(customOptions)}` : item._id
      const existingItemIndex = prev.findIndex((cartItem) => cartItem.id === cartItemId)

      if (existingItemIndex >= 0) {
        // Item with same customizations exists, update quantity
        const updatedCart = [...prev]
        updatedCart[existingItemIndex].quantity += 1
        return updatedCart
      } else {
        // Add new item with customizations
        return [
          ...prev,
          {
            id: cartItemId,
            itemId: item._id,
            name: item.name,
            price: item.price + additionalPrice,
            quantity: 1,
            customOptions: customOptions || {},
          },
        ]
      }
    })
  }

  const addCustomizedItemToCart = () => {
    if (!currentCustomizeItem) return

    addToCart(currentCustomizeItem, selectedOptions, customizationPrice)
    setIsCustomizeDialogOpen(false)
  }

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === cartItemId)
      if (existingItem && existingItem.quantity > 1) {
        return prev.map((item) => (item.id === cartItemId ? { ...item, quantity: item.quantity - 1 } : item))
      } else {
        return prev.filter((item) => item.id !== cartItemId)
      }
    })
  }

  // Update the order with new items
  const updateOrder = async () => {
    if (!order || cart.length === 0) return

    setIsUpdating(true)
    try {
      // Prepare order items with customizations
      const newOrderItems = cart.map((item) => {
        // Convert customOptions from Record to array of objects with option_name, selection, and price_addition
        const customizations = Object.entries(item.customOptions || {}).map(([group, option]) => ({
          option_name: group,
          selection: option.name,
          price_addition: option.price,
        }))

        return {
          item: item.itemId,
          quantity: item.quantity,
          price: item.price,
          customizations: customizations,
        }
      })

      // Calculate total amount for new items
      const newItemsTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

      // Combine existing items with new items
      const updatedItems = [...order.items, ...newOrderItems]

      // Calculate new total
      const updatedTotal = order.total_amount + newItemsTotal

      // First update the order items and total
      const updateData = {
        items: updatedItems,
        total_amount: updatedTotal,
      }

      const { order: updatedOrder } = await orderApi.updateOrder(order._id, updateData)

      // If order was already served, change status back to pending with a separate API call
      if (order.status === "served") {
        const statusUpdateData = {
          status: "pending",
        }

        const { order: statusUpdatedOrder } = await orderApi.updateOrderStatus(order._id, statusUpdateData)

        // Update the local state with the status-updated order
        setOrder(statusUpdatedOrder)

        // Show success message with status change notification
        toast({
          title: "Order Updated",
          description: "Your order has been updated and sent back to the kitchen for preparation.",
        })
      } else {
        // Update local state with the updated order
        setOrder(updatedOrder)

        // Show regular success message
        toast({
          title: "Order Updated",
          description: "Your order has been updated successfully!",
        })
      }

      // Clear cart
      setCart([])

      // Close sheet
      setIsAddItemSheetOpen(false)
    } catch (error) {
      console.error("Failed to update order:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p>Loading order details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
        <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" /> Return Home
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl">FoodEase</span>
            </Link>
          </div>
        </div>
      </header>
      {isNewOrder && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-700 font-medium">Your order has been placed successfully!</p>
          </div>
          <p className="text-green-600 mt-1 text-sm">
            Your order is being prepared. Please wait at your table and our staff will serve you shortly.
          </p>
        </div>
      )}
      <main className="flex-1 container py-8">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Order Details</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Order Summary */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Order #{order.order_number}</CardTitle>
                    <CardDescription>{getTableNumber()}</CardDescription>
                  </div>
                  <Badge variant="outline" className={`px-3 py-1 ${getStatusClass(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4 p-4 rounded-lg border bg-muted/30">
                  {getStatusIcon(order.status)}
                  <p className="ml-3">{getStatusText(order.status)}</p>
                </div>

                {/* Payment Method Badge */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <div className="flex items-center mt-1">
                    <Badge
                      variant="outline"
                      className={
                        order.payment_method === "online_payment"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-green-100 text-green-800 border-green-300"
                      }
                    >
                      {order.payment_method === "online_payment" ? "QR Code Payment" : "Cash Payment"}
                    </Badge>

                    {order.payment_method === "online_payment" && (
                      <Button variant="ghost" size="sm" className="ml-2" onClick={() => setIsQrDialogOpen(true)}>
                        <QrCode className="h-4 w-4 mr-1" /> View QR
                      </Button>
                    )}
                  </div>
                </div>

                {/* Payment Status Badge */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge
                    variant="outline"
                    className={
                      order.payment_status === "paid"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-yellow-100 text-yellow-800 border-yellow-300"
                    }
                  >
                    {order.payment_status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </div>

                <Separator className="my-4" />

                <h3 className="font-medium mb-3">Order Items</h3>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {typeof item.item === "string" ? item.item : item.item.name} × {item.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">Rs{item.price.toFixed(2)}</p>

                        {/* Display customizations if any */}
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.customizations.map((customization, idx) => (
                              <div key={idx}>
                                {customization.option_name}: {customization.selection}
                                {customization.price_addition > 0 && ` (+Rs${customization.price_addition.toFixed(2)})`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="font-medium">Rs{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>Rs{order.total_amount.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                {order.status !== "complete" && order.status !== "cancelled" && (
                  <Button className="w-full" onClick={() => setIsAddItemSheetOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add More Items
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Order Status */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div
                    className={`flex items-center ${order.status === "pending" || order.status === "preparing" || order.status === "served" || order.status === "complete" ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <div
                      className={`rounded-full p-1 mr-3 ${order.status === "pending" || order.status === "preparing" || order.status === "served" || order.status === "complete" ? "bg-green-100" : "bg-muted"}`}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Order Received</p>
                      <p className="text-xs text-muted-foreground">Your order has been received</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center ${order.status === "preparing" || order.status === "served" || order.status === "complete" ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <div
                      className={`rounded-full p-1 mr-3 ${order.status === "preparing" || order.status === "served" || order.status === "complete" ? "bg-green-100" : "bg-muted"}`}
                    >
                      <ChefHat className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Preparing</p>
                      <p className="text-xs text-muted-foreground">Your food is being prepared</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center ${order.status === "served" || order.status === "complete" ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <div
                      className={`rounded-full p-1 mr-3 ${order.status === "served" || order.status === "complete" ? "bg-green-100" : "bg-muted"}`}
                    >
                      <Utensils className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Served</p>
                      <p className="text-xs text-muted-foreground">Your food has been served</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center ${order.status === "complete" ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <div
                      className={`rounded-full p-1 mr-3 ${order.status === "complete" ? "bg-green-100" : "bg-muted"}`}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Completed</p>
                      <p className="text-xs text-muted-foreground">Your order has been completed</p>
                    </div>
                  </div>

                  {order.status === "cancelled" && (
                    <div className="flex items-center text-red-600">
                      <div className="rounded-full p-1 mr-3 bg-red-100">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Cancelled</p>
                        <p className="text-xs text-muted-foreground">Your order has been cancelled</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2024 FoodEase. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Add Items Sheet */}
      <Sheet open={isAddItemSheetOpen} onOpenChange={setIsAddItemSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Items to Your Order</SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            <Tabs defaultValue={categories.length > 0 ? categories[0]?._id : "uncategorized"}>
              <TabsList className="mb-4 flex w-full overflow-x-auto">
                {categories.map((category) => (
                  <TabsTrigger key={category._id} value={category._id} className="flex-1">
                    {category.name}
                  </TabsTrigger>
                ))}
                {menuItems["uncategorized"] && menuItems["uncategorized"].length > 0 && (
                  <TabsTrigger key="uncategorized" value="uncategorized" className="flex-1">
                    Other Items
                  </TabsTrigger>
                )}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category._id} value={category._id} className="space-y-4">
                  {!menuItems[category._id] || menuItems[category._id].length === 0 ? (
                    <div className="text-center p-4 border rounded-md">
                      <p className="text-muted-foreground">No items in this category</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {menuItems[category._id]?.map((item) => (
                        <Card key={item._id} className="overflow-hidden">
                          <div className="flex items-center p-4">
                            <div className="flex-1">
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                              <p className="font-bold mt-1">Rs{item.price.toFixed(2)}</p>
                            </div>
                            <div className="ml-4">
                              <Button
                                onClick={() => {
                                  if (item.customization_options && item.customization_options.length > 0) {
                                    openCustomizeDialog(item)
                                  } else {
                                    addToCart(item)
                                  }
                                }}
                                size="sm"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}

              {menuItems["uncategorized"] && menuItems["uncategorized"].length > 0 && (
                <TabsContent key="uncategorized" value="uncategorized" className="space-y-4">
                  <div className="space-y-4">
                    {menuItems["uncategorized"]?.map((item) => (
                      <Card key={item._id} className="overflow-hidden">
                        <div className="flex items-center p-4">
                          <div className="flex-1">
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                            <p className="font-bold mt-1">Rs{item.price.toFixed(2)}</p>
                          </div>
                          <div className="ml-4">
                            <Button
                              onClick={() => {
                                if (item.customization_options && item.customization_options.length > 0) {
                                  openCustomizeDialog(item)
                                } else {
                                  addToCart(item)
                                }
                              }}
                              size="sm"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Cart Section */}
          <div className="mt-6 border-t pt-6">
            <h3 className="font-medium mb-4">Items to Add</h3>
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Your cart is empty</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Rs{item.price.toFixed(2)} x {item.quantity}
                      </p>
                      {Object.keys(item.customOptions || {}).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {Object.entries(item.customOptions || {}).map(([group, option]) => (
                            <div key={group}>
                              {group}: {option.name} {option.price > 0 && `(+Rs${option.price.toFixed(2)})`}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Button variant="outline" size="icon" onClick={() => removeFromCart(item.id)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          // Find the original menu item
                          const menuItem = Object.values(menuItems)
                            .flat()
                            .find((mi) => mi._id === item.itemId)

                          if (menuItem) {
                            if (item.customOptions && Object.keys(item.customOptions).length > 0) {
                              // For customized items, just increment quantity
                              addToCart(menuItem, item.customOptions, item.price - menuItem.price)
                            } else {
                              // For regular items
                              addToCart(menuItem)
                            }
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Separator className="my-4" />

                <div className="flex justify-between font-bold">
                  <span>Total to Add</span>
                  <span>Rs{totalCartPrice.toFixed(2)}</span>
                </div>

                <Button className="w-full mt-4" onClick={updateOrder} disabled={cart.length === 0 || isUpdating}>
                  {isUpdating
                    ? "Updating Order..."
                    : `Add ${totalCartItems} Item${totalCartItems !== 1 ? "s" : ""} to Order`}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Customize Dialog */}
      <Dialog open={isCustomizeDialogOpen} onOpenChange={setIsCustomizeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Customize Your Order</DialogTitle>
            <DialogDescription>{currentCustomizeItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Display base price and current total at the top */}
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Base price:</span>
              <span>Rs{currentCustomizeItem?.price.toFixed(2)}</span>
            </div>

            {currentCustomizeItem?.customization_options?.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-2">
                <h3 className="font-medium">{group.name}</h3>
                <div className="grid gap-2">
                  {group.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`option-${groupIndex}-${optionIndex}`}
                          name={`group-${groupIndex}`}
                          checked={selectedOptions[group.name]?.name === option.name}
                          onChange={() => handleOptionSelect(group.name, option)}
                          className="h-4 w-4 rounded-full"
                        />
                        <label htmlFor={`option-${groupIndex}-${optionIndex}`} className="text-sm">
                          {option.name}
                        </label>
                      </div>
                      {option.price_addition > 0 && (
                        <span className="text-sm text-muted-foreground">+Rs{option.price_addition.toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Display the current total price prominently */}
            <div className="mt-4 pt-4 border-t">
              {customizationPrice > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Additional cost:</span>
                  <span>Rs{customizationPrice.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-lg mt-1">
                <span>Total price:</span>
                <span>Rs{((currentCustomizeItem?.price || 0) + customizationPrice).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomizeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addCustomizedItemToCart}>Add to Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>QR Code Payment</DialogTitle>
            <DialogDescription>Scan this QR code to pay for your order</DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center">
            <div className="border p-4 rounded-md bg-white">
              {qrCodeUrl && (
                <Image
                  src={qrCodeUrl || "/placeholder.svg"}
                  alt="Payment QR Code"
                  width={200}
                  height={200}
                  className="mx-auto"
                  unoptimized // Important to allow dynamic URLs
                />
              )}
            </div>
            <div className="mt-4 text-center">
              <p className="font-medium">Total Amount: Rs{order.total_amount.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-2">
                After payment, please show the confirmation to the waiter
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQrDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}