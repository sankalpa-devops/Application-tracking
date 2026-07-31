// import React, { useState, useEffect } from "react";
// import {
//   BrowserRouter,
//   Routes,
//   Route,
//   Navigate
// } from "react-router-dom";

// import Login from "./pages/Login";
// import ForgotPassword from "./pages/ForgotPassword";
// import ResetPassword from "./pages/ResetPassword";
// import HR from "./pages/HR";
// import Admin from "./pages/Admin";


// // 🔐 Protected Route
// const PrivateRoute = ({ children }) => {
//   const token = localStorage.getItem("token");
//   return token ? children : <Navigate to="/" replace />;
// };

// function App() {

//   // ✅ Store logged-in user in React state
//   const [currentUser, setCurrentUser] = useState({
//     emp_id: null,
//     user_name: null
//   });

//   // ✅ Load user from localStorage on refresh
//   useEffect(() => {
//     setCurrentUser({
//       emp_id: localStorage.getItem("emp_id"),
//       user_name: localStorage.getItem("user_name")
//     });
//   }, []);

//   // ✅ Logout handler (unchanged logic + state sync)
//   const handleLogout = () => {
//     localStorage.clear();
//     setCurrentUser({ emp_id: null, user_name: null });
//     window.location.replace("/");
//   };

//   return (
//     <BrowserRouter>
//       <Routes>

//         {/* PUBLIC ROUTES */}
//         <Route path="/" element={<Login />} />
//         <Route path="/forgot" element={<ForgotPassword />} />
//         <Route path="/reset-password" element={<ResetPassword />} />

//         {/* HR ROUTE */}
//         <Route
//           path="/hr"
//           element={
//             <PrivateRoute>
//               <HR
//                 currentUser={currentUser}
//                 onLogout={handleLogout}
//               />
//             </PrivateRoute>
//           }
//         />

//         {/* ADMIN ROUTE */}
//         <Route
//           path="/admin"
//           element={
//             <PrivateRoute>
//               <Admin
//                 currentUser={currentUser}
//                 onLogout={handleLogout}
//               />
//             </PrivateRoute>
//           }
//         />

//         {/* UNKNOWN ROUTES */}
//         <Route path="*" element={<Navigate to="/" replace />} />

//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;

import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";
import PipelineBoard from "./components/PipelineBoard";

import Admin from "./pages/Admin";
import ForgotPassword from "./pages/ForgotPassword";
import HR from "./pages/HR";
import Login from "./pages/Login";
import PublicJobApply from "./pages/PublicJobApply";
import PublicTransferRequest from "./pages/PublicTransferRequest";
import ResetPassword from "./pages/ResetPassword";
import PublicJoiningForm from "./pages/PublicJoiningForm";


const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
};

function App() {
  const [currentUser, setCurrentUser] = useState(() => ({
    emp_id: localStorage.getItem("emp_id"),
    user_name: localStorage.getItem("user_name")
  }));

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser({ emp_id: null, user_name: null });
    window.location.replace("/");
  };

  return (
    <BrowserRouter>
    <Routes>

  <Route
    path="/"
    element={<Login setCurrentUser={setCurrentUser} />}
  />
  <Route path="/forgot" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />

  <Route
    path="/hr"
    element={
      <PrivateRoute>
        <HR
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      </PrivateRoute>
    }
  />

  <Route
    path="/admin"
    element={
      <PrivateRoute>
        <Admin
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      </PrivateRoute>
    }
  />

  {/* ✅ ADD HERE */}
  <Route
    path="/pipeline"
    element={
      <PrivateRoute>
        <PipelineBoard />
      </PrivateRoute>
    }
  />

  <Route path="/apply/:slug" element={<PublicJobApply />} />
  <Route path="/transfer-request/:slug" element={<PublicTransferRequest />} />
  <Route path="/joining-form/:slug" element={<PublicJoiningForm />} />
  <Route path="*" element={<Navigate to="/" replace />} />

</Routes>
    </BrowserRouter>
  );
}

export default App;
