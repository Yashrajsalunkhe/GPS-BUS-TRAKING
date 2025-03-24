import StudentLayout from "@/components/layout/StudentLayout";
import PaymentHistory from "@/components/student/PaymentHistory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Subscription } from "@shared/schema";

export default function PaymentsPage() {
  const navigate = useNavigate();
  
  // Check if student has an active subscription
  const { data: subscription, isLoading } = useQuery<Subscription | null>({
    queryKey: ['/api/student/subscription'],
    onError: () => {
      // Error is expected if no subscription exists
    }
  });
  
  const hasActiveSubscription = subscription && subscription.active;

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
          {/* Subscription Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Bus Pass Subscription</CardTitle>
              <CardDescription>
                Your current bus pass status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center space-x-4">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                  <p>Checking subscription status...</p>
                </div>
              ) : hasActiveSubscription ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Active Subscription</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>You have an active bus pass valid until {new Date(subscription.endDate).toLocaleDateString()}.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">No Active Subscription</h3>
                      <div className="mt-2 text-sm text-amber-700">
                        <p>You don't have an active bus pass subscription. Purchase one to access the college bus service.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => navigate('/student/checkout')}
                disabled={isLoading || hasActiveSubscription}
                className="w-full"
              >
                {hasActiveSubscription ? 'Current Subscription Active' : 'Purchase Bus Pass'}
              </Button>
            </CardFooter>
          </Card>

          {/* Payment History */}
          <PaymentHistory />
        </div>
      </div>
    </StudentLayout>
  );
}
