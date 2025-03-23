import { useEffect } from "react";
import { useLocation } from "wouter";
import { isAuthenticated, isAdmin, isStudent } from "@/lib/auth";
import RegisterForm from "@/components/auth/RegisterForm";

export default function Register() {
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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="flex justify-center mb-8">
        <div className="text-center">
          <img 
            className="mx-auto h-16 w-auto"
            src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png"
            alt="College Bus Tracking Logo"
          />
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            College Bus Tracking
          </h2>
        </div>
      </div>
      
      <RegisterForm />
    </div>
  );
}
