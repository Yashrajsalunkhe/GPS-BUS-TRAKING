import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { getCurrentUser, logout } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LayoutDashboard, 
  Bus, 
  UserCircle, 
  MapPin, 
  BarChart, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const user = getCurrentUser();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isActive = (path: string) => {
    return location === path;
  };

  // Navigation items with icons and paths
  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard className="w-6 h-6 mr-3" />, path: '/admin/dashboard' },
    { name: 'Bus Management', icon: <Bus className="w-6 h-6 mr-3" />, path: '/admin/buses' },
    { name: 'Driver Management', icon: <UserCircle className="w-6 h-6 mr-3" />, path: '/admin/drivers' },
    { name: 'Student Management', icon: <UserCircle className="w-6 h-6 mr-3" />, path: '/admin/students' },
    { name: 'Route Management', icon: <MapPin className="w-6 h-6 mr-3" />, path: '/admin/routes' },
    { name: 'Payments & Reports', icon: <BarChart className="w-6 h-6 mr-3" />, path: '/admin/payments' },
    { name: 'Settings', icon: <Settings className="w-6 h-6 mr-3" />, path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/admin/dashboard">
                <div className="flex items-center cursor-pointer">
                  <span className="ml-2 text-xl font-semibold">Bus Tracker <span className="text-sm font-normal">Admin</span></span>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm hidden md:inline-block">{user?.username}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 rounded-full focus:ring-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar - Desktop */}
        <div className="w-64 bg-white shadow-md hidden md:block">
          <div className="h-full flex flex-col">
            <nav className="flex-1 px-2 py-4 bg-white space-y-1">
              {navItems.map(item => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`${
                      isActive(item.path)
                        ? 'bg-gray-100 text-primary-dark'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary-dark'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    {item.icon}
                    {item.name}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="absolute inset-0 flex z-40">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50" 
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="h-full overflow-y-auto">
                <div className="p-4 flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.username}
                    </p>
                    <p className="text-xs font-medium text-gray-500">
                      Administrator
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-auto"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                
                <nav className="px-2 py-4 bg-white space-y-1">
                  {navItems.map(item => (
                    <Link key={item.path} href={item.path}>
                      <a
                        className={`${
                          isActive(item.path)
                            ? 'bg-gray-100 text-primary-dark'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-primary-dark'
                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.icon}
                        {item.name}
                      </a>
                    </Link>
                  ))}
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <a
                      href="#"
                      className="text-gray-600 hover:bg-gray-50 hover:text-primary-dark group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="w-6 h-6 mr-3" />
                      Logout
                    </a>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile bottom navigation bar */}
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-white shadow-lg md:hidden">
          <div className="flex justify-between items-center">
            {navItems.slice(0, 4).map(item => (
              <Link key={item.path} href={item.path}>
                <a className={`flex flex-col items-center justify-center w-full p-3 ${
                  isActive(item.path) ? 'text-primary' : 'text-gray-500'
                }`}>
                  {item.icon.props.children}
                  <span className="text-xs mt-1">{item.name.split(' ')[0]}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
