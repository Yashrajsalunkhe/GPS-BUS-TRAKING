import AdminLayout from "@/components/layout/AdminLayout";
import StudentManagement from "@/components/admin/StudentManagement";

export default function StudentsPage() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Student Management</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage student profiles, bus pass subscriptions, and payments
          </p>
        </div>
        
        <StudentManagement />
      </div>
    </AdminLayout>
  );
}
