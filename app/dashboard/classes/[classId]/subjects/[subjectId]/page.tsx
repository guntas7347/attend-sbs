import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

const attendanceData = {
  subjectName: "Data Structures",
  className: "Computer Science - Section A",
  date: "2024-07-29",
  students: [
    {
      id: "235001",
      name: "Aarav Sharma",
      status: "Present",
      photo:
        "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg",
    },
    {
      id: "235002",
      name: "Ishita Verma",
      status: "Present",
      photo:
        "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
    },
    {
      id: "235003",
      name: "Rohan Patel",
      status: "Absent",
      photo:
        "https://images.pexels.com/photos/2169434/pexels-photo-2169434.jpeg",
    },
    {
      id: "235004",
      name: "Ananya Gupta",
      status: "Present",
      photo: "https://images.pexels.com/photos/732425/pexels-photo-732425.jpeg",
    },
  ],
};

export default function SubjectAttendancePage({
  params,
}: {
  params: { classId: string; subjectId: string };
}) {
  return (
    <>
      <nav className="hidden md:flex mb-4 text-sm">
        <ol className="flex items-center gap-2">
          <li>
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-gray-900"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <ChevronRight className="h-4 w-4" />
          </li>
          <li>
            <Link
              href={`/dashboard/classes/${params.classId}`}
              className="text-gray-500 hover:text-gray-900"
            >
              {attendanceData.className}
            </Link>
          </li>
          <li>
            <ChevronRight className="h-4 w-4" />
          </li>
          <li className="text-gray-900 font-medium">
            {attendanceData.subjectName}
          </li>
        </ol>
      </nav>
      <div className="rounded-lg border bg-white text-gray-900 shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            Attendance for {attendanceData.subjectName}
          </h3>
          <p className="text-sm text-gray-500">
            Showing attendance for date: {attendanceData.date}.
          </p>
        </div>
        <div className="p-6 pt-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden w-[100px] sm:table-cell">
                    Photo
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Student ID
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {attendanceData.students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b transition-colors hover:bg-gray-50/50"
                  >
                    <td className="p-4 align-middle hidden sm:table-cell">
                      <Image
                        alt="Student photo"
                        className="aspect-square rounded-full object-cover"
                        data-ai-hint="student portrait"
                        height="40"
                        src={student.photo}
                        width="40"
                      />
                    </td>
                    <td className="p-4 align-middle font-medium">
                      {student.id}
                    </td>
                    <td className="p-4 align-middle">{student.name}</td>
                    <td className="p-4 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          student.status === "Present"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
