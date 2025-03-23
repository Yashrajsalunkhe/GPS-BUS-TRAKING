import { useEffect } from "react";
import StudentLayout from "@/components/layout/StudentLayout";
import LiveTracking from "@/components/student/LiveTracking";
import { Card, CardContent } from "@/components/ui/card";
import busTrackingSocket from "@/lib/websocket";

export default function TrackingPage() {
  // Ensure connection to websocket when visiting this page
  useEffect(() => {
    if (!busTrackingSocket.isConnected()) {
      busTrackingSocket.connect();
    } else {
      busTrackingSocket.requestBusLocations();
    }
    
    return () => {
      // We don't disconnect since the socket is shared,
      // but we could implement specific cleanup if needed
    };
  }, []);

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Live Bus Tracking</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Track your bus in real-time and view estimated arrival times
          </p>
        </div>
        
        <div className="space-y-6">
          <LiveTracking />
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">How to use the tracking system</h3>
              
              <div className="space-y-4">
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1 md:flex md:justify-between">
                      <p className="text-sm text-blue-700">
                        The map shows the live location of buses on your route. Click on a bus marker to see more details.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Map Legend</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <div className="h-6 w-6 mr-2">
                        <img src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png" alt="Bus icon" className="h-full w-full" />
                      </div>
                      <span className="text-sm text-gray-600">Bus location</span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="h-5 w-5 mr-2">
                        <img src="https://cdn-icons-png.flaticon.com/512/484/484167.png" alt="Stop icon" className="h-full w-full" />
                      </div>
                      <span className="text-sm text-gray-600">Bus stop</span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-10 h-1 bg-blue-600 mr-2"></div>
                      <span className="text-sm text-gray-600">Bus route</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tips</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>Location updates every 10 seconds</li>
                    <li>Zoom in/out using the mouse wheel or pinch gesture</li>
                    <li>Click on stops to see their names</li>
                    <li>Check the ETA information below the map for your next stop</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}
