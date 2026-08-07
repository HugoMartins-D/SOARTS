import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/app/lib/gsap";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Atraso em segundos — usar em índice de listas pra criar stagger sem GSAP timeline. */
  delay?: number;
  /** Deslocamento vertical inicial em px. */
  y?: number;
  /** Ponto do viewport que dispara a entrada (sintaxe do ScrollTrigger `start`). */
  start?: string;
};

/**
 * Revela o conteúdo (fade + leve subida) quando entra na viewport ao rolar
 * a página. Cada instância cria seu próprio ScrollTrigger, escopado via
 * `useGSAP` — limpo automaticamente ao desmontar.
 */
export function Reveal({ children, className, delay = 0, y = 32, start = "top 85%" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      if (prefersReducedMotion()) {
        gsap.set(ref.current, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        ref.current,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start,
            toggleActions: "play none none none",
          },
        },
      );
    },
    { scope: ref, dependencies: [delay, y, start] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
