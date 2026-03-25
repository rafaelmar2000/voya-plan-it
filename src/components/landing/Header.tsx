import { useEffect, useRef } from "react";
import gsap from "gsap";

interface HeaderProps {
  onOpenAuth: () => void;
}

const Header = ({ onOpenAuth }: HeaderProps) => {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!headerRef.current) return;
    gsap.fromTo(
      headerRef.current,
      { y: -40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.3 }
    );
  }, []);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-5"
      style={{ opacity: 0 }}
    >
      <span className="font-display text-2xl sm:text-3xl tracking-[0.25em] text-foreground">
        VOYA
      </span>

      <button
        onClick={onOpenAuth}
        className="border border-foreground/30 text-foreground text-xs sm:text-sm tracking-wider px-5 py-2.5 hover:bg-foreground/10 hover:border-foreground/50 transition-all duration-300"
      >
        Acessar Portal
      </button>
    </header>
  );
};

export default Header;
