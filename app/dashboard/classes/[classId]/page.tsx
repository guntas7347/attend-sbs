import Link from "next/link";
import { BookOpen, ArrowRight, PlusCircle, ChevronRight } from "lucide-react";

const classDetails = {
  id: 1,
  name: "Computer Science - Section A",
  subjects: [
    { id: 1, name: "Data Structures", code: "CS201", lectures: 42 },
    { id: 2, name: "Algorithms", code: "CS202", lectures: 38 },
    { id: 3, name: "Database Management Systems", code: "CS203", lectures: 40 },
    { id: 4, name: "Operating Systems", code: "CS204", lectures: 35 },
  ],
};

export default function ClassDetailsPage({ params }: { params: { classId: string } }) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="hidden md:flex mb-2 text-sm">
            <ol className="flex items-center gap-2">
              <li><Link href="/dashboard" className="text-gray-500 hover:text-gray-900">Dashboard</Link></li>
              <li><ChevronRight className="h-4 w-4" /></li>
              <li><Link href="/dashboard" className="text-gray-500 hover:text-gray-900">Classes</Link></li>
              <li><ChevronRight className="h-4 w-4" /></li>
              <li className="text-gray-900 font-medium">{classDetails.name}</li>
            </ol>
          </nav>
          <h1 className="text-lg font-semibold md:text-2xl">Subjects</h1>
        </div>
        <Link href={`/dashboard/classes/${params.classId}/add-student`} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Student
        </Link>
      </div>
      <div className="grid gap-4 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {classDetails.subjects.map((subject) => (
          <div key={subject.id} className="rounded-lg border bg-white text-gray-900 shadow-sm">
            <div className="flex flex-row items-center justify-between p-6 pb-2">
              <h3 className="text-lg font-medium tracking-normal">{subject.name}</h3>
              <BookOpen className="h-5 w-5 text-gray-500" />
            </div>
            <div className="p-6 pt-0">
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold mb-4">{subject.code}</span>
              <div className="text-sm text-gray-500 mb-4">
                {subject.lectures} lectures scheduled
              </div>
              <Link href={`/dashboard/classes/${params.classId}/subjects/${subject.id}`} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 w-full bg-gray-900 text-white hover:bg-gray-800">
                  View Attendance
                  <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
