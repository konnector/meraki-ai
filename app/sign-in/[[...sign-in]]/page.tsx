"use client"

import { SignIn } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  // Redirect if user is already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && !redirecting) {
      setRedirecting(true);
      router.push("/dashboard");
    }
  }, [isSignedIn, isLoaded, router, redirecting]);

  if (redirecting) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting to dashboard...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <SignIn 
        redirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-md rounded-lg border border-gray-200",
            formButtonPrimary: "bg-gray-900 hover:bg-gray-800 text-white",
            formFieldInput: "border-gray-300 focus:ring-gray-900 focus:border-gray-900",
            footerActionLink: "text-gray-900 hover:text-gray-800",
            headerTitle: "text-gray-900",
            headerSubtitle: "text-gray-600",
            socialButtonsBlockButton: "border-gray-300 text-gray-900",
            socialButtonsBlockButtonText: "text-gray-600",
            formFieldLabel: "text-gray-700"
          },
          variables: {
            colorPrimary: '#111827', // gray-900
            colorText: '#111827',
            colorTextSecondary: '#4B5563', // gray-600
            colorBackground: '#FFFFFF',
            colorDanger: '#DC2626', // red-600
            colorSuccess: '#059669', // green-600
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
            fontFamilyButtons: 'Inter, ui-sans-serif, system-ui, sans-serif'
          }
        }}
      />
    </div>
  );
} 