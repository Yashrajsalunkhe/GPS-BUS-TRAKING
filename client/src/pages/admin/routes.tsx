import AdminLayout from "@/components/layout/AdminLayout";
import RouteManagement from "@/components/admin/RouteManagement";

export default function RoutesPage() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Route Management</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage bus routes, stops, and schedules
          </p>
        </div>
        
        <RouteManagement />
      </div>
    </AdminLayout>
  );
}
