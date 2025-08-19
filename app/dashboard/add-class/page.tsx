import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AddClassPage() {
  return (
    <>
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-7 w-7 border border-gray-200 bg-transparent hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Add a New Class
        </h1>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
          <div className="rounded-lg border bg-white text-gray-900 shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">Class Details</h3>
              <p className="text-sm text-gray-500">
                Fill in the details for the new class section.
              </p>
            </div>
            <div className="p-6 pt-0">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <label htmlFor="name" className="text-sm font-medium leading-none">Class Name</label>
                  <input
                    id="name"
                    type="text"
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base"
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-3">
                        <label htmlFor="section" className="text-sm font-medium leading-none">Section</label>
                        <input
                            id="section"
                            type="text"
                            placeholder="e.g. A"
                            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base"
                        />
                    </div>
                    <div className="grid gap-3">
                        <label htmlFor="year" className="text-sm font-medium leading-none">Academic Year</label>
                        <input
                            id="year"
                            type="text"
                            placeholder="e.g. 2024-2025"
                            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base"
                        />
                    </div>
                </div>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">Create Class</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
