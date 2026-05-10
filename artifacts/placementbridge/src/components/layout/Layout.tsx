import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { motion } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
}

export function Layout({ children, showNavbar = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-default selection:bg-primary selection:text-white">
      {showNavbar && <Navbar />}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
}
