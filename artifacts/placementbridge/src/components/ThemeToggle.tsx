import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "relative h-9 w-9 rounded-full flex items-center justify-center transition-colors hover:bg-muted",
        className
      )}
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Sun className={cn(
          "h-4 w-4 transition-all",
          theme === "dark" ? "opacity-0 scale-0" : "opacity-100 scale-100"
        )} />
        <Moon className={cn(
          "h-4 w-4 transition-all absolute",
          theme === "dark" ? "opacity-100 scale-100" : "opacity-0 scale-0"
        )} />
      </motion.div>
    </button>
  );
}
