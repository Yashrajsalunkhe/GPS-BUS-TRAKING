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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { fetchBusesWithRoutes, fetchAllRoutes, createBus, updateBus, deleteBus } from '@/lib/api';
import { Bus, Route } from '@shared/schema';
import { Edit, Trash2, Plus } from 'lucide-react';

// Form schema
const busFormSchema = z.object({
  busNumber: z.string().min(1, "Bus number is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  model: z.string().optional(),
  routeId: z.coerce.number().optional(),
  active: z.boolean().default(true)
});

type BusFormValues = z.infer<typeof busFormSchema>;

export default function BusManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  
  // Fetch buses with routes
  const { data: buses = [], isLoading } = useQuery({
    queryKey: ['/api/buses/with-routes'],
    queryFn: fetchBusesWithRoutes
  });
  
  // Fetch routes for dropdown
  const { data: routes = [] } = useQuery({
    queryKey: ['/api/routes'],
    queryFn: fetchAllRoutes
  });
  
  // Add bus mutation
  const addBusMutation = useMutation({
    mutationFn: createBus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buses/with-routes'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Bus added successfully",
      });
      addForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add bus",
        variant: "destructive",
      });
    },
  });
  
  // Edit bus mutation
  const editBusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Bus> }) => updateBus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buses/with-routes'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Bus updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bus",
        variant: "destructive",
      });
    },
  });
  
  // Delete bus mutation
  const deleteBusMutation = useMutation({
    mutationFn: (id: number) => deleteBus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buses/with-routes'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "Bus deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bus",
        variant: "destructive",
      });
    },
  });
  
  // Form for adding a new bus
  const addForm = useForm<BusFormValues>({
    resolver: zodResolver(busFormSchema),
    defaultValues: {
      busNumber: "",
      capacity: 50,
      model: "",
      active: true
    },
  });
  
  // Form for editing a bus
  const editForm = useForm<BusFormValues>({
    resolver: zodResolver(busFormSchema),
    defaultValues: {
      busNumber: "",
      capacity: 50,
      model: "",
      active: true
    },
  });
  
  // Open edit dialog and populate form
  const handleEditBus = (bus: Bus) => {
    setSelectedBus(bus);
    editForm.reset({
      busNumber: bus.busNumber,
      capacity: bus.capacity,
      model: bus.model || "",
      routeId: bus.routeId,
      active: bus.active
    });
    setIsEditDialogOpen(true);
  };
  
  // Open delete dialog
  const handleDeleteBus = (bus: Bus) => {
    setSelectedBus(bus);
    setIsDeleteDialogOpen(true);
  };
  
  // Submit add form
  const onAddSubmit = (data: BusFormValues) => {
    addBusMutation.mutate(data);
  };
  
  // Submit edit form
  const onEditSubmit = (data: BusFormValues) => {
    if (selectedBus) {
      editBusMutation.mutate({ id: selectedBus.id, data });
    }
  };
  
  // Confirm delete
  const confirmDelete = () => {
    if (selectedBus) {
      deleteBusMutation.mutate(selectedBus.id);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bus Management</CardTitle>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Bus
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                      No buses found. Add a new bus to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  buses.map((bus: any) => (
                    <TableRow key={bus.id}>
                      <TableCell className="font-medium">{bus.busNumber}</TableCell>
                      <TableCell>
                        {bus.active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>{bus.capacity}</TableCell>
                      <TableCell>{bus.model || '-'}</TableCell>
                      <TableCell>{bus.route?.name || 'Unassigned'}</TableCell>
                      <TableCell>{bus.driver?.name || 'Unassigned'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="icon" onClick={() => handleEditBus(bus)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteBus(bus)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Add Bus Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Bus</DialogTitle>
            <DialogDescription>
              Enter the details for the new bus.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="busNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bus Number</FormLabel>
                    <FormControl>
                      <Input placeholder="BUS-101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Volvo 9400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="routeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Route</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a route" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {routes.map((route: Route) => (
                          <SelectItem key={route.id} value={route.id.toString()}>
                            {route.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
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
                      <FormDescription>
                        Is this bus currently active?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addBusMutation.isPending}>
                  {addBusMutation.isPending ? 'Adding...' : 'Add Bus'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Bus Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bus</DialogTitle>
            <DialogDescription>
              Update the details for this bus.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="busNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bus Number</FormLabel>
                    <FormControl>
                      <Input placeholder="BUS-101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Volvo 9400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="routeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Route</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a route" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {routes.map((route: Route) => (
                          <SelectItem key={route.id} value={route.id.toString()}>
                            {route.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
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
                      <FormDescription>
                        Is this bus currently active?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editBusMutation.isPending}>
                  {editBusMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Bus Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bus</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bus? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBus && (
            <div className="py-4">
              <p className="font-medium">Bus Number: {selectedBus.busNumber}</p>
              <p className="text-sm text-gray-500">This will permanently remove this bus from the system.</p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteBusMutation.isPending}
            >
              {deleteBusMutation.isPending ? 'Deleting...' : 'Delete Bus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
