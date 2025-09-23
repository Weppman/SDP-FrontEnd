import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./home/home.js";
import PlanHike from "./planHike.js";
import Logbook from "./logbook.js";
import Profile from "./profile/profile.js";
import Toolbar from "./toolbar/toolbar.js";
import SearchUsersUI from "./search/search.js";
import ProtectedRoute from "./components/ProtectedRoute.js"; // ✅ make sure this is default export

/* eslint-disable react-hooks/exhaustive-deps */


function App() {
  return (
    <Router>
      <Toolbar />
      <section className="p-4">
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Home />} />

          {/* Protected routes */}
          <Route
            path="/planHike"
            element={
              <ProtectedRoute>
                <PlanHike />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logbook"
            element={
              <ProtectedRoute>
                <Logbook />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:userID"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchUsersUI />
              </ProtectedRoute>
            }
          />
        </Routes>
      </section>
    </Router>
  );
}

export default App;
