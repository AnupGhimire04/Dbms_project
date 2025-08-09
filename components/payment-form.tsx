"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, QrCode } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface PaymentFormProps {
  orderId?: string
  amount: number
  onCancel: () => void
  onCreateOrder?: (paymentMethod: string) => Promise<string | null>
}

export function PaymentForm({ orderId, amount, onCancel, onCreateOrder }: PaymentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online_payment">("cash")
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePaymentSubmit = async () => {
    setIsProcessing(true)

    try {
      // If we need to create a new order
      if (onCreateOrder) {
        const newOrderId = await onCreateOrder(paymentMethod)

        if (!newOrderId) {
          throw new Error("Failed to create order")
        }

        // Redirect directly to order status page instead of confirmation page
        router.push(`/order/${newOrderId}`)
      }
      // If we already have an order ID (unlikely in this flow, but keeping for completeness)
      else if (orderId) {
        router.push(`/order/${orderId}`)
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="w-full">
      <RadioGroup
        value={paymentMethod}
        onValueChange={(value) => setPaymentMethod(value as "cash" | "online_payment")}
        className="space-y-4"
      >
        <div className="flex items-center space-x-2 border p-4 rounded-md cursor-pointer hover:bg-muted">
          <RadioGroupItem value="cash" id="cash" />
          <Label htmlFor="cash" className="flex items-center cursor-pointer">
            <CreditCard className="mr-2 h-5 w-5" />
            <div>
              <p className="font-medium">Cash Payment</p>
              <p className="text-sm text-muted-foreground">Pay when your order is served</p>
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 border p-4 rounded-md cursor-pointer hover:bg-muted">
          <RadioGroupItem value="online_payment" id="online_payment" />
          <Label htmlFor="online_payment" className="flex items-center cursor-pointer">
            <QrCode className="mr-2 h-5 w-5" />
            <div>
              <p className="font-medium">QR Code Payment</p>
              <p className="text-sm text-muted-foreground">Pay using QR code</p>
            </div>
          </Label>
        </div>
      </RadioGroup>

      <div className="mt-6 p-4 bg-muted rounded-md">
        <div className="flex justify-between">
          <span>Total Amount:</span>
          <span className="font-bold">Rs {amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button onClick={handlePaymentSubmit} disabled={isProcessing}>
          {isProcessing ? "Processing..." : `Confirm Order`}
        </Button>
      </div>
    </div>
  )
}
