import StudentLayout from "@/components/layout/StudentLayout";
import PaymentHistory from "@/components/student/PaymentHistory";

export default function PaymentsPage() {
  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Payments & Subscription</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage your bus subscription and view payment history
          </p>
        </div>
        
        <div className="space-y-6">
          <PaymentHistory />
        </div>
      </div>
    </StudentLayout>
  );
}
