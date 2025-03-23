import { useQuery } from '@tanstack/react-query';
import { fetchStudentBusPass, fetchStudentProfile } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import QRCode from 'qrcode.react';

export default function DigitalBusPass() {
  const { data: busPass, isLoading: isLoadingPass } = useQuery({
    queryKey: ['/api/student/bus-pass'],
  });
  
  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['/api/student/profile'],
  });
  
  const isLoading = isLoadingPass || isLoadingStudent;

  // Generate QR Code data
  const getQRCodeData = () => {
    if (!busPass || !student) return '';
    return JSON.stringify({
      name: student.name,
      urn: student.urn,
      validUntil: busPass.validUntil,
      route: busPass.route,
      isValid: busPass.active
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Skeleton className="h-7 w-40 mb-2" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-left">
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-6 w-32 mb-3" />
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="w-24 h-24" />
          </div>
          
          <div className="text-left">
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-6 w-48" />
          </div>
          
          <div className="mt-4 flex justify-center">
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!busPass) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Bus Pass</h3>
          <p className="text-sm text-gray-500">You don't have an active bus pass subscription. Please contact administration.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="mx-auto rounded-lg bg-gradient-to-r from-primary-light to-primary p-6 max-w-md text-white mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-xl font-bold">College Bus Pass</h4>
              <p className="text-sm opacity-90">Valid until: {new Date(busPass.validUntil).toLocaleDateString()}</p>
            </div>
            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-primary">
              <span className="font-bold">BT</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-left">
              <p className="text-xs opacity-80">NAME</p>
              <p className="font-semibold">{student?.name}</p>
              <p className="text-xs opacity-80 mt-2">URN</p>
              <p className="font-semibold">{student?.urn}</p>
            </div>
            <div className="bg-white p-2 rounded-lg">
              <QRCode 
                value={getQRCodeData()} 
                size={96} 
                level="H" 
                className="rounded"
              />
            </div>
          </div>
          
          <div className="text-left text-xs">
            <p className="opacity-80">ROUTE</p>
            <p className="font-semibold">{busPass.route || 'No route assigned'}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <Badge variant={busPass.active ? "success" : "destructive"} className="inline-flex items-center px-4 py-2 rounded-md">
            {busPass.active ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>Active Subscription</span>
              </>
            ) : (
              <span>Inactive Subscription</span>
            )}
          </Badge>
          <p className="mt-2 text-sm text-gray-500">
            Next payment due: <span className="font-medium">
              {busPass.active 
                ? new Date(busPass.validUntil).toLocaleDateString() 
                : 'Immediately'}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
