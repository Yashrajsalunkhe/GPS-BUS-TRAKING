import AdminLayout from "@/components/layout/AdminLayout";
import DriverManagement from "@/components/admin/DriverManagement";

export default function DriversPage() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Driver Management</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage all drivers and assign them to buses
          </p>
        </div>
        
        <DriverManagement />
      </div>
    </AdminLayout>
  );
}
