import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChefHat } from 'lucide-react'

import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-orange-200/50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-20 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-gradient">FoodEase</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Link href="/admin/login">
                <Button variant="ghost" size="lg" className="text-gray-700 hover:text-orange-600 hover:bg-orange-50">
                  Admin Login
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 z-10" />
          <Image
            src="/hero-restaurant.png"
            alt="Modern restaurant interior"
            fill
            className="object-cover"
            priority
          />
          <div className="relative z-20 container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-8 text-center text-white">
              <div className="space-y-6 max-w-4xl">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                    FoodEase
                  </span>
                </h1>
                <p className="mx-auto max-w-[700px] text-xl md:text-2xl text-gray-200 leading-relaxed">
                  Experience dining reimagined. Scan, order, and enjoy - all from your table with our seamless digital menu system.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/tables">
                  <Button size="lg" className="px-8 py-4 text-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 hero-shadow">
                    Start Ordering <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-orange-200 bg-white py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gradient">FoodEase</span>
            </div>
            <p className="text-center text-sm text-gray-600">
              © 2024 FoodEase. All rights reserved. Crafted with ❤️ for better dining experiences.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
