"use client";

import { useEffect, useState, type ReactNode } from "react";
import Sidebar from "../components/SideBar";
import MenuBar from "../components/MenuBar";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <div className="print:hidden">{isMobile ? <MenuBar /> : <Sidebar />}</div>
      <main className="print:m-0 print:p-0">{children}</main>
    </>
  );
}
