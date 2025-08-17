import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./home.js";
import Products from "./products.js";
import Logbook from "./logbook.js"; 
import Profile from "./profile/profile.js";
import Toolbar from "./toolbar.js";



function App() {
  return (
    <Router>
      <div className="">
      </div>
      <Toolbar />
      <section className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/achievements" element={<Products />} />
          <Route path="/achievements" element={<Products />} />
          <Route path="/achievements" element={<Products />} />
          <Route path="/logbook" element={<Logbook />} />
          <Route path="/profile" element={<Profile />} />
          
        </Routes>
      </section>
    </Router>
  );
}

export default App;
