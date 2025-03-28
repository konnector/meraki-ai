"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Table, BarChart3 } from "lucide-react"
import { SignedIn, SignedOut } from "@clerk/nextjs"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">Meraki.ai</h1>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Beta</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="outline" size="sm" className="text-gray-600">
                  Log in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                  Sign up
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                  Dashboard
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Spreadsheets,{" "}
              <span className="relative">
                reimagined
                <span className="absolute bottom-0 left-0 w-full h-3 bg-gray-100"></span>
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Meraki.ai combines the flexibility of spreadsheets with the power of artificial intelligence to
              transform your data workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Preview Image */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-lg">
            <img
              src="/placeholder.svg?height=600&width=1000"
              alt="Meraki.ai spreadsheet interface"
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Powerful features for modern spreadsheets
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-gray-600">
                Let AI create layouts, implement formulas, and format your spreadsheet with natural language prompts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Table className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Modern Interface</h3>
              <p className="text-gray-600">
                Enjoy a clean, intuitive interface designed for productivity and ease of use.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analysis</h3>
              <p className="text-gray-600">
                Transform your data with powerful analysis tools and visualization capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-gray-100 rounded-xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to transform your spreadsheet experience?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Join thousands of users who have already upgraded their data workflow with Meraki.ai.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800">
                Start for free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features" className="text-sm text-gray-600 hover:text-gray-900">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/roadmap" className="text-sm text-gray-600 hover:text-gray-900">
                    Roadmap
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-sm text-gray-600 hover:text-gray-900">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/documentation" className="text-sm text-gray-600 hover:text-gray-900">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/tutorials" className="text-sm text-gray-600 hover:text-gray-900">
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="text-sm text-gray-600 hover:text-gray-900">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-sm text-gray-600 hover:text-gray-900">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <h1 className="text-xl font-semibold text-gray-900">Meraki.ai</h1>
            </div>
            <p className="text-sm text-gray-600">© {new Date().getFullYear()} Meraki.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

