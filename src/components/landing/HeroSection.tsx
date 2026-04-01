import { useEffect, useRef } from "react";
import gsap from "gsap";
import ChatHeroInput from "./ChatHeroInput";

interface HeroSectionProps {
  onSend: (message: string) => void;
}

const HeroSection = ({ onSend }: HeroSectionProps) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!titleRef.current || !subtitleRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      titleRef.current,
      { y: 60, opacity: 0, clipPath: "inset(100% 0 0 0)" },
      { y: 0, opacity: 1, clipPath: "inset(0% 0 0 0)", duration: 1.2, delay: 0.5 }
    ).fromTo(
      subtitleRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      "-=0.4"
    );
  }, []);

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=2000"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="https://videos.pexels.com/video-files/1851190/1851190-uhd_2560_1440_25fps.mp4" type="video/mp4" />
      </video>

      {/* Dark overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

      {/* Content */}
      <div className="relative z-10 w-full px-6 sm:px-10 text-center flex flex-col items-center">
        <h1
          ref={titleRef}
          className="font-display text-[clamp(2.5rem,8vw,7rem)] leading-[0.95] tracking-tight text-foreground mb-6 max-w-5xl"
          style={{ opacity: 0 }}
        >
          O FIM DAS PLANILHAS.
          <br />
          <span className="text-primary">DIGA-ME PARA ONDE QUER IR.</span>
        </h1>

        <p
          ref={subtitleRef}
          className="text-white/80 text-sm sm:text-base mb-10 max-w-lg mx-auto tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          style={{ opacity: 0 }}
        >
          Seu estrategista de viagens com inteligência artificial.
          Roteiros com precisão cirúrgica e preços reais.
        </p>

        <ChatHeroInput onSend={onSend} />
      </div>
    </section>
  );
};

export default HeroSection;
