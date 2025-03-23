import { useEffect } from "react";
import { useLocation } from "wouter";
import { isAuthenticated, isAdmin, isStudent } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";

export default function Login() {
  const [, navigate] = useLocation();

  // Check if user is already authenticated and redirect appropriately
  useEffect(() => {
    if (isAuthenticated()) {
      if (isAdmin()) {
        navigate("/admin/dashboard");
      } else if (isStudent()) {
        navigate("/student/dashboard");
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img 
            className="mx-auto h-20 w-auto"
            src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png"
            alt="College Bus Tracking Logo"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            College Bus Tracking
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}
