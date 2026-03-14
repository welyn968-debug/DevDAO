import React from "react";

export const ClerkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// minimal stubs to satisfy runtime if Clerk is not installed
export const SignInButton: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{children || "Sign in"}</>
);
