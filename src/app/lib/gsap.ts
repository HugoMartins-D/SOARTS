import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Registro único do plugin — importar deste arquivo em vez de "gsap"
// direto garante que o ScrollTrigger já está registrado em qualquer
// lugar que precise dele, sem repetir o registerPlugin em todo componente.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger };
