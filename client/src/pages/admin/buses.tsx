import AdminLayout from "@/components/layout/AdminLayout";
import BusManagement from "@/components/admin/BusManagement";

export default function BusesPage() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Bus Management</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage all buses, their routes, and status
          </p>
        </div>
        
        <BusManagement />
      </div>
    </AdminLayout>
  );
}
