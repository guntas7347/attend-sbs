import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";

export default function AddStudentPage({ params }: { params: { classId: string } }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/classes/${params.classId}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-7 w-7 border border-gray-200 bg-transparent hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Add Student to Class
        </h1>
      </div>
      <div className="rounded-lg border bg-white text-gray-900 shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Student Information</h3>
          <p className="text-sm text-gray-500">
            Enter the student's details and upload their images for face recognition.
          </p>
        </div>
        <div className="p-6 pt-0">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="student-name" className="text-sm font-medium leading-none">Student Name</label>
                <input id="student-name" placeholder="e.g. John Doe" className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base"/>
              </div>
              <div className="grid gap-2">
                <label htmlFor="student-id" className="text-sm font-medium leading-none">Student ID / Roll Number</label>
                <input id="student-id" placeholder="e.g. CS-101" className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base" />
              </div>
            </div>
            
            <div className="grid gap-4">
              <label className="text-sm font-medium leading-none">Student Images</label>
              <p className="text-sm text-gray-500 -mt-3">
                Upload 5 different images of the student for better accuracy.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid gap-2">
                    <label htmlFor={`image-${i+1}`} className="text-xs text-gray-500">Image {i + 1}</label>
                    <div className="flex items-center justify-center w-full">
                        <label
                        htmlFor={`image-${i+1}`}
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 text-gray-500" />
                            </div>
                            <input id={`image-${i+1}`} type="file" className="hidden" />
                        </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-start">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">
                Add Student
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
