import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PencilIcon, CheckIcon, XIcon } from 'lucide-react';
import { fetchStudentProfile, updateStudentProfile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ProfileCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<any>({});
  
  // Fetch student profile
  const { data: student, isLoading } = useQuery({
    queryKey: ['/api/student/profile'],
    onSuccess: (data) => {
      setProfileData(data);
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => updateStudentProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student/profile'] });
      setIsEditing(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = () => {
    // Convert year to number if it's a string
    const dataToUpdate = {
      ...profileData,
      year: typeof profileData.year === 'string' ? parseInt(profileData.year) : profileData.year,
    };
    
    updateProfileMutation.mutate(dataToUpdate);
  };
  
  const handleCancel = () => {
    setProfileData(student);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-10" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40 col-span-2" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40 col-span-2" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40 col-span-2" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40 col-span-2" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40 col-span-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!student) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Failed to load profile information. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Student Profile</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Personal details and application</p>
        </div>
        {!isEditing ? (
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
            <PencilIcon className="h-5 w-5 text-primary" />
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleCancel}
              disabled={updateProfileMutation.isPending}
            >
              <XIcon className="h-5 w-5 text-destructive" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckIcon className="h-5 w-5 text-primary" />
              )}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <Input 
                    name="name" 
                    value={profileData.name || ''}
                    onChange={handleInputChange}
                    className="max-w-md"
                  />
                ) : (
                  student.name
                )}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">URN</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {student.urn}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {student.email}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Mobile number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <Input 
                    name="mobile" 
                    value={profileData.mobile || ''}
                    onChange={handleInputChange}
                    className="max-w-md"
                  />
                ) : (
                  student.mobile
                )}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <Select 
                    name="department"
                    value={profileData.department || ''} 
                    onValueChange={(value) => handleSelectChange('department', value)}
                  >
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Information Technology">Information Technology</SelectItem>
                      <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                      <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                      <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                      <SelectItem value="Electronics & Communication">Electronics & Communication</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  student.department
                )}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Year</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <Select 
                    name="year"
                    value={profileData.year?.toString() || '1'} 
                    onValueChange={(value) => handleSelectChange('year', value)}
                  >
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">First Year</SelectItem>
                      <SelectItem value="2">Second Year</SelectItem>
                      <SelectItem value="3">Third Year</SelectItem>
                      <SelectItem value="4">Fourth Year</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  `${student.year}${getYearSuffix(student.year)} Year`
                )}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <Textarea 
                    name="address" 
                    value={profileData.address || ''}
                    onChange={handleInputChange}
                    className="max-w-md"
                    rows={3}
                  />
                ) : (
                  student.address
                )}
              </dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get the suffix for a year number
function getYearSuffix(year: number): string {
  switch (year) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
