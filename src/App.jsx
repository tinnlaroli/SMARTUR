import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "../src/pages/Dashboard";
import Landing from "../src/pages/Landing";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
