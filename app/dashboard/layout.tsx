import Link from "next/link";
import {
  GraduationCap,
  Home,
  PlusSquare,
  Camera,
  Bell,
  Search,
  Users,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-gray-100/40 md:block dark:bg-gray-800/40">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <span className="font-bold">Attendify</span>
            </Link>
            <button className="ml-auto h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </button>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/add-class"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              >
                <PlusSquare className="h-4 w-4" />
                Add Class
              </Link>
              <Link
                href="/dashboard/classes/1/add-student"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              >
                <Users className="h-4 w-4" />
                Add Students
              </Link>
              <Link
                href="/dashboard/take-attendance"
                className="flex items-center gap-3 rounded-lg px-3 py-2 bg-gray-100 text-blue-600 transition-all hover:text-blue-700 dark:bg-gray-800"
              >
                <Camera className="h-4 w-4" />
                Take Attendance
              </Link>
            </nav>
          </div>
          <div className="mt-auto p-4">
            <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
              <h3 className="font-bold">Need Help?</h3>
              <p className="text-sm text-gray-500 mt-1 mb-3">
                Contact support for any issues or questions.
              </p>
              <button className="w-full text-sm font-medium text-white bg-blue-600 h-9 rounded-md px-3 hover:bg-blue-700">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-full appearance-none bg-white pl-8 shadow-none md:w-2/3 lg:w-1/3 h-10 rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </form>
          </div>
          <div className="relative">
            <button className="rounded-full h-10 w-10 border flex items-center justify-center">
              <img
                src="https://placehold.co/40x40.png"
                alt="@user"
                className="rounded-full"
              />
            </button>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
