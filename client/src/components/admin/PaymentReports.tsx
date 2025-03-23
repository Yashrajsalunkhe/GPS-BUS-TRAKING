import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { fetchAllStudents, updatePaymentStatus } from '@/lib/api';
import { Student, Payment } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Check, Download, Search, Filter, ArrowUpDown } from 'lucide-react';

export default function PaymentReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isUpdatePaymentDialogOpen, setIsUpdatePaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [transactionId, setTransactionId] = useState('');
  
  // Fetch all students with their payments
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['/api/admin/students'],
    queryFn: fetchAllStudents
  });
  
  // Update payment status mutation
  const updatePaymentMutation = useMutation({
    mutationFn: ({ paymentId, status, transactionId }: { paymentId: number; status: 'completed' | 'failed'; transactionId?: string }) => 
      updatePaymentStatus(paymentId, status, transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/students'] });
      setIsUpdatePaymentDialogOpen(false);
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
      setTransactionId('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status",
        variant: "destructive",
      });
    },
  });
  
  // All payments from all students
  const allPayments = students.flatMap((student: any) => 
    (student.payments || []).map((payment: any) => ({
      ...payment,
      studentName: student.name,
      studentUrn: student.urn,
      studentId: student.id
    }))
  );
  
  // Filter and sort payments
  const filteredPayments = allPayments
    .filter((payment: any) => {
      // Filter by status
      if (paymentFilter !== 'all' && payment.status !== paymentFilter) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          payment.studentName.toLowerCase().includes(searchLower) ||
          payment.studentUrn.toLowerCase().includes(searchLower) ||
          (payment.transactionId && payment.transactionId.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    })
    .sort((a: any, b: any) => {
      // Sort by payment date
      const dateA = new Date(a.paymentDate).getTime();
      const dateB = new Date(b.paymentDate).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  
  // Calculate statistics
  const totalCollected = allPayments
    .filter((payment: any) => payment.status === 'completed')
    .reduce((sum: number, payment: any) => sum + payment.amount, 0);
  
  const totalPending = allPayments
    .filter((payment: any) => payment.status === 'pending')
    .reduce((sum: number, payment: any) => sum + payment.amount, 0);
  
  const pendingCount = allPayments.filter((payment: any) => payment.status === 'pending').length;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Handle payment status update
  const handleUpdatePayment = (payment: any) => {
    setSelectedPayment(payment);
    setTransactionId(payment.transactionId || '');
    setIsUpdatePaymentDialogOpen(true);
  };
  
  const confirmUpdatePayment = (status: 'completed' | 'failed') => {
    if (selectedPayment) {
      updatePaymentMutation.mutate({
        paymentId: selectedPayment.id,
        status,
        transactionId: transactionId || undefined
      });
    }
  };
  
  // Get badge for payment status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Generate CSV for export
  const generateCSV = () => {
    // Headers
    const headers = ['Student Name', 'URN', 'Amount', 'Date', 'Method', 'Transaction ID', 'Status'];
    
    // Data rows
    const rows = filteredPayments.map((payment: any) => [
      payment.studentName,
      payment.studentUrn,
      payment.amount,
      formatDate(payment.paymentDate),
      payment.paymentMethod,
      payment.transactionId || '-',
      payment.status
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Total Collected</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCollected)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <div className="h-6 w-6 text-yellow-600">₹</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="h-6 w-6 text-blue-600">#</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <div>
              <CardTitle>Payment Reports</CardTitle>
              <CardDescription>View and manage all student payments</CardDescription>
            </div>
            <Button onClick={generateCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all-payments">
            <TabsList className="mb-4">
              <TabsTrigger value="all-payments">All Payments</TabsTrigger>
              <TabsTrigger value="pending-payments">Pending Payments</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col md:flex-row justify-between mb-4 space-y-2 md:space-y-0">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by name or URN..."
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select
                  value={paymentFilter}
                  onValueChange={(value: any) => setPaymentFilter(value)}
                >
                  <SelectTrigger className="w-40">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <span>Filter</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center"
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Sort by Date {sortOrder === 'desc' ? '(Newest)' : '(Oldest)'}
              </Button>
            </div>
            
            <TabsContent value="all-payments">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                        No payment records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.studentName}</div>
                            <div className="text-xs text-gray-500">{payment.studentUrn}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                        <TableCell>{payment.transactionId || '-'}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right">
                          {payment.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdatePayment(payment)}
                            >
                              Update Status
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="pending-payments">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allPayments
                      .filter((payment: any) => payment.status === 'pending')
                      .map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{payment.studentName}</div>
                              <div className="text-xs text-gray-500">{payment.studentUrn}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                          <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdatePayment(payment)}
                            >
                              Update Status
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                  {!isLoading && allPayments.filter((p: any) => p.status === 'pending').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                        No pending payments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Update Payment Dialog */}
      <Dialog open={isUpdatePaymentDialogOpen} onOpenChange={setIsUpdatePaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Status</DialogTitle>
            <DialogDescription>
              Mark this payment as completed or failed.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Student</p>
                  <p className="font-medium">{selectedPayment.studentName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedPayment.amount)}</p>
                </div>
              </div>
              
              <div>
                <label htmlFor="transaction-id" className="block text-sm font-medium text-gray-500 mb-1">
                  Transaction ID
                </label>
                <Input
                  id="transaction-id"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsUpdatePaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmUpdatePayment('failed')}
              disabled={updatePaymentMutation.isPending}
            >
              Mark as Failed
            </Button>
            <Button
              onClick={() => confirmUpdatePayment('completed')}
              disabled={updatePaymentMutation.isPending}
            >
              {updatePaymentMutation.isPending ? 'Updating...' : 'Mark as Completed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
