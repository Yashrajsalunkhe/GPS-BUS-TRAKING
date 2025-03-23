import StudentLayout from "@/components/layout/StudentLayout";
import BusSchedule from "@/components/student/BusSchedule";

export default function SchedulePage() {
  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Bus Schedule & Calendar</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View bus timings, check for holidays, and see important announcements
          </p>
        </div>
        
        <div className="space-y-6">
          <BusSchedule />
        </div>
      </div>
    </StudentLayout>
  );
}
