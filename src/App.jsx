import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import MetricsDashboard from "./components/MetricsDashboard";
import PasswordGate from "./components/PasswordGate";
import Layout from "./components/Layout";

export default function App() {
  return (
    <>
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
          </Route>
          <Route
            path="/metrics"
            element={
              <PasswordGate>
                <MetricsDashboard />
              </PasswordGate>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

