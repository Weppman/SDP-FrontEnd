import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./home.js";
import Products from "./products.js";

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
          <Route path="/products" element={<Products />} />
        </Routes>
      </section>
      <footer className="s fixed bottom-0 left-0 right-0 bg-gray-800 p-2 text-center text-white">
        <p className="text-sm">&copy; 2025 Africa's Link. All rights reserved.</p>
      </footer>
    </Router>
  );
}

export default App;
