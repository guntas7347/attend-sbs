import Link from "next/link";
import { PlusCircle, Users, ArrowRight } from "lucide-react";

const classes = [
  { id: 1, name: "CSE SEM 5", section: "A", students: 62, year: "23-27" },
  { id: 2, name: "CSE SEM 5", section: "B", students: 60, year: "23-27" },
  { id: 3, name: "CSE SEM 3", section: "A", students: 65, year: "24-28" },
  { id: 4, name: "CSE SEM 3", section: "B", students: 63, year: "24-28" },
];

export default function Dashboard() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">My Classes</h1>
        <Link
          href="/dashboard/add-class"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Class
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="rounded-lg border bg-white text-gray-900 shadow-sm"
          >
            <div className="p-6 pb-2">
              <p className="text-sm text-gray-500">{cls.year}</p>
              <h3 className="text-xl font-bold tracking-tight">
                {cls.name} {cls.section}
              </h3>
            </div>
            <div className="p-6 pt-0 flex flex-col justify-between h-full">
              <div className="flex items-center text-gray-500 mb-4">
                <Users className="h-4 w-4 mr-2" />
                <span>{cls.students} Students</span>
              </div>
              <Link
                href={`/dashboard/classes/${cls.id}`}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 w-full mt-auto bg-gray-900 text-white hover:bg-gray-800"
              >
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
