import React from "react";
import { Link } from "react-router-dom";
import { useUserContext } from "../context/userContext";
import AuthPanel from "../authHandling/authPanel";

export default function Toolbar() {
  const { userID } = useUserContext();
  const isLoggedIn = !!userID;

  return (
    <section className="fixed left-0 right-0 top-0 z-50 border-b border-green-300 bg-gray-50 shadow-md">
      <section className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Left links */}
        <section className="flex space-x-3">
          <Link
            to="/"
            className="flex items-center justify-center rounded-xl border-2 border-green-300 bg-white px-3 py-2 font-semibold text-green-800 transition hover:bg-green-200"
          >
            Home
          </Link>

          {isLoggedIn && (
            <>
              <Link
                to="/planHike"
                className="rounded-xl border-2 border-green-300 bg-white px-4 py-2 font-semibold text-green-800 transition hover:bg-green-200"
              >
                Plan Hike
              </Link>
              <Link
                to="/logbook"
                className="rounded-xl border-2 border-green-300 bg-white px-4 py-2 font-semibold text-green-800 transition hover:bg-green-200"
              >
                Logbook
              </Link>
              <Link
                to="/profile"
                className="rounded-xl border-2 border-green-300 bg-white px-4 py-2 font-semibold text-green-800 transition hover:bg-green-200"
              >
                Profile
              </Link>
              <Link
                to="/search"
                className="rounded-xl border-2 border-green-300 bg-white px-4 py-2 font-semibold text-green-800 transition hover:bg-green-200"
              >
                Search
              </Link>
            </>
          )}
        </section>

        {/* Right Auth Panel */}
        <section className="flex items-center">
          <AuthPanel />
        </section>
      </section>
    </section>
  );
}
