import AdminLayout from "@/components/layout/AdminLayout";
import PaymentReports from "@/components/admin/PaymentReports";
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function PaymentsPage() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Payments & Reports</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Monitor payment transactions and generate reports
          </p>
        </div>
        
        <Tabs defaultValue="payments">
          <TabsList className="mb-6">
            <TabsTrigger value="payments">Payment Management</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payments">
            <PaymentReports />
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ReportCard 
                    title="Payment Summary"
                    description="Generate summary of all payments"
                    icon={<svg className="h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>}
                    buttonText="Generate"
                  />
                  
                  <ReportCard 
                    title="Bus Usage Report"
                    description="Report on bus usage statistics"
                    icon={<svg className="h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M8 13.5V8.25a.75.75 0 011.5 0v5.25a.75.75 0 01-1.5 0z" />
                      <path d="M15.75 8.25a.75.75 0 00-1.5 0v5.25a.75.75 0 001.5 0V8.25z" />
                      <path fillRule="evenodd" d="M6 2.75C6 1.784 6.784 1 7.75 1h8.5c.966 0 1.75.784 1.75 1.75v18.5A1.75 1.75 0 0116.25 23h-8.5A1.75 1.75 0 016 21.25V2.75zm1.75-.25a.25.25 0 00-.25.25v18.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V2.75a.25.25 0 00-.25-.25h-8.5z" />
                    </svg>}
                    buttonText="Generate"
                  />
                  
                  <ReportCard 
                    title="Student Subscription"
                    description="Report on active/expired subscriptions"
                    icon={<svg className="h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>}
                    buttonText="Generate"
                  />
                </div>
                
                <div className="mt-8 bg-gray-50 p-4 rounded-md text-sm text-gray-600">
                  <p>
                    <strong>Note:</strong> Reports are generated in CSV format and can be downloaded for further analysis. 
                    You can also schedule automatic reports from the settings page.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Report Card Component
function ReportCard({ 
  title, 
  description, 
  icon, 
  buttonText 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  buttonText: string; 
}) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleGenerate = () => {
    setIsLoading(true);
    // Simulate report generation
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, this would trigger a download
      alert("Report generation feature would be implemented with real data");
    }, 1500);
  };
  
  return (
    <div className="border rounded-lg p-6 flex flex-col items-center text-center">
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{description}</p>
      <button
        onClick={handleGenerate}
        className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          buttonText
        )}
      </button>
    </div>
  );
}
