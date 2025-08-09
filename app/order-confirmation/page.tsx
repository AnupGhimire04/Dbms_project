"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, ArrowLeft, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { tableApi, type Table, paymentApi, type PaymentStatusResponse } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function OrderConfirmationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tableId = searchParams.get("table") || ""
  const orderId = searchParams.get("orderId") || ""
  const paymentStatus = searchParams.get("status") || ""

  const [table, setTable] = useState<Table | null>(null)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentInfo, setPaymentInfo] = useState<PaymentStatusResponse | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // If we have an order ID directly, use that
        if (orderId) {
          setCurrentOrderId(orderId)

          // Get payment status if we have an order ID
          try {
            const paymentStatus = await paymentApi.getPaymentStatus(orderId)
            setPaymentInfo(paymentStatus)
          } catch (error) {
            console.error("Failed to fetch payment status:", error)
          }

          // Check for payment status in URL (from eSewa redirect)
          if (paymentStatus === "success") {
            toast({
              title: "Payment Successful",
              description: "Your payment has been processed successfully.",
            })
          } else if (paymentStatus === "failed") {
            toast({
              title: "Payment Failed",
              description: "Your payment could not be processed. Please try again or choose another payment method.",
              variant: "destructive",
            })
          }

          // If we have a table ID, fetch the table info
          if (tableId) {
            const { table } = await tableApi.getTable(tableId)
            setTable(table)
          }

          setIsLoading(false)
          return
        }

        // If no order ID but we have a table ID, fetch table info
        if (!tableId) {
          router.push("/tables")
          return
        }

        const { table } = await tableApi.getTable(tableId)
        setTable(table)

        // Get the current order ID if available
        if (table.current_order) {
          const orderIdValue = typeof table.current_order === "string" ? table.current_order : table.current_order._id
          setCurrentOrderId(orderIdValue)

          // Get payment status if we have an order ID
          if (orderIdValue) {
            try {
              const paymentStatus = await paymentApi.getPaymentStatus(orderIdValue)
              setPaymentInfo(paymentStatus)
            } catch (error) {
              console.error("Failed to fetch payment status:", error)
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast({
          title: "Error",
          description: "Failed to load order information.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [tableId, orderId, paymentStatus, router, toast])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p>Loading...</p>
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
      <main className="flex-1 container py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
            <CardDescription>
              {table
                ? `Your order has been placed successfully for Table ${table?.table_number}.`
                : "Your order has been placed successfully."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              Your order is being prepared. Please wait at your table and our staff will serve you shortly.
            </p>
            <p className="text-sm text-muted-foreground">
              Order number:{" "}
              {table?.current_order && typeof table.current_order !== "string"
                ? table.current_order.order_number
                : currentOrderId
                  ? currentOrderId.substring(0, 8)
                  : "Processing"}
            </p>

            {/* Payment Information */}
            {paymentInfo && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium mb-2">Payment Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={paymentInfo.paymentStatus === "paid" ? "text-green-500 font-medium" : ""}>
                    {paymentInfo.paymentStatus === "paid"
                      ? "Paid"
                      : paymentInfo.paymentStatus === "failed"
                        ? "Failed"
                        : "Pending"}
                  </span>

                  <span className="text-muted-foreground">Method:</span>
                  <span>
                    {paymentInfo.paymentMethod === "esewa"
                      ? "eSewa"
                      : paymentInfo.paymentMethod === "cash"
                        ? "Cash"
                        : paymentInfo.paymentMethod === "card"
                          ? "Card"
                          : "Not specified"}
                  </span>

                  {paymentInfo.paymentId && (
                    <>
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-mono text-xs">{paymentInfo.paymentId}</span>
                    </>
                  )}

                  {paymentInfo.paymentDate && (
                    <>
                      <span className="text-muted-foreground">Date:</span>
                      <span>{new Date(paymentInfo.paymentDate).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center gap-4 flex-wrap">
            {currentOrderId && (
              <Button asChild>
                <Link href={`/order/${currentOrderId}`}>
                  <CheckCircle className="mr-2 h-4 w-4" /> View Order Status
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/tables">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tables
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" /> Home
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2024 FoodEase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
