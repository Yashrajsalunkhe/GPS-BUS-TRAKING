import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminMap from "@/components/admin/AdminMap";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  fetchAdminDashboardStats, 
  fetchAllAnnouncements, 
  fetchRecentActivities,
  fetchAllStudents,
  fetchBusLocations,
} from "@/lib/api";
import { 
  ExclamationTriangleIcon,
  BellIcon,
  UserPlusIcon,
} from "lucide-react";

export default function AdminDashboard() {
  // Fetch dashboard statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/dashboard/stats'],
    queryFn: fetchAdminDashboardStats
  });
  
  // Fetch recent activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['/api/admin/activities'],
    queryFn: () => fetchRecentActivities(10)
  });
  
  // Fetch all announcements
  const { data: announcements = [], isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ['/api/announcements'],
  });
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Overview of the bus tracking system
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {isLoadingStats ? (
            // Loading skeletons for stats
            Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-7 w-16 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              {/* Total Students */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary-light/20 flex items-center justify-center">
                      <UserPlusIcon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Total Buses */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Total Buses</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalBuses || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m-4 6h8m-8 0l-4 4m4-4l4 4" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Total Routes */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Active Routes</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalRoutes || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Pending Fees */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Pending Fees</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.pendingFees || 0)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        
        {/* Live Tracking & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Map with Live Tracking */}
          <div className="lg:col-span-2">
            <AdminMap />
          </div>
          
          {/* Alerts & Notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Alerts & Notifications</CardTitle>
              <BellIcon className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              {isLoadingAnnouncements ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-gray-200 mr-3"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                        <div className="h-3 w-full bg-gray-100 rounded"></div>
                        <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.length > 0 ? (
                    announcements
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 3)
                      .map((announcement) => (
                        <div key={announcement.id} className="flex">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-500">
                              <BellIcon className="h-5 w-5" />
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                            <p className="text-sm text-gray-500">{announcement.content}</p>
                            <p className="mt-1 text-xs text-gray-400">{formatDateTime(announcement.createdAt)}</p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No alerts or announcements
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-4 text-right">
                    <a href="/admin/announcements" className="text-sm font-medium text-primary hover:text-primary/90">
                      View all alerts <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="grid grid-cols-4 gap-4">
                      <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                      <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                      <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                      <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.action}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{activity.user.name}</div>
                            <div className="text-xs text-gray-500">{activity.user.identifier}</div>
                          </div>
                        </TableCell>
                        <TableCell>{activity.details || '-'}</TableCell>
                        <TableCell className="text-gray-500">
                          {formatDateTime(activity.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                        No recent activities
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
