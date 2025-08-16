import React from "react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/clerk-react";

export default function AuthPanel() {
  const { getToken } = useAuth();

  async function callProtected() {
    try {
      const token = await getToken();
      const res = await fetch("https://sdp-backend-production.up.railway.app/protected", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      console.log(data);
      alert("API response: " + JSON.stringify(data));
    } catch (err) {
      console.error("API call failed:", err);
      alert("Failed to fetch protected data. Check console for details.");
    }
  }

  return (
    <section className="flex items-center space-x-2">
      {/* Signed out buttons */}
      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-3 py-1 bg-green-200 text-green-800 font-semibold rounded-md hover:bg-green-300 transition">
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="px-3 py-1 bg-green-200 text-green-800 font-semibold rounded-md hover:bg-green-300 transition">
            Sign Up
          </button>
        </SignUpButton>
      </SignedOut>

      {/* Signed in user */}
      <SignedIn>
        <UserButton />
        <button
          onClick={callProtected}
          className="px-3 py-1 bg-green-400 hover:bg-green-500 text-white font-semibold rounded-md transition"
        >
          Call API
        </button>
      </SignedIn>
    </section>
  );
}
