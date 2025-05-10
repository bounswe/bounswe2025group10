/**
 * @vitest-environment jsdom
 */
 import React from "react";
 import { describe, it, expect, beforeEach } from "vitest";
 import { MemoryRouter, Routes, Route } from "react-router-dom";
 import { render, screen } from "@testing-library/react";
 import ProtectedAdminRoute from "../../Login/ProtectedAdminRoute"; // adjust path as needed
 
 describe("ProtectedAdminRoute", () => {
   beforeEach(() => {
     localStorage.clear();
   });
 
   it("redirects to /login if no token is found", () => {
     render(
       <MemoryRouter initialEntries={["/admin"]}>
         <Routes>
           <Route path="/admin" element={<ProtectedAdminRoute />}>
             <Route index element={<h1>Admin Panel</h1>} />
           </Route>
           <Route path="/login" element={<h1>Login Page</h1>} />
         </Routes>
       </MemoryRouter>
     );
 
     expect(screen.getByText("Login Page")).toBeInTheDocument();
   });
 
   it("renders child route when token is present", () => {
     localStorage.setItem("accessToken", "fake-admin-token");
 
     render(
       <MemoryRouter initialEntries={["/admin"]}>
         <Routes>
           <Route path="/admin" element={<ProtectedAdminRoute />}>
             <Route index element={<h1>Admin Panel</h1>} />
           </Route>
           <Route path="/login" element={<h1>Login Page</h1>} />
         </Routes>
       </MemoryRouter>
     );
 
     expect(screen.getByText("Admin Panel")).toBeInTheDocument();
   });
 });