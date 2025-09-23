import React from "react";
import { Navigate } from "react-router-dom";
import { useUserContext } from "../context/userContext";

export default function ProtectedRoute({ children }) {
  const { status } = useUserContext();

  if (status !== "user") {
    // If not logged in, redirect to home
    return <Navigate to="/" replace />;
  }

  // If logged in, render the page
  return children;
}
