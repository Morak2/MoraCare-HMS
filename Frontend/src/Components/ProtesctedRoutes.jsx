// import { Navigate, Outlet } from 'react-router-dom';

// const ProtectedRoute = ({ allowedRoles }) => {
//   // 1. Get user data from wherever you stored it (e.g., localStorage)
//   const token = localStorage.getItem('token');
  
//   // You should store the user role in localStorage during login
//   const userRole = localStorage.getItem('userRole'); 

//   if (!token) {
//     // No token? Back to the home page or login
//     return <Navigate to="/" replace />;
//   }

//   if (allowedRoles && !allowedRoles.includes(userRole)) {
//     // Logged in, but wrong role? Deny access
//     return <Navigate to="/unauthorized" replace />;
//   }

//   // Everything is fine? Render the requested page
//   return <Outlet />;
// };


// export default ProtectedRoute;

import { Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  return <Outlet />;
};

export default ProtectedRoute;