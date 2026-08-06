import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  motion,
  motionValue,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTime,
  useTransform,
} from "motion/react";

/**
 * Hero com revelação "gooey" (metaballs).
 *
 * Duas imagens são empilhadas: `baseImage` fica visível sempre, e `revealImage`
 * aparece apenas dentro de bolhas orgânicas que seguem o cursor. As bolhas são
 * círculos SVG passando por `feGaussianBlur` + `feColorMatrix`: o blur espalha
 * as bordas e a matriz corta o alpha num limiar duro, então círculos próximos se
 * fundem como mercúrio em vez de se sobrepor.
 *
 * PARA TROCAR AS FOTOS: passe `revealImage` com a segunda foto e remova
 * `baseFilter`/`revealFilter`. As duas imagens precisam ter o MESMO
 * enquadramento, senão a revelação "pula" ao passar o mouse.
 *
 * O efeito é desktop-only por escolha: sem cursor ele não existe, e o
 * `feGaussianBlur` animado a 60fps é caro em GPU fraca. No mobile só a
 * `baseImage` é renderizada.
 *
 * `prefers-reduced-motion` NÃO desliga a revelação, só o movimento gratuito:
 * caem as bolhas que vagam sozinhas, o satélite que orbita e o parallax. O
 * rastro do cursor continua, porque responde direto ao gesto do usuário — é
 * manipulação direta, não animação ambiente. Desligar tudo apagava a peça
 * central do hero para quem usa "Reduzir movimento" no sistema.
 */

const TAU = Math.PI * 2;

export type GooeyRevealHeroProps = {
  /** Imagem sempre visível. */
  baseImage: string;
  /** Imagem revelada dentro das bolhas. Pode ser a mesma de `baseImage`. */
  revealImage: string;
  /** `filter` CSS aplicado à camada base (placeholder até definirem o tratamento). */
  baseFilter?: string;
  /** `filter` CSS aplicado à camada revelada. */
  revealFilter?: string;
  /** Deslocamento em px do parallax que segue o mouse. */
  parallaxStrength?: number;
  /** Raio de referência das bolhas em px. */
  blobSize?: number;
  /** Bolhas autônomas, que vagam sozinhas para a máscara nunca ficar parada. */
  autoBlobCount?: number;
  /** Liga o rastro do cursor sem precisar mexer o mouse (debug). */
  previewCursor?: boolean;
  /**
   * Deslocamento máximo da borda em px. É o que tira a bolha de "círculo
   * borrado" e leva para "gota": a silhueta já fundida é empurrada por um campo
   * de ruído. 0 desliga e volta ao visual puramente circular.
   */
  liquidStrength?: number;
  /**
   * Frequência do ruído. Menor = ondulações mais largas e preguiçosas, maior =
   * borda mais recortada. Acima de ~0.05 a bolha começa a esfarelar.
   */
  liquidScale?: number;
  /**
   * `preserveAspectRatio` do SVG, o enquadramento das duas fotos. O padrão
   * encaixa sem cortar, centralizado e ancorado embaixo. Use `xMidYMid slice`
   * para preencher cortando as sobras.
   */
  fit?: string;
  id?: string;
  className?: string;
  children?: React.ReactNode;
};

export function GooeyRevealHero({
  baseImage,
  revealImage,
  baseFilter,
  revealFilter,
  parallaxStrength = 3,
  blobSize = 140,
  autoBlobCount = 12,
  previewCursor = false,
  liquidStrength = 22,
  liquidScale = 0.012,
  fit = "xMidYMax meet",
  id,
  className,
  children,
}: GooeyRevealHeroProps) {
  const containerRef = useRef<HTMLElement>(null);

  const prefersReducedMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // A revelação em si só depende de haver cursor. O movimento ambiente é que
  // cede ao prefers-reduced-motion.
  const effectEnabled = isDesktop;
  const ambientMotion = !prefersReducedMotion;
  const cursorActive = isHovering || previewCursor;
  const parallax = ambientMotion ? parallaxStrength : 0;

  // Posição do cursor relativa à CAMADA REVELADA, não ao container: as
  // coordenadas dos círculos da máscara vivem no espaço do elemento mascarado,
  // então medir pelo container faria a bolha nascer deslocada do ponteiro.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Razões -1..1 dentro do container, usadas só pelo parallax.
  const mouseXRatio = useMotionValue(0);
  const mouseYRatio = useMotionValue(0);

  const smooth = { stiffness: 300, damping: 40 };
  const smoothX = useSpring(mouseXRatio, smooth);
  const smoothY = useSpring(mouseYRatio, smooth);

  const baseX = useTransform(smoothX, [-1, 1], [parallax, -parallax]);
  const baseY = useTransform(smoothY, [-1, 1], [parallax, -parallax]);
  const revealX = useTransform(smoothX, [-1, 1], [parallax * 2, -parallax * 2]);
  const revealY = useTransform(smoothY, [-1, 1], [parallax * 2, -parallax * 2]);

  useEffect(() => {
    if (!effectEnabled) return;

    const handleMove = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const bounds = container.getBoundingClientRect();
      const inside =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;

      setIsHovering(inside);

      if (!inside) {
        mouseXRatio.set(0);
        mouseYRatio.set(0);
        return;
      }

      mouseXRatio.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1);
      mouseYRatio.set(((event.clientY - bounds.top) / bounds.height) * 2 - 1);

      // O SVG não tem viewBox e preenche o container, então uma unidade de
      // usuário do SVG é um pixel CSS e estas coordenadas servem direto para
      // os círculos da máscara.
      mouseX.set(event.clientX - bounds.left);
      mouseY.set(event.clientY - bounds.top);
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [effectEnabled, mouseX, mouseY, mouseXRatio, mouseYRatio]);

  // Rastro do cursor: rigidez decrescente faz cada círculo chegar mais tarde,
  // criando a cauda. Declarados um a um de propósito — gerar isto num laço
  // chamaria hooks dentro de função e quebra as regras de hooks.
  const headX = useSpring(mouseX, { stiffness: 250, damping: 30 });
  const headY = useSpring(mouseY, { stiffness: 250, damping: 30 });
  const bodyOneX = useSpring(mouseX, { stiffness: 220, damping: 34 });
  const bodyOneY = useSpring(mouseY, { stiffness: 220, damping: 34 });
  const bodyTwoX = useSpring(mouseX, { stiffness: 190, damping: 38 });
  const bodyTwoY = useSpring(mouseY, { stiffness: 190, damping: 38 });

  // Satélite orbitando a cabeça do rastro, para a silhueta nunca virar um círculo.
  const time = useTime();
  const wobble = blobSize * 0.35;
  const satelliteX = useTransform([time, headX], ([t, x]: number[]) => x + Math.sin(t * 0.002) * wobble);
  const satelliteY = useTransform([time, headY], ([t, y]: number[]) => y + Math.cos(t * 0.002) * wobble);

  // MotionValues criados imperativamente com `motionValue()`, fora de hooks,
  // para que a contagem de hooks não dependa de `autoBlobCount`.
  const autoBlobs = useMemo(
    () =>
      Array.from({ length: autoBlobCount }, () => ({
        mainX: motionValue(0),
        mainY: motionValue(0),
        satX: motionValue(0),
        satY: motionValue(0),
        phaseX: Math.random() * TAU,
        phaseY: Math.random() * TAU,
        speedX: 0.0005 + Math.random() * 0.0005,
        speedY: 0.0003 + Math.random() * 0.0005,
      })),
    [autoBlobCount],
  );

  useAnimationFrame((t) => {
    const container = containerRef.current;
    if (!effectEnabled || !ambientMotion || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const satRadius = blobSize * 0.35;

    for (const blob of autoBlobs) {
      const mainX = ((Math.sin(t * blob.speedX + blob.phaseX) + 1) / 2) * width;
      const mainY = ((Math.cos(t * blob.speedY + blob.phaseY) + 1) / 2) * height;
      blob.mainX.set(mainX);
      blob.mainY.set(mainY);
      blob.satX.set(mainX + Math.sin(t * 0.002 + blob.phaseX) * satRadius);
      blob.satY.set(mainY + Math.cos(t * 0.002 + blob.phaseY) * satRadius);
    }
  });

  const maskId = useId();
  const filterId = useId();

  return (
    <section ref={containerRef} id={id} className={className}>
      {/*
        Tudo dentro de UM SVG de propósito. A versão anterior empilhava duas
        <div> e mascarava a de cima com `mask: url(#id)` em CSS — isso não
        funciona no WebKit, que não resolve referência a um <mask> SVG a partir
        de CSS em elemento HTML. O Safari renderizava a camada revelada inteira,
        sem máscara. Máscara aplicada a um <image> DENTRO do SVG é suportada em
        todos os navegadores.
      */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
        aria-hidden
      >
        <defs>
          {/* O par blur + colorMatrix é o que funde as bolhas: o blur espalha
              o alpha e a matriz (18 -7) o corta num limiar duro.
              color-interpolation-filters="sRGB" é obrigatório — no padrão
              linearRGB o limiar cai em ponto diferente em cada navegador.

              A região do filtro é alargada em 25% porque blur e deslocamento
              empurram pixels para fora da bbox dos círculos, e o padrão
              (-10%/120%) cortaria a borda deformada. */}
          <filter
            id={filterId}
            colorInterpolationFilters="sRGB"
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
          >
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" result="merged" />

            {liquidStrength > 0 && (
              <>
                {/*
                  `fractalNoise`, não `turbulence`: o segundo aplica valor
                  absoluto e cria vincos duros, o primeiro ondula suave — é o
                  que parece líquido. Centrado em 0.5, então o deslocamento
                  puxa para os dois lados em vez de enviesar numa direção.

                  O ruído é ESTÁTICO de propósito. Animar `baseFrequency` ou
                  `seed` obriga o navegador a regerar o campo de ruído a cada
                  frame, que é o passo caro. Como as bolhas se movem, elas
                  atravessam um campo fixo e a borda se remodela sozinha — a
                  aparência de rastejar sai de graça.
                */}
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency={liquidScale}
                  numOctaves={2}
                  seed={7}
                  result="noise"
                />
                {/* Deslocar DEPOIS do limiar. Antes do blur, o blur alisaria a
                    ondulação de volta e não sobraria nada. */}
                <feDisplacementMap
                  in="merged"
                  in2="noise"
                  scale={liquidStrength}
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </>
            )}
          </filter>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <g filter={`url(#${filterId})`}>
              {cursorActive && (
                <>
                  {ambientMotion && (
                    <motion.circle cx={satelliteX} cy={satelliteY} r={blobSize * 0.6} fill="white" />
                  )}
                  <motion.circle cx={headX} cy={headY} r={blobSize * 0.8} fill="white" />
                  <motion.circle cx={bodyOneX} cy={bodyOneY} r={blobSize * 0.6} fill="white" />
                  <motion.circle cx={bodyTwoX} cy={bodyTwoY} r={blobSize * 0.45} fill="white" />
                </>
              )}
              {ambientMotion &&
                autoBlobs.map((blob, index) => (
                  <Fragment key={index}>
                    <motion.circle cx={blob.satX} cy={blob.satY} r={blobSize * 0.6} fill="white" />
                    <motion.circle cx={blob.mainX} cy={blob.mainY} r={blobSize * 0.8} fill="white" />
                  </Fragment>
                ))}
            </g>
          </mask>
        </defs>

        {/* `preserveAspectRatio` faz o papel do antigo
            `background-size: contain` + `background-position: center bottom`:
            `meet` encaixa sem cortar, `xMid` centraliza, `YMax` ancora embaixo. */}
        <motion.image
          href={baseImage}
          x={0}
          y={0}
          width="100%"
          height="100%"
          preserveAspectRatio={fit}
          style={{ filter: baseFilter, x: baseX, y: baseY }}
        />

        {effectEnabled && (
          <motion.image
            href={revealImage}
            x={0}
            y={0}
            width="100%"
            height="100%"
            preserveAspectRatio={fit}
            mask={`url(#${maskId})`}
            style={{ filter: revealFilter, x: revealX, y: revealY }}
          />
        )}
      </svg>

      {children}
    </section>
  );
}
