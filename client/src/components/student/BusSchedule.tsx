import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchStudentProfile, fetchRouteWithStops, fetchAllHolidays, fetchAllAnnouncements } from '@/lib/api';

export default function BusSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Fetch student profile
  const { data: studentProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/student/profile'],
  });
  
  // Fetch route information
  const { data: routeWithStops, isLoading: isLoadingRoute } = useQuery({
    queryKey: ['/api/routes', studentProfile?.routeId],
    queryFn: () => fetchRouteWithStops(studentProfile?.routeId || 0),
    enabled: !!studentProfile?.routeId,
  });
  
  // Fetch holidays
  const { data: holidays = [], isLoading: isLoadingHolidays } = useQuery({
    queryKey: ['/api/holidays'],
  });
  
  // Fetch announcements
  const { data: announcements = [], isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ['/api/announcements'],
  });
  
  const isLoading = isLoadingProfile || isLoadingRoute || isLoadingHolidays || isLoadingAnnouncements;
  
  // Format stops to include arrival times for morning and evening
  const formatStops = () => {
    if (!routeWithStops || !routeWithStops.stops) return [];
    
    return routeWithStops.stops
      .sort((a, b) => a.stopOrder - b.stopOrder)
      .map(stop => ({
        ...stop,
        // Convert 24-hour time format to 12-hour format with AM/PM
        morningArrival: stop.arrivalTime ? formatTime(stop.arrivalTime) : 'N/A',
        eveningArrival: stop.arrivalTime ? formatEveningTime(stop.arrivalTime) : 'N/A',
      }));
  };
  
  // Format time from HH:MM:SS to 12-hour format
  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hoursNum = parseInt(hours);
      const ampm = hoursNum >= 12 ? 'PM' : 'AM';
      const hours12 = hoursNum % 12 || 12;
      return `${hours12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };
  
  // Calculate evening time (add 8 hours to morning time)
  const formatEveningTime = (timeString: string) => {
    try {
      const [hours, minutes, seconds] = timeString.split(':');
      let hoursNum = parseInt(hours) + 8;
      if (hoursNum >= 24) hoursNum -= 24;
      const ampm = hoursNum >= 12 ? 'PM' : 'AM';
      const hours12 = hoursNum % 12 || 12;
      return `${hours12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };
  
  // Check if a date is a holiday
  const isHoliday = (date: Date) => {
    return holidays.some(holiday => {
      const holidayDate = new Date(holiday.date);
      return (
        date.getDate() === holidayDate.getDate() &&
        date.getMonth() === holidayDate.getMonth() &&
        date.getFullYear() === holidayDate.getFullYear()
      );
    });
  };
  
  // Get holiday information for a date
  const getHolidayInfo = (date: Date) => {
    return holidays.find(holiday => {
      const holidayDate = new Date(holiday.date);
      return (
        date.getDate() === holidayDate.getDate() &&
        date.getMonth() === holidayDate.getMonth() &&
        date.getFullYear() === holidayDate.getFullYear()
      );
    });
  };
  
  // Format date for comparing
  const formatDateForCompare = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Get badge color based on distance from today
  const getAnnouncementBadge = (createdAt: string) => {
    const announcementDate = new Date(createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - announcementDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return <Badge variant="default">New</Badge>;
    if (diffDays < 3) return <Badge variant="outline">Recent</Badge>;
    return null;
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full mb-4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bus Schedule & Calendar</CardTitle>
        <p className="text-sm text-gray-500">
          View bus timings and check holidays
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="schedule">
          <TabsList className="mb-4">
            <TabsTrigger value="schedule">Bus Schedule</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="schedule">
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <h3 className="text-sm font-medium text-yellow-800">Route Information</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {routeWithStops ? routeWithStops.name : 'No route assigned'} 
                  {routeWithStops?.description ? ` - ${routeWithStops.description}` : ''}
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stop Name</TableHead>
                      <TableHead>Morning Arrival</TableHead>
                      <TableHead>Evening Arrival</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formatStops().map((stop) => (
                      <TableRow key={stop.id}>
                        <TableCell className="font-medium">{stop.name}</TableCell>
                        <TableCell>{stop.morningArrival}</TableCell>
                        <TableCell>{stop.eveningArrival}</TableCell>
                      </TableRow>
                    ))}
                    {formatStops().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                          No stops found for this route.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                <p>* Morning schedule is for college-bound buses</p>
                <p>* Evening schedule is for return journey</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="calendar">
            <div className="space-y-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="mx-auto"
                modifiers={{
                  holiday: (date) => isHoliday(date),
                }}
                modifiersStyles={{
                  holiday: {
                    backgroundColor: '#FEE2E2',
                    color: '#EF4444',
                    fontWeight: 'bold',
                  },
                }}
              />
              
              {selectedDate && isHoliday(selectedDate) && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-red-800">Holiday Notice</h3>
                  <p className="text-sm text-red-700 mt-1">
                    {getHolidayInfo(selectedDate)?.description || 'Holiday'}
                  </p>
                  <p className="text-xs text-red-600 mt-2">No bus service available on this day.</p>
                </div>
              )}
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Upcoming Holidays</h3>
                <div className="space-y-2">
                  {holidays
                    .filter(holiday => new Date(holiday.date) >= new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 3)
                    .map(holiday => (
                      <div key={holiday.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <span className="font-medium">{holiday.description}</span>
                        <span className="text-sm text-gray-500">{new Date(holiday.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  {holidays.filter(holiday => new Date(holiday.date) >= new Date()).length === 0 && (
                    <p className="text-gray-500 text-sm">No upcoming holidays found.</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="announcements">
            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(announcement => (
                    <div key={announcement.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{announcement.title}</h3>
                        {getAnnouncementBadge(announcement.createdAt)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Posted {new Date(announcement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No announcements found.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
