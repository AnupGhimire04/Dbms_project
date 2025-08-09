import { type NextRequest, NextResponse } from "next/server"
import { writeFile, unlink, readdir } from "fs/promises"
import { join } from "path"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("qrImage") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "File must be an image" }, { status: 400 })
    }

    // Get the file extension from the mime type
    const mimeToExt: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
    }

    const fileExt = mimeToExt[file.type] || ".png" // Default to .png if unknown

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Define the path where the file will be saved
    const publicDir = join(process.cwd(), "public")

    // First, find and delete any existing payment-qr.* files
    try {
      const files = await readdir(publicDir)
      const qrFiles = files.filter((f) => f.startsWith("payment-qr."))

      for (const existingFile of qrFiles) {
        await unlink(join(publicDir, existingFile))
      }
    } catch (err) {
      console.error("Error cleaning up existing QR files:", err)
      // Continue even if cleanup fails
    }

    // Save the new file with the appropriate extension
    const filename = `payment-qr${fileExt}`
    const filePath = join(publicDir, filename)
    await writeFile(filePath, buffer)

    // Return success response with the filename (including extension)
    return NextResponse.json({
      success: true,
      imageUrl: `/${filename}?t=${Date.now()}`, // Add timestamp to prevent caching
      filename: filename,
    })
  } catch (error) {
    console.error("Error uploading QR code:", error)
    return NextResponse.json({ success: false, error: "Failed to upload QR code" }, { status: 500 })
  }
}
