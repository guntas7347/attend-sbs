import Link from 'next/link';
import { ScanFace, BarChart3, Users, Bot, GraduationCap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm bg-white">
        <Link href="/" className="flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-blue-600" />
          <span className="ml-2 text-xl font-bold">Attendify</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Login
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">
            Get Started
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-blue-50 to-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    The Future of Attendance is Here
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl">
                    Attendify uses cutting-edge AI to automate attendance tracking, saving you time and providing insightful data.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-11 px-8 bg-blue-600 text-white hover:bg-blue-700">
                    Access Dashboard
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                 <ScanFace className="w-48 h-48 md:w-64 md:h-64 lg:w-96 lg:h-96 text-blue-600 opacity-20" />
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Streamline Your Classroom Management
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Focus on teaching, not on roll calls. Our automated system handles it all.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 mt-12">
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                    <div className="bg-blue-100/50 p-4 rounded-full">
                        <Bot className="h-8 w-8 text-blue-600" />
                    </div>
                </div>
                <h3 className="text-lg font-bold">AI-Powered Face Recognition</h3>
                <p className="text-sm text-gray-500">
                  Upload a single classroom photo, and our AI will instantly mark attendance.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                    <div className="bg-blue-100/50 p-4 rounded-full">
                        <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                </div>
                <h3 className="text-lg font-bold">Real-time Analytics</h3>
                <p className="text-sm text-gray-500">
                  Generate insightful reports on student attendance and engagement patterns.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                    <div className="bg-blue-100/50 p-4 rounded-full">
                        <Users className="h-8 w-8 text-blue-600" />
                    </div>
                </div>
                <h3 className="text-lg font-bold">Easy Student Management</h3>
                <p className="text-sm text-gray-500">
                  Quickly add and manage students, classes, and subjects in one place.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Attendify. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
