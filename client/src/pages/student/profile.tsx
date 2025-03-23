import StudentLayout from "@/components/layout/StudentLayout";
import ProfileCard from "@/components/student/ProfileCard";
import DigitalBusPass from "@/components/student/DigitalBusPass";

export default function ProfilePage() {
  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View and update your personal information
          </p>
        </div>
        
        <div className="space-y-6">
          <ProfileCard />
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Your Digital Bus Pass</h2>
            <DigitalBusPass />
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
