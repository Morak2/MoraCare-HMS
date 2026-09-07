import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import ScrollToTop from "../Components/ScrollToTop";

export default function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
      <ScrollToTop />
    </>
  );
}