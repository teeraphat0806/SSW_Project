"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/SideBarChatbot";
import MenuBar from "../components/MenuBarChatBot";
export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return (
    <>
      {isMobile ? <MenuBar /> : <Sidebar />}
      <main>{children}</main>
    </>
  );
}
