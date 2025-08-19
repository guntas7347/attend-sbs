import Link from "next/link"
import { GraduationCap, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="mx-auto max-w-sm w-full bg-white shadow-md rounded-lg p-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <GraduationCap className="h-10 w-10 text-blue-600 mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold">Forgot Password?</h1>
          <p className="text-gray-500">
            No worries, we&apos;ll send you reset instructions.
          </p>
        </div>
        <div className="mt-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                className="flex h-10 w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <button type="submit" className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-white bg-blue-600 h-10 px-4 py-2 hover:bg-blue-700">
              Send Reset Link
            </button>
          </div>
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="flex items-center justify-center gap-2 underline">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
