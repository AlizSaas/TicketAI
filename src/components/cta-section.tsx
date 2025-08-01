import { Button } from "@/components/ui/button"
import { SignUpButton } from "@clerk/nextjs"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Workflow?</h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Start managing tickets more efficiently today. No credit card required for your free trial.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignUpButton mode="modal">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </SignUpButton>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
          >
            Schedule Demo
          </Button>
        </div>

        <p className="text-blue-200 text-sm mt-6">Free 14-day trial • No setup fees • Cancel anytime</p>
      </div>
    </section>
  )
}
