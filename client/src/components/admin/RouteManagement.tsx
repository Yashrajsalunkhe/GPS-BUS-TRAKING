import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchAllRoutes, 
  fetchRouteWithStops, 
  fetchAllStops, 
  createRoute, 
  updateRoute, 
  deleteRoute,
  createStop,
  addStopToRoute
} from '@/lib/api';
import { Route, Stop } from '@shared/schema';
import { 
  Edit, 
  Trash2, 
  Plus, 
  MapPin,
  Clock,
  ArrowUpDown
} from 'lucide-react';

// Form schema for route
const routeFormSchema = z.object({
  name: z.string().min(1, "Route name is required"),
  description: z.string().optional(),
  active: z.boolean().default(true)
});

// Form schema for stop
const stopFormSchema = z.object({
  name: z.string().min(1, "Stop name is required"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180)
});

// Form schema for adding stop to route
const routeStopFormSchema = z.object({
  stopId: z.coerce.number(),
  stopOrder: z.coerce.number().min(1),
  arrivalTime: z.string().optional()
});

type RouteFormValues = z.infer<typeof routeFormSchema>;
type StopFormValues = z.infer<typeof stopFormSchema>;
type RouteStopFormValues = z.infer<typeof routeStopFormSchema>;

export default function RouteManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isAddRouteDialogOpen, setIsAddRouteDialogOpen] = useState(false);
  const [isEditRouteDialogOpen, setIsEditRouteDialogOpen] = useState(false);
  const [isDeleteRouteDialogOpen, setIsDeleteRouteDialogOpen] = useState(false);
  const [isAddStopDialogOpen, setIsAddStopDialogOpen] = useState(false);
  const [isAddStopToRouteDialogOpen, setIsAddStopToRouteDialogOpen] = useState(false);
  
  // Fetch all routes
  const { data: routes = [], isLoading: isLoadingRoutes } = useQuery({
    queryKey: ['/api/routes'],
    queryFn: fetchAllRoutes
  });
  
  // Fetch all stops for dropdown
  const { data: stops = [] } = useQuery({
    queryKey: ['/api/stops'],
    queryFn: fetchAllStops
  });
  
  // Fetch selected route with stops
  const { data: routeWithStops, isLoading: isLoadingRouteDetails } = useQuery({
    queryKey: ['/api/routes', selectedRoute?.id],
    queryFn: () => fetchRouteWithStops(selectedRoute?.id || 0),
    enabled: !!selectedRoute
  });
  
  // Add route mutation
  const addRouteMutation = useMutation({
    mutationFn: createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      setIsAddRouteDialogOpen(false);
      toast({
        title: "Success",
        description: "Route added successfully",
      });
      addRouteForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add route",
        variant: "destructive",
      });
    },
  });
  
  // Edit route mutation
  const editRouteMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Route> }) => updateRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      setIsEditRouteDialogOpen(false);
      toast({
        title: "Success",
        description: "Route updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update route",
        variant: "destructive",
      });
    },
  });
  
  // Delete route mutation
  const deleteRouteMutation = useMutation({
    mutationFn: (id: number) => deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      setIsDeleteRouteDialogOpen(false);
      setSelectedRoute(null);
      toast({
        title: "Success",
        description: "Route deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete route",
        variant: "destructive",
      });
    },
  });
  
  // Add stop mutation
  const addStopMutation = useMutation({
    mutationFn: createStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stops'] });
      setIsAddStopDialogOpen(false);
      toast({
        title: "Success",
        description: "Stop added successfully",
      });
      addStopForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add stop",
        variant: "destructive",
      });
    },
  });
  
  // Add stop to route mutation
  const addStopToRouteMutation = useMutation({
    mutationFn: ({ routeId, data }: { routeId: number; data: RouteStopFormValues }) => 
      addStopToRoute(routeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes', selectedRoute?.id] });
      setIsAddStopToRouteDialogOpen(false);
      toast({
        title: "Success",
        description: "Stop added to route successfully",
      });
      addStopToRouteForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add stop to route",
        variant: "destructive",
      });
    },
  });
  
  // Forms
  const addRouteForm = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      active: true
    },
  });
  
  const editRouteForm = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      active: true
    },
  });
  
  const addStopForm = useForm<StopFormValues>({
    resolver: zodResolver(stopFormSchema),
    defaultValues: {
      name: "",
      latitude: 0,
      longitude: 0
    },
  });
  
  const addStopToRouteForm = useForm<RouteStopFormValues>({
    resolver: zodResolver(routeStopFormSchema),
    defaultValues: {
      stopId: 0,
      stopOrder: 1,
      arrivalTime: ""
    },
  });
  
  // Handle edit route
  const handleEditRoute = (route: Route) => {
    setSelectedRoute(route);
    editRouteForm.reset({
      name: route.name,
      description: route.description || "",
      active: route.active
    });
    setIsEditRouteDialogOpen(true);
  };
  
  // Handle delete route
  const handleDeleteRoute = (route: Route) => {
    setSelectedRoute(route);
    setIsDeleteRouteDialogOpen(true);
  };
  
  // Handle view route stops
  const handleViewRouteStops = (route: Route) => {
    setSelectedRoute(route);
  };
  
  // Handle add stop to route
  const handleAddStopToRoute = () => {
    if (selectedRoute) {
      setIsAddStopToRouteDialogOpen(true);
    }
  };
  
  // Submit handlers
  const onAddRouteSubmit = (data: RouteFormValues) => {
    addRouteMutation.mutate(data);
  };
  
  const onEditRouteSubmit = (data: RouteFormValues) => {
    if (selectedRoute) {
      editRouteMutation.mutate({ id: selectedRoute.id, data });
    }
  };
  
  const onAddStopSubmit = (data: StopFormValues) => {
    addStopMutation.mutate(data);
  };
  
  const onAddStopToRouteSubmit = (data: RouteStopFormValues) => {
    if (selectedRoute) {
      addStopToRouteMutation.mutate({
        routeId: selectedRoute.id,
        data
      });
    }
  };
  
  const confirmDeleteRoute = () => {
    if (selectedRoute) {
      deleteRouteMutation.mutate(selectedRoute.id);
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Routes List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Routes</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddStopDialogOpen(true)}>
                <MapPin className="h-4 w-4 mr-1" />
                Add Stop
              </Button>
              <Button size="sm" onClick={() => setIsAddRouteDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Route
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingRoutes ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No routes found. Add a new route to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {routes.map((route: Route) => (
                  <div
                    key={route.id}
                    className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedRoute?.id === route.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => handleViewRouteStops(route)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{route.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {route.description || 'No description'}
                        </p>
                      </div>
                      <div>
                        {route.active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex mt-3 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRoute(route);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoute(route);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Route Details */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {selectedRoute 
                ? `Route Details: ${selectedRoute.name}` 
                : 'Select a route to view details'}
            </CardTitle>
            {selectedRoute && (
              <Button size="sm" onClick={handleAddStopToRoute}>
                <Plus className="h-4 w-4 mr-1" />
                Add Stop to Route
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedRoute ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Select a route from the list to view its stops and details</p>
              </div>
            ) : isLoadingRouteDetails ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Route Information</h3>
                  <p className="text-sm text-gray-600">{routeWithStops?.description || 'No description available'}</p>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="mr-2">Status:</span>
                    {routeWithStops?.active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Stops on this Route</h3>
                  
                  {routeWithStops?.stops && routeWithStops.stops.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Stop Name</TableHead>
                          <TableHead>Arrival Time</TableHead>
                          <TableHead>Coordinates</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {routeWithStops.stops
                          .sort((a, b) => a.stopOrder - b.stopOrder)
                          .map((stop) => (
                            <TableRow key={stop.id}>
                              <TableCell>{stop.stopOrder}</TableCell>
                              <TableCell className="font-medium">{stop.name}</TableCell>
                              <TableCell>
                                {stop.arrivalTime ? (
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                    {formatTime(stop.arrivalTime)}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">Not set</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border rounded-md">
                      No stops added to this route yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add Route Dialog */}
      <Dialog open={isAddRouteDialogOpen} onOpenChange={setIsAddRouteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Route</DialogTitle>
            <DialogDescription>
              Create a new bus route. You can add stops to it later.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addRouteForm}>
            <form onSubmit={addRouteForm.handleSubmit(onAddRouteSubmit)} className="space-y-4">
              <FormField
                control={addRouteForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Route Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Route 1 - City Center" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addRouteForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the route" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addRouteForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-gray-500">
                        Is this route currently active?
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddRouteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addRouteMutation.isPending}>
                  {addRouteMutation.isPending ? 'Adding...' : 'Add Route'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Route Dialog */}
      <Dialog open={isEditRouteDialogOpen} onOpenChange={setIsEditRouteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Route</DialogTitle>
            <DialogDescription>
              Update the details for this route.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editRouteForm}>
            <form onSubmit={editRouteForm.handleSubmit(onEditRouteSubmit)} className="space-y-4">
              <FormField
                control={editRouteForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Route Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Route 1 - City Center" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editRouteForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the route" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editRouteForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-gray-500">
                        Is this route currently active?
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditRouteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editRouteMutation.isPending}>
                  {editRouteMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Route Dialog */}
      <Dialog open={isDeleteRouteDialogOpen} onOpenChange={setIsDeleteRouteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Route</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this route? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRoute && (
            <div className="py-4">
              <p className="font-medium">{selectedRoute.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                This will permanently remove this route and its stop associations.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteRouteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteRoute}
              disabled={deleteRouteMutation.isPending}
            >
              {deleteRouteMutation.isPending ? 'Deleting...' : 'Delete Route'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Stop Dialog */}
      <Dialog open={isAddStopDialogOpen} onOpenChange={setIsAddStopDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Stop</DialogTitle>
            <DialogDescription>
              Create a new bus stop. You can add it to routes later.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addStopForm}>
            <form onSubmit={addStopForm.handleSubmit(onAddStopSubmit)} className="space-y-4">
              <FormField
                control={addStopForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stop Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Central Library" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addStopForm.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addStopForm.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="helper">
                  <AccordionTrigger className="text-sm text-gray-500">
                    How to find coordinates?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-gray-600">
                      You can find the coordinates of a location using Google Maps. Right-click on a location and select "What's here?" to see the latitude and longitude.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddStopDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addStopMutation.isPending}>
                  {addStopMutation.isPending ? 'Adding...' : 'Add Stop'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Stop to Route Dialog */}
      <Dialog open={isAddStopToRouteDialogOpen} onOpenChange={setIsAddStopToRouteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stop to Route</DialogTitle>
            <DialogDescription>
              Add an existing stop to the selected route.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addStopToRouteForm}>
            <form onSubmit={addStopToRouteForm.handleSubmit(onAddStopToRouteSubmit)} className="space-y-4">
              <FormField
                control={addStopToRouteForm.control}
                name="stopId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Stop</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                      >
                        <option value="">Select a stop</option>
                        {stops.map((stop: Stop) => (
                          <option key={stop.id} value={stop.id}>
                            {stop.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addStopToRouteForm.control}
                name="stopOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stop Order</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addStopToRouteForm.control}
                name="arrivalTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Arrival Time (Optional)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddStopToRouteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addStopToRouteMutation.isPending}>
                  {addStopToRouteMutation.isPending ? 'Adding...' : 'Add to Route'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to format time
function formatTime(timeString: string): string {
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch (e) {
    return timeString;
  }
}
