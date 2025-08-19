import Link from "next/link"
import { GraduationCap } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="mx-auto max-w-sm w-full bg-white shadow-md rounded-lg p-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <GraduationCap className="h-10 w-10 text-blue-600 mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-gray-500">
            Enter your credentials to access your dashboard
          </p>
        </div>
        <div className="mt-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                className="flex h-10 w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <label htmlFor="password">Password</label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <input id="password" type="password" required className="flex h-10 w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm" />
            </div>
            <Link href="/dashboard" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-white bg-blue-600 h-10 px-4 py-2 w-full hover:bg-blue-700">
                Login
            </Link>
            <Link href="#" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-gray-200 bg-transparent h-10 px-4 py-2 w-full hover:bg-gray-100">
                Login with Google
            </Link>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="#" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
