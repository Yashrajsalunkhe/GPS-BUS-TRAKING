import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/StudentLayout";
import DigitalBusPass from "@/components/student/DigitalBusPass";
import LiveTracking from "@/components/student/LiveTracking";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { fetchAllAnnouncements } from "@/lib/api";
import { Announcement } from "@shared/schema";

export default function StudentDashboard() {
  const [latestAnnouncements, setLatestAnnouncements] = useState<Announcement[]>([]);
  
  // Fetch announcements
  const { data: announcements = [] } = useQuery({
    queryKey: ['/api/announcements'],
  });
  
  // Get the latest 3 announcements for the quick info panel
  useEffect(() => {
    if (announcements.length > 0) {
      const sortedAnnouncements = [...announcements].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLatestAnnouncements(sortedAnnouncements.slice(0, 3));
    }
  }, [announcements]);
  
  // Format relative time for announcements
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Student Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Welcome back to your dashboard!</p>
        </div>
        
        {/* Profile & Bus Pass */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Digital Bus Pass */}
          <DigitalBusPass />
        </div>
        
        {/* Bus Tracking & Quick Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Bus Tracking */}
          <div className="lg:col-span-2">
            <LiveTracking />
          </div>
          
          {/* Quick Info Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
              <p className="text-sm text-gray-500">Important updates and notices</p>
            </CardHeader>
            <CardContent>
              {latestAnnouncements.length > 0 ? (
                <div className="space-y-4">
                  {latestAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="border-b pb-4">
                      <h4 className="font-medium text-gray-900 mb-1">{announcement.title}</h4>
                      <p className="text-sm text-gray-500">{announcement.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Posted {getRelativeTime(announcement.createdAt)}
                      </p>
                    </div>
                  ))}
                  
                  <div className="text-right pt-2">
                    <a href="/student/schedule" className="text-sm font-medium text-primary hover:text-primary-dark">
                      View All Announcements <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No announcements available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}
