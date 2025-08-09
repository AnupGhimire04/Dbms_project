// Base URL for API requests
const API_BASE_URL = "http://localhost:5000/api/v1"
// const API_BASE_URL = "https://digital-menu-backend-8a4t.onrender.com/api/v1"

// Default fetch options
const defaultOptions: RequestInit = {
  credentials: "include", // Always include credentials for cookies
  headers: {
    "Content-Type": "application/json",
  },
}

// Generic API request function
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  // Don't set Content-Type for FormData requests
  const isFormData = options.body instanceof FormData

  const headers = isFormData
    ? { ...options.headers } // Don't include Content-Type for FormData
    : {
        ...defaultOptions.headers,
        ...options.headers,
      }

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers,
  })

  // Handle non-2xx responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.msg || `API request failed with status ${response.status}`)
  }

  // Parse JSON response
  return await response.json()
}

// Auth-specific API functions
export const authApi = {
  login: async (username: string, password: string) => {
    return apiRequest<{ user: { name: string; username: string; role: string }; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
  },

  // Change the logout method to GET
  logout: async () => {
    return apiRequest<{ msg: string }>("/auth/logout", {
      method: "GET",
    })
  },

  getCurrentUser: async () => {
    return apiRequest<{ user: { name: string; username: string; role: string } }>("/auth/me")
  },
}

// Menu item type definition based on backend model
export interface MenuItem {
  _id: string
  name: string
  description: string
  price: number
  category: {
    _id: string
    name: string
  }
  image_url?: string
  customization_options?: Array<{
    name: string
    options: Array<{
      name: string
      price_addition: number
    }>
  }>
  is_available?: boolean
}

// Menu item input for create/update operations
export interface MenuItemInput {
  name: string
  description: string
  price: number
  category: string // Category ID
  image_url?: string
  customization_options?: Array<{
    name: string
    options: Array<{
      name: string
      price_addition: number
    }>
  }>
  is_available?: boolean
}

// Menu-specific API functions
export const menuApi = {
  // Get all menu items
  getAllItems: async (): Promise<{ menuItems: MenuItem[]; count: number }> => {
    return apiRequest("/menu")
  },

  // Create a new menu item
  createItem: async (menuItem: MenuItemInput): Promise<{ menuItem: MenuItem }> => {
    return apiRequest("/menu", {
      method: "POST",
      body: JSON.stringify(menuItem),
    })
  },

  // Get a single menu item by ID
  getItem: async (id: string): Promise<{ menuItem: MenuItem }> => {
    return apiRequest(`/menu/${id}`)
  },

  // Update a menu item
  updateItem: async (id: string, menuItem: Partial<MenuItemInput>): Promise<{ menuItem: MenuItem }> => {
    return apiRequest(`/menu/${id}`, {
      method: "PATCH",
      body: JSON.stringify(menuItem),
    })
  },

  // Delete a menu item
  deleteItem: async (id: string): Promise<{ msg: string }> => {
    return apiRequest(`/menu/${id}`, {
      method: "DELETE",
    })
  },

  // Get items by category
  getItemsByCategory: async (categoryId: string): Promise<{ menuItems: MenuItem[]; count: number }> => {
    return apiRequest(`/menu/category/${categoryId}`)
  },

  // Upload an image for a menu item
  uploadImage: async (id: string, imageFile: File): Promise<{ menuItem: MenuItem }> => {
    const formData = new FormData()
    formData.append("image", imageFile)

    // Log the FormData to debug
    console.log("Uploading image with FormData:", formData)

    // For debugging, log the keys in the FormData
    for (const pair of formData.entries()) {
      console.log(`FormData contains: ${pair[0]}, ${pair[1]}`)
    }

    return apiRequest(`/menu/image/${id}`, {
      method: "PATCH",
      body: formData,
      // Don't set any Content-Type header, let the browser handle it
      headers: {},
    })
  },
}

// Category type definition based on backend model
export interface Category {
  _id: string
  name: string
  description?: string
  display_order?: number
  thumbnail_url?: string
}

// Category input for create/update operations
export interface CategoryInput {
  name: string
  description?: string
  display_order?: number
}

// Category-specific API functions
export const categoryApi = {
  // Get all categories
  getAllCategories: async (): Promise<{ categories: Category[]; count: number }> => {
    return apiRequest("/categories")
  },

  // Create a new category
  createCategory: async (category: CategoryInput): Promise<{ category: Category }> => {
    return apiRequest("/categories", {
      method: "POST",
      body: JSON.stringify(category),
    })
  },

  // Get a single category by ID
  getCategory: async (id: string): Promise<{ category: Category }> => {
    return apiRequest(`/categories/${id}`)
  },

  // Update a category
  updateCategory: async (id: string, category: Partial<CategoryInput>): Promise<{ category: Category }> => {
    return apiRequest(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(category),
    })
  },

  // Delete a category
  deleteCategory: async (id: string): Promise<{ msg: string }> => {
    return apiRequest(`/categories/${id}`, {
      method: "DELETE",
    })
  },

  // Upload an image for a category
  uploadCategoryImage: async (id: string, imageFile: File): Promise<{ cat: Category }> => {
    const formData = new FormData()
    formData.append("image", imageFile)

    // Log the FormData to debug
    console.log("Uploading category image with FormData:", formData)

    // For debugging, log the keys in the FormData
    for (const pair of formData.entries()) {
      console.log(`FormData contains: ${pair[0]}, ${pair[1]}`)
    }

    return apiRequest(`/categories/image/${id}`, {
      method: "PATCH",
      body: formData,
      // Don't set any Content-Type header, let the browser handle it
      headers: {},
    })
  },
}

// Table type definition based on backend model
export interface Table {
  _id: string
  table_number: number
  capacity: number
  status: "available" | "occupied" | "reserved" | "maintenance"
  current_order?: Order | string
}

// Table input for create/update operations
export interface TableInput {
  table_number: number
  capacity: number
}

// Table status update input
export interface TableStatusInput {
  status: "available" | "occupied" | "reserved" | "maintenance"
  current_order?: string // Order ID
}

// Table-specific API functions
export const tableApi = {
  // Get all tables
  getAllTables: async (): Promise<{ tables: Table[]; count: number }> => {
    return apiRequest("/tables")
  },

  // Create a new table
  createTable: async (table: TableInput): Promise<{ table: Table }> => {
    return apiRequest("/tables", {
      method: "POST",
      body: JSON.stringify(table),
    })
  },

  // Get a single table by ID
  getTable: async (id: string): Promise<{ table: Table }> => {
    return apiRequest(`/tables/${id}`)
  },

  // Update a table
  updateTable: async (id: string, table: Partial<TableInput>): Promise<{ table: Table }> => {
    return apiRequest(`/tables/${id}`, {
      method: "PATCH",
      body: JSON.stringify(table),
    })
  },

  // Delete a table
  deleteTable: async (id: string): Promise<{ msg: string }> => {
    return apiRequest(`/tables/${id}`, {
      method: "DELETE",
    })
  },

  // Update table status
  updateTableStatus: async (id: string, statusData: TableStatusInput): Promise<{ table: Table }> => {
    return apiRequest(`/tables/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(statusData),
    })
  },
}

// Order item type definition
export interface OrderItem {
  item: MenuItem | string // Can be populated with MenuItem or just the ID
  quantity: number
  price: number
  customizations?: Array<{
    option_name: string
    selection: string
    price_addition: number
  }>
}

// Order type definition
export interface Order {
  _id: string
  order_number: string
  table: Table | string // Can be populated with Table or just the ID
  items: OrderItem[]
  total_amount: number
  status: "pending" | "preparing" | "served" | "complete" | "cancelled"
  payment_status?: "pending" | "paid" | "refunded" | "failed"
  payment_method?: "cash" | "card" | "esewa" | "not_paid"
  payment_transaction_id?: string
  payment_id?: string
  payment_date?: string
  created_at: string
  updated_at: string
}

// Order input for create operations
export interface OrderInput {
  table: string // Table ID
  items: {
    item: string // MenuItem ID
    quantity: number
    price: number
    customizations?: Array<{
      option_name: string
      selection: string
      price_addition: number
    }>
  }[]
  total_amount: number
  payment_method?: string // Add payment method
}

// Order update input
export interface OrderUpdateInput {
  items?: {
    item: string // MenuItem ID
    quantity: number
    price: number
    customizations?: Array<{
      option_name: string
      selection: string
      price_addition: number
    }>
  }[]
  total_amount?: number
}

// Order status update input
export interface OrderStatusInput {
  status: "pending" | "preparing" | "served" | "complete" | "cancelled"
}

// Order-specific API functions
export const orderApi = {
  // Get all orders
  getAllOrders: async (): Promise<{ orders: Order[]; count: number }> => {
    return apiRequest("/orders")
  },

  // Create a new order
  createOrder: async (order: OrderInput): Promise<{ order: Order }> => {
    return apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(order),
    })
  },

  // Get a single order by ID
  getOrder: async (id: string): Promise<{ order: Order }> => {
    return apiRequest(`/orders/${id}`)
  },

  // Update an order
  updateOrder: async (id: string, order: OrderUpdateInput): Promise<{ order: Order }> => {
    return apiRequest(`/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(order),
    })
  },

  // Delete an order
  deleteOrder: async (id: string): Promise<{ msg: string }> => {
    return apiRequest(`/orders/${id}`, {
      method: "DELETE",
    })
  },

  // Update order status
  updateOrderStatus: async (id: string, statusData: OrderStatusInput): Promise<{ order: Order }> => {
    return apiRequest(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(statusData),
    })
  },

  // Get orders by table
  getOrdersByTable: async (tableId: string): Promise<{ orders: Order[]; count: number }> => {
    return apiRequest(`/orders/table/${tableId}`)
  },

  // Get orders by status
  getOrdersByStatus: async (status: string): Promise<{ orders: Order[]; count: number }> => {
    return apiRequest(`/orders/status/${status}`)
  },
}

// Add this new statistics API section after the existing API functions

// Statistics API functions
export const statsApi = {
  // Get dashboard statistics
  getDashboardStats: async (): Promise<any> => {
    return apiRequest("/stats/dashboard")
  },

  // Get daily revenue data
  getDailyRevenue: async (): Promise<any> => {
    return apiRequest("/stats/daily-revenue")
  },

  // Get weekly revenue data
  getWeeklyRevenue: async (): Promise<any> => {
    return apiRequest("/stats/weekly-revenue")
  },

  // Get monthly revenue data
  getMonthlyRevenue: async (): Promise<any> => {
    return apiRequest("/stats/monthly-revenue")
  },

  // Get most sold items
  getMostSoldItems: async (): Promise<any> => {
    return apiRequest("/stats/most-sold-items")
  },

  // Get revenue by category
  getRevenueByCategory: async (): Promise<any> => {
    return apiRequest("/stats/revenue-by-category")
  },

  // Get year-over-year growth
  getYearOverYearGrowth: async (): Promise<any> => {
    return apiRequest("/stats/year-over-year")
  },

  // Get order status distribution
  getOrderStatusDistribution: async (): Promise<any> => {
    return apiRequest("/stats/order-status")
  },

  // Get payment method distribution
  getPaymentMethodDistribution: async (): Promise<any> => {
    return apiRequest("/stats/payment-methods")
  },

  // Get hourly order distribution
  getHourlyOrderDistribution: async (): Promise<any> => {
    return apiRequest("/stats/hourly-distribution")
  },
}

// Payment type definitions
export interface PaymentVerifyResponse {
  success: boolean
  msg: string
  order?: any
  payment?: any
}

export interface PaymentStatusResponse {
  success: boolean
  paymentStatus: string
  paymentMethod: string
  paymentId?: string
  paymentDate?: string
}

// Payment-specific API functions
export const paymentApi = {
  // Initiate payment
  initiatePayment: async (orderId: string, amount: number): Promise<any> => {
    try {
      console.log("Calling backend to initiate payment for order:", orderId, "amount:", amount)
      return await apiRequest("/payments/initiate", {
        method: "POST",
        body: JSON.stringify({ orderId, amount }),
      })
    } catch (error) {
      console.error("Payment initiation API error:", error)
      // Don't throw here, we'll continue with client-side signature generation
      return {
        success: false,
        msg: error instanceof Error ? error.message : "Failed to initiate payment",
        error: error,
      }
    }
  },

  // Verify payment after eSewa callback
  verifyPayment: async (data: string): Promise<PaymentVerifyResponse> => {
    return apiRequest(`/payments/verify?data=${encodeURIComponent(data)}`)
  },

  // Get payment status for an order
  getPaymentStatus: async (orderId: string): Promise<PaymentStatusResponse> => {
    return apiRequest(`/payments/status/${orderId}`)
  },

  // Process cash payment
  processCashPayment: async (orderId: string): Promise<PaymentVerifyResponse> => {
    return apiRequest("/payments/cash", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    })
  },
}

// Add this function to the existing api.ts file

// Function to upload QR code image
export const uploadQrCode = async (file: File): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
  try {
    const formData = new FormData()
    // Use 'image' as the key to match backend expectation
    formData.append("image", file)

    console.log("Uploading QR code to backend")

    const response = await fetch(`${API_BASE_URL}/qr/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
      // Don't set Content-Type header for FormData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Upload failed with status: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: data.success,
      imageUrl: data.data?.imageUrl,
    }
  } catch (error) {
    console.error("Error uploading QR code:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload QR code",
    }
  }
}

// Function to get current QR code
export const getQrCode = async (): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/qr`, {
      credentials: "include",
    })

    // If 404, it means no QR code is found, which is not an error
    if (response.status === 404) {
      return {
        success: false,
        imageUrl: undefined,
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed with status: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: data.success,
      imageUrl: data.data?.imageUrl,
    }
  } catch (error) {
    console.error("Error fetching QR code:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch QR code",
    }
  }
}

