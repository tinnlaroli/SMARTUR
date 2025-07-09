import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import About from "../pages/About";
import Landing from "../pages/Landing";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/about" element={<About />} />
      <Route path="/" element={<Landing />} />
    </Routes>
  );
}
