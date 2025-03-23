import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { fetchStudentPayments, fetchStudentSubscription } from '@/lib/api';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Payment } from '@shared/schema';

export default function PaymentHistory() {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  // Fetch payment history
  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/student/payments'],
  });
  
  // Fetch subscription information
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['/api/student/subscription'],
  });
  
  const isLoading = isLoadingPayments || isLoadingSubscription;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Get status badge variant based on payment status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success" className="capitalize">
            {status}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" className="capitalize">
            {status}
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="capitalize">
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {status}
          </Badge>
        );
    }
  };
  
  // Placeholder for payment form (would integrate with Razorpay/Stripe in production)
  const PaymentDialog = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    
    const handlePayment = () => {
      setIsProcessing(true);
      // Here we would integrate with Razorpay/Stripe
      // For now, just simulate a payment process
      setTimeout(() => {
        setIsProcessing(false);
        setIsPaymentDialogOpen(false);
      }, 2000);
    };
    
    return (
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a Payment</DialogTitle>
            <DialogDescription>
              Complete your bus subscription payment below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-between">
              <span>Subscription Fee:</span>
              <span className="font-medium">{formatCurrency(subscription?.amount || 5000)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Period:</span>
              <span className="font-medium">
                {subscription 
                  ? `${formatDate(subscription.startDate)} to ${formatDate(subscription.endDate)}`
                  : '6 months'}
              </span>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="text-sm">
                <strong>Note:</strong> In a production environment, this would integrate with Razorpay or Stripe for secure payments.
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={isProcessing}>
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <p className="text-sm text-gray-500">
          View your payment history and subscription status
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-gray-500">Subscription Status</p>
            <div className="flex items-center mt-1">
              {subscription?.active ? (
                <Badge variant="success" className="mr-2">Active</Badge>
              ) : (
                <Badge variant="destructive" className="mr-2">Inactive</Badge>
              )}
              <span className="text-sm">
                {subscription 
                  ? `Valid until: ${formatDate(subscription.endDate)}`
                  : 'No active subscription'}
              </span>
            </div>
          </div>
          
          <Button onClick={() => setIsPaymentDialogOpen(true)}>
            Make Payment
          </Button>
        </div>
        
        {payments && payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: Payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.transactionId || `TXN-${payment.id}`}
                  </TableCell>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-6 text-center">
            <p className="text-gray-500">No payment records found</p>
          </div>
        )}
        
        <PaymentDialog />
      </CardContent>
    </Card>
  );
}
