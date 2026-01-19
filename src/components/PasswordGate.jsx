import React, { useState, useEffect } from "react";
import { Input, Button, Field, Label, Heading, Text } from "@/catalyst";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { verifyPassword } from "@/services/api";
import toast from "react-hot-toast";

export default function PasswordGate({ children }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if already authenticated in session storage
    const authData = sessionStorage.getItem("elkPeakAuth");
    if (authData) {
      const parsed = JSON.parse(authData);
      // Restore session if authenticated (password may be missing but that's OK for viewing)
      if (parsed.authenticated) {
        setIsAuthenticated(true);
        setIsAdmin(parsed.isAdmin);
      }
      setIsChecking(false);
    } else {
      setIsChecking(false);
    }
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter a password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyPassword(password);

      if (result && result.authenticated) {
        setIsAuthenticated(true);
        setIsAdmin(result.isAdmin || false);

        // Store in session storage
        sessionStorage.setItem(
          "elkPeakAuth",
          JSON.stringify({
            isAdmin: result.isAdmin || false,
            authenticated: true,
          })
        );

        toast.success("Access granted");
      } else {
        toast.error("Invalid password");
        setPassword("");
      }
    } catch (error) {
      console.error("Error authenticating:", error);
      toast.error(error.message || "Error authenticating. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="h-svh flex justify-center items-center">
        <div className="text-center">
          <Text>Verifying access...</Text>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-svh flex justify-center items-center bg-zinc-50 dark:bg-zinc-900">
        <div className="w-full max-w-md p-8">
          <div className="rounded-lg bg-white p-8 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:ring-white/10">
            <Heading className="mb-4 text-center">
              Metrics Dashboard
            </Heading>
            <Text className="mb-6 text-center text-zinc-500 dark:text-zinc-400">
              Please enter your password to access the dashboard
            </Text>
            <form onSubmit={handlePasswordSubmit}>
              <Field>
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="off"
                    className="pr-10"
                  />
                  {showPassword ? (
                    <EyeSlashIcon
                      className="size-6 absolute top-1/2 -translate-y-1/2 right-2 text-zinc-500 data-[hover]:text-zinc-950 data-[active]:text-zinc-950 cursor-pointer"
                      onClick={() => setShowPassword(false)}
                    />
                  ) : (
                    <EyeIcon
                      className="size-6 absolute top-1/2 -translate-y-1/2 right-2 text-zinc-500 data-[hover]:text-zinc-950 data-[active]:text-zinc-950 cursor-pointer"
                      onClick={() => setShowPassword(true)}
                    />
                  )}
                </div>
              </Field>
              <Button
                type="submit"
                className="mt-6 w-full"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Access Dashboard"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render children with isAdmin prop
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {React.cloneElement(children, { isAdmin })}
    </div>
  );
}

