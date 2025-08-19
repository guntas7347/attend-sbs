import { UploadCloud, ChevronDown } from "lucide-react";

export default function TakeAttendancePage() {
  return (
    <>
      <h1 className="text-lg font-semibold md:text-2xl">Take Attendance</h1>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border bg-white text-gray-900 shadow-sm xl:col-span-2">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Upload Classroom Photo</h3>
            <p className="text-sm text-gray-500">
              Select the class and subject, then upload a photo of the classroom.
            </p>
          </div>
          <div className="p-6 pt-0">
            <form className="grid gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="class" className="text-sm font-medium leading-none">Class</label>
                  <div className="relative">
                    <select id="class" className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm appearance-none">
                      <option value="" disabled selected>Select a class</option>
                      <option value="cs-a">Computer Science - A</option>
                      <option value="me-b">Mechanical Engineering - B</option>
                      <option value="ha-a">History of Art - A</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="subject" className="text-sm font-medium leading-none">Subject</label>
                   <div className="relative">
                    <select id="subject" className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm appearance-none">
                      <option value="" disabled selected>Select a subject</option>
                      <option value="ds">Data Structures</option>
                      <option value="algo">Algorithms</option>
                      <option value="dbms">Database Systems</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none">Classroom Image</label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-10 h-10 mb-4 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 800x400px)</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" />
                  </label>
                </div>
              </div>

              <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-11 px-8 w-full sm:w-auto justify-self-start bg-blue-600 text-white hover:bg-blue-700">Process Attendance</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
