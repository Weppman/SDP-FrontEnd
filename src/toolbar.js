import React from "react";
import { Link } from "react-router-dom";
import AuthPanel from "./authHandling/authPanel"; // adjust path if needed

export default function Toolbar() {
  return (
    <section className="bg-gray-50 fixed top-0 left-0 right-0 z-50 shadow-md border-b border-green-300">
      <section className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">

        {/* Left links */}
        <section className="flex space-x-3">
          <Link
            to="/"
            className="flex items-center justify-center border-2 border-green-300 bg-white px-3 py-2 rounded-xl font-semibold text-green-800 hover:bg-green-200 transition"
          >
            Home
          </Link>
          <Link
            to="/about"
            className="border-2 border-green-300 bg-white px-4 py-2 rounded-xl font-semibold text-green-800 hover:bg-green-200 transition"
          >
            About Us
          </Link>
          <Link
            to="/products"
            className="border-2 border-green-300 bg-white px-4 py-2 rounded-xl font-semibold text-green-800 hover:bg-green-200 transition"
          >
            Products
          </Link>
          <Link
            to="/contact"
            className="border-2 border-green-300 bg-white px-4 py-2 rounded-xl font-semibold text-green-800 hover:bg-green-200 transition"
          >
            Contact Us
          </Link>
        </section>

        {/* Right Auth Panel */}
        <section className="flex items-center">
          <AuthPanel />
        </section>

      </section>
    </section>
  );
}
