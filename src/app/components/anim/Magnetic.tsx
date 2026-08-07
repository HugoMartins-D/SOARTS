import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/app/lib/gsap";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** Quanto do movimento do mouse é "herdado" pelo elemento (0–1). */
  strength?: number;
};

/**
 * Puxa o elemento levemente na direção do cursor quando ele passa perto —
 * clássico dos sites de portfólio premium. Só liga em desktop com mouse de
 * verdade: `pointer: coarse` (touch) e "reduzir movimento" ficam de fora,
 * já que o efeito é 100% decorativo, não funcional.
 */
export function Magnetic({ children, className, strength = 0.35 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return;

      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

      function handleMove(e: MouseEvent) {
        const rect = el!.getBoundingClientRect();
        xTo((e.clientX - (rect.left + rect.width / 2)) * strength);
        yTo((e.clientY - (rect.top + rect.height / 2)) * strength);
      }
      function handleLeave() {
        xTo(0);
        yTo(0);
      }

      el.addEventListener("mousemove", handleMove);
      el.addEventListener("mouseleave", handleLeave);
      return () => {
        el.removeEventListener("mousemove", handleMove);
        el.removeEventListener("mouseleave", handleLeave);
      };
    },
    { scope: ref, dependencies: [strength] },
  );

  return (
    <div ref={ref} className={className ?? "inline-block"}>
      {children}
    </div>
  );
}
