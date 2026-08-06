import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Camera, Menu, Play, X } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { GooeyRevealHero } from "@/app/components/hero/gooey-reveal-hero";
import GradientWaves from "@/app/components/hero/GradientWaves.jsx";
import { FranciscoCard } from "@/app/components/sobre/francisco-card";
import { fetchPublicProjects, publicMediaUrl, type ProjectRow } from "@/utils/projects";
import imgPromenac from "@/imports/LpSoarts-1/4f9ded526e079a81f945748a1d5b20399db88462.png";
import imgGlobo from "@/imports/LpSoarts-1/ebd2fbc1227c2348e8af1bd608466186a92edd14.png";
import imgHelp from "@/imports/LpSoarts-1/logo-help.webp";
import imgPixel from "@/imports/LpSoarts-1/logo-pixel.webp";
import svgPaths from "@/imports/LpSoarts-1/svg-0n58f4rxvu";

const ORANGE = "#FF5200";

const NAV_LINKS = [
  { href: "#inicio", label: "INÍCIO" },
  { href: "#projetos", label: "PROJETOS" },
  { href: "#sobre", label: "SOBRE" },
  { href: "#contato", label: "CONTATO" },
];

const BRANDS = [
  { src: imgPixel, alt: "JB Plus Size" },
  { src: imgPromenac, alt: "Promenac/Camvel" },
  { src: imgGlobo, alt: "Grupo Globo" },
  { src: imgHelp, alt: "HelpSmart" },
];

/**
 * PLACEHOLDER — números fictícios só pra aprovação de layout com o cliente.
 * Trocar pelos números reais antes de publicar (autorizado pelo Hugo em
 * 2026-08-06 especificamente pra essa revisão; não são dados verdadeiros).
 * `value` fica separado de prefixo/sufixo pra dar pra animar só o número.
 */
const HERO_STATS = [
  { value: 150, prefix: "+", suffix: "", label: "Projetos entregues" },
  { value: 50, prefix: "+", suffix: "M", label: "Visualizações geradas" },
  { value: 80, prefix: "+", suffix: "", label: "Marcas atendidas" },
];

/**
 * Placeholders exibidos só até o primeiro projeto real ser cadastrado em
 * /admin — assim que a tabela `projects` do Supabase tiver alguma linha,
 * ela substitui esse array inteiro (ver `ProjetosSection`).
 */
type Project = {
  id: string;
  title: string;
  category: "video" | "foto";
  tag: string;
  description: string;
  gradient: string;
  image?: string;
  video?: string;
};

const FALLBACK_GRADIENT = "from-[#1c1408] via-[#100b06] to-black";

function projectFromRow(row: ProjectRow): Project {
  const mediaUrl = publicMediaUrl(row.media_path);
  const coverUrl = row.thumbnail_path ? publicMediaUrl(row.thumbnail_path) : undefined;

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    tag: row.tag,
    description: row.description,
    gradient: FALLBACK_GRADIENT,
    image: row.category === "foto" ? mediaUrl : coverUrl,
    video: row.category === "video" ? mediaUrl : undefined,
  };
}

const PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Identidade de Marca",
    category: "video",
    tag: "Institucional",
    description: "Filme de posicionamento para apresentar a essência e os valores da marca.",
    gradient: "from-[#201208] via-[#120b06] to-black",
  },
  {
    id: "p2",
    title: "Reels de Produto",
    category: "video",
    tag: "Social",
    description: "Série de vídeos curtos para redes sociais com foco em conversão.",
    gradient: "from-[#1c1408] via-[#100b06] to-black",
  },
  {
    id: "p3",
    title: "Cobertura de Evento",
    category: "video",
    tag: "Evento",
    description: "Registro audiovisual completo de um evento corporativo, do início ao fim.",
    gradient: "from-[#1a1006] via-[#0f0a05] to-black",
  },
  {
    id: "p4",
    title: "Editorial de Marca",
    category: "foto",
    tag: "Editorial",
    description: "Ensaio fotográfico para campanha de lançamento de produto.",
    gradient: "from-[#1c1006] via-[#100905] to-black",
  },
  {
    id: "p5",
    title: "Still Life de Produto",
    category: "foto",
    tag: "Produto",
    description: "Fotografia de produto em estúdio com iluminação cinematográfica.",
    gradient: "from-[#181206] via-[#0e0a05] to-black",
  },
  {
    id: "p6",
    title: "Bastidores de Produção",
    category: "foto",
    tag: "Backstage",
    description: "Registro dos bastidores de um dia de gravação.",
    gradient: "from-[#1a1408] via-[#0f0b05] to-black",
  },
];

function CategoryIcon({ category, className }: { category: Project["category"]; className?: string }) {
  return category === "video" ? (
    <Play className={className} strokeWidth={1.5} />
  ) : (
    <Camera className={className} strokeWidth={1.5} />
  );
}

function ProjectSlide({ project }: { project: Project }) {
  return (
    <div className={cn("relative aspect-[16/10] md:aspect-[16/9] rounded-3xl overflow-hidden bg-gradient-to-br", project.gradient)}>
      {project.video ? (
        <video
          src={project.video}
          poster={project.image}
          controls
          playsInline
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      ) : project.image ? (
        <img src={project.image} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <CategoryIcon category={project.category} className="w-14 h-14 text-white/10" />
        </div>
      )}
      <div className="absolute inset-x-4 bottom-4 md:inset-x-6 md:bottom-6 liquid-glass rounded-2xl p-5 md:p-6">
        <span className="text-xs tracking-[0.2em] font-semibold uppercase" style={{ color: ORANGE }}>
          {project.tag}
        </span>
        <h3 className="text-xl md:text-2xl font-bold mt-1 mb-1">{project.title}</h3>
        <p className="text-white/60 text-sm md:text-base leading-snug max-w-md">{project.description}</p>
      </div>
    </div>
  );
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {/*
          Fora do container com overflow-hidden/cantos arredondados de propósito:
          um botão a 16px da quina fica mais perto do centro da curva do que o
          raio dela, então o próprio recorte do canto cortava um pedaço do
          círculo. Flutuando por cima da borda do card, nunca é cortado.
        */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute -top-3 -right-3 z-10 w-10 h-10 rounded-full liquid-glass flex items-center justify-center hover:border-white/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="liquid-glass rounded-3xl max-h-[90vh] overflow-y-auto">
          <div className={cn("relative aspect-video overflow-hidden rounded-t-3xl bg-gradient-to-br", project.gradient)}>
            {project.video ? (
              <video
                src={project.video}
                poster={project.image}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            ) : project.image ? (
              <img src={project.image} alt={project.title} className="absolute inset-0 w-full h-full object-contain bg-black" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <CategoryIcon category={project.category} className="w-14 h-14 text-white/10" />
              </div>
            )}
          </div>
          <div className="p-6 md:p-8">
            <span className="text-xs tracking-[0.2em] font-semibold uppercase" style={{ color: ORANGE }}>
              {project.tag}
            </span>
            <h3 className="text-2xl md:text-3xl font-bold mt-1 mb-3">{project.title}</h3>
            <p className="text-white/70 text-base md:text-lg leading-relaxed">{project.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjetosSection() {
  const [tab, setTab] = useState<"video" | "foto">("video");
  const [dbProjects, setDbProjects] = useState<Project[] | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicProjects().then((rows) => {
      if (cancelled) return;
      setDbProjects(rows.map(projectFromRow));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const source = dbProjects && dbProjects.length > 0 ? dbProjects : PROJECTS;
  const filtered = source.filter((p) => p.category === tab);

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "center", loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    emblaApi?.scrollTo(0);
  }, [tab, emblaApi]);

  return (
    <section id="projetos" className="w-full px-6 md:px-16 py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm tracking-[0.3em] font-semibold mb-4" style={{ color: ORANGE }}>
          PROJETOS
        </p>
        <h2 className="text-4xl md:text-6xl font-extrabold leading-tight max-w-3xl mb-10">
          O mundo através da minha lente
        </h2>

        {/* Abas */}
        <div className="flex gap-3 mb-12">
          {(["video", "foto"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide border transition-colors",
                tab === t ? "text-white" : "border-white/15 text-white/50 hover:border-white/40 hover:text-white/80",
              )}
              style={tab === t ? { backgroundColor: ORANGE, borderColor: ORANGE } : undefined}
            >
              {t === "video" ? "Vídeos" : "Fotos"}
            </button>
          ))}
        </div>

        {/* Carrossel em destaque */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4 md:-ml-6">
              {filtered.map((project) => (
                <div key={project.id} className="min-w-0 shrink-0 grow-0 basis-[88%] sm:basis-[70%] lg:basis-[62%] pl-4 md:pl-6">
                  <ProjectSlide project={project} />
                </div>
              ))}
            </div>
          </div>

          {filtered.length > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-2">
                {filtered.map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === selectedIndex ? "2rem" : "0.375rem",
                      backgroundColor: i === selectedIndex ? ORANGE : "rgba(255,255,255,0.2)",
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  aria-label="Projeto anterior"
                  onClick={() => emblaApi?.scrollPrev()}
                  className="liquid-glass w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:border-white/40"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  aria-label="Próximo projeto"
                  onClick={() => emblaApi?.scrollNext()}
                  className="liquid-glass w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:border-white/40"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Grade de mídia — só faz sentido pra folhear quando há mais de um
            projeto; com um só, ela apenas repetia o mesmo card do carrossel. */}
        {filtered.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-20">
          {filtered.map((project) => (
            <div
              key={project.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedProject(project)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedProject(project);
                }
              }}
              className={cn(
                "group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                project.gradient,
              )}
            >
              {project.video ? (
                <video
                  src={project.video}
                  poster={project.image}
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
              ) : project.image ? (
                <img src={project.image} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CategoryIcon category={project.category} className="w-8 h-8 text-white/10" />
                </div>
              )}
              <div className="absolute inset-x-3 bottom-3 liquid-glass rounded-xl px-4 py-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: ORANGE }}>
                  {project.tag}
                </p>
                <p className="text-sm font-semibold leading-snug">{project.title}</p>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </section>
  );
}

function SoartsLogo() {
  return (
    <svg
      className="w-12 h-12 shrink-0"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 89 89.9299"
    >
      <g clipPath="url(#clip-logo-soarts)">
        <path d={svgPaths.p9f30400} fill="white" />
        <path d={svgPaths.p37271b00} fill="white" />
        <path d={svgPaths.p2393e000} fill="white" />
        <path d={svgPaths.pa249c80} fill="white" />
        <path d={svgPaths.p22987c00} fill="white" />
        <path d={svgPaths.p16217f00} fill="white" />
        <path d={svgPaths.p2cd0b680} fill="white" />
        <path d={svgPaths.p36ba8b00} fill="white" />
        <path d={svgPaths.p28a221f0} fill="white" />
        <path d={svgPaths.p4b7a800} fill="white" />
        <path d={svgPaths.p1b4a2c80} fill="white" />
        <path d={svgPaths.p1457c900} fill="white" />
        <path d={svgPaths.p3412100} fill="white" />
        <path d={svgPaths.p3aff3400} fill="white" />
        <path d={svgPaths.p35a5cb00} fill="white" />
        <path d={svgPaths.p19ae2580} fill="white" />
        <path d={svgPaths.p2141cf80} fill="white" />
        <path d={svgPaths.p39278830} fill="white" />
        <path d={svgPaths.p155cde00} fill="white" />
        <path d={svgPaths.p33d7f200} fill="white" />
        <path d={svgPaths.p1422ba80} fill="white" />
        <path d={svgPaths.p6748f00} fill="white" />
        <path d={svgPaths.p9296300} fill="white" />
        <path d={svgPaths.pd4f1000} fill="white" />
        <path d={svgPaths.p2482ca00} fill="white" />
        <path d={svgPaths.p12b17800} fill="white" />
        <path d={svgPaths.p10021c00} fill="white" />
        <path d={svgPaths.p20e8500} fill="white" />
        <path d={svgPaths.p17b9b800} fill="white" />
        <path d={svgPaths.p2495af00} fill="white" />
        <path d={svgPaths.p3c6e4280} fill="white" />
        <path d={svgPaths.p164f2500} fill="white" />
        <path d={svgPaths.p38ace700} fill="white" />
        <path d={svgPaths.p2aa42700} fill="white" />
        <path d={svgPaths.p20f561c0} fill="white" />
        <path d={svgPaths.p24778680} fill="white" />
        <path d={svgPaths.p2cd54200} fill="black" />
        <path d={svgPaths.p3d403e00} fill="black" />
        <path d={svgPaths.pa24a00} fill="black" />
        <path d={svgPaths.p24907580} fill="black" />
        <path d={svgPaths.p95fd00} fill="black" />
        <path d={svgPaths.p1a004680} fill="black" />
        <path d={svgPaths.p36482300} fill="black" />
        <path d={svgPaths.p3f17200} fill="black" />
        <path d={svgPaths.p3a508300} fill="black" />
        <path d={svgPaths.p8f1200} fill="black" />
        <path d={svgPaths.p1b381200} fill="black" />
        <path d={svgPaths.pf964900} fill="black" />
        <path d={svgPaths.p1d121200} fill="black" />
        <path d={svgPaths.p11e58180} fill="black" />
        <path d={svgPaths.p26fcec00} fill="black" />
        <path d={svgPaths.p1bcbd00} fill="black" />
        <path d={svgPaths.p37cdd680} fill="black" />
        <path d={svgPaths.p16724d80} fill="black" />
        <path d={svgPaths.p1e5a470} fill="white" />
        <path d={svgPaths.p11ebf580} fill="white" />
        <path d={svgPaths.p7c8b280} fill="white" />
        <path d={svgPaths.p34ac3500} fill="white" />
        <path d={svgPaths.p20249e00} fill="white" />
        <path d={svgPaths.pe15dd00} fill="white" />
        <path d={svgPaths.pdc4a400} fill="white" />
        <path d={svgPaths.p2af94100} fill="white" />
        <path d={svgPaths.pb9f5100} fill="white" />
        <path d={svgPaths.p2947ce00} fill="white" />
        <path d={svgPaths.p1463a700} fill="white" />
        <path d={svgPaths.p254c6800} fill="white" />
        <path d={svgPaths.p140d8800} fill="white" />
        <path d={svgPaths.p342502a} fill="white" />
        <path d={svgPaths.p2b98ed00} fill="white" />
        <path d={svgPaths.p256b1370} fill="white" />
        <path d={svgPaths.p3354ed80} fill="white" />
        <path d={svgPaths.p3f017c00} fill="white" />
        <path d={svgPaths.p23bbd300} fill="white" />
        <path d={svgPaths.p1c27500} fill="white" />
        <path d={svgPaths.p4782700} fill="white" />
        <path d={svgPaths.p78ced00} fill="white" />
        <path d={svgPaths.p36e34b80} fill="white" />
        <path d={svgPaths.p2e771300} fill="white" />
        <path d={svgPaths.p110e6a00} fill="white" />
        <path d={svgPaths.pfea0300} fill="white" />
        <path d={svgPaths.p853e300} fill="white" />
        <path d={svgPaths.p3a118af0} fill="white" />
        <path d={svgPaths.p1d8f3df0} fill="white" />
        <path d={svgPaths.p11574500} fill="white" />
        <path d={svgPaths.p21c20800} fill="white" />
        <path d={svgPaths.p3a228880} fill="white" />
        <path d={svgPaths.p2e958000} fill="white" />
        <path d={svgPaths.p3bf3a480} fill="white" />
        <path d={svgPaths.pf634c00} fill="white" />
        <path d={svgPaths.p30754000} fill="white" />
        <path d={svgPaths.p1b614f00} fill="white" />
        <path d={svgPaths.p14399d00} fill="white" />
        <path d={svgPaths.p3fae60f0} fill="white" />
        <path d={svgPaths.p2ec2d600} fill="white" />
        <path d={svgPaths.p398c0300} fill="white" />
        <path d={svgPaths.p3e02770} fill="white" />
        <path d={svgPaths.p226ebc00} fill="white" />
        <path d={svgPaths.p25420e80} fill="white" />
        <path d={svgPaths.p122af00} fill="white" />
        <path d={svgPaths.p25f6eb00} fill="white" />
        <path d={svgPaths.p2938ac80} fill="white" />
        <path d={svgPaths.p1110800} fill="white" />
        <path d={svgPaths.pf9c2280} fill="white" />
        <path d={svgPaths.p2fd2100} fill="white" />
        <path d={svgPaths.p1d3ad300} fill="white" />
        <path d={svgPaths.p1ac3d880} fill="white" />
        <path d={svgPaths.p25bea080} fill="white" />
        <path d={svgPaths.p9252e00} fill="white" />
        <path d={svgPaths.p3d52700} fill="white" />
        <path d={svgPaths.padbd300} fill="white" />
        <path d={svgPaths.p37515400} fill="white" />
        <path d={svgPaths.p1a52a600} fill="white" />
        <path d={svgPaths.p111dad70} fill="white" />
        <path d={svgPaths.p11c61370} fill="white" />
        <path d={svgPaths.p2f86740} fill="white" />
        <path d={svgPaths.pccf8880} fill="white" />
        <path d={svgPaths.p173cc300} fill="white" />
        <path d={svgPaths.p3fe6eb80} fill="white" />
        <path d={svgPaths.p260d8000} fill="white" />
        <path d={svgPaths.pa346d80} fill="white" />
        <path d={svgPaths.p1875c100} fill="black" />
        <path d={svgPaths.p1356ee00} fill="black" />
      </g>
      <defs>
        <clipPath id="clip-logo-soarts">
          <rect fill="white" height="89.9299" width="89" />
        </clipPath>
      </defs>
    </svg>
  );
}

function CountUpStat({
  value,
  prefix = "",
  suffix = "",
  label,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const prefersReducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, value, prefersReducedMotion]);

  return (
    <div ref={ref}>
      <p className="text-4xl xl:text-5xl font-extrabold leading-none tabular-nums" style={{ color: ORANGE }}>
        {prefix}
        {display}
        {suffix}
      </p>
      <p className="text-xs tracking-[0.2em] uppercase text-white/50 mt-2 max-w-[7rem]">{label}</p>
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={cn("fixed top-0 left-0 right-0 z-30 transition-colors duration-300", scrolled && "liquid-glass-nav")}>
      <div className="flex items-center justify-between px-6 md:px-16 py-5">
        <a href="#inicio" aria-label="SOARTS — início">
          <SoartsLogo />
        </a>

        <ul className="hidden md:flex items-center gap-10 text-white text-sm tracking-[0.15em]">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition-colors hover:text-[#FF5200]">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden liquid-glass-nav px-6 pb-6 pt-2">
          <ul className="flex flex-col gap-4 text-white text-sm tracking-[0.15em]">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setMenuOpen(false)} className="transition-colors hover:text-[#FF5200]">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

function ContatoSection() {
  const [form, setForm] = useState({ nome: "", empresa: "", whatsapp: "", instagram: "", tipo_projeto: "", investimento: "", mensagem: "" });
  const [sent, setSent] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const texto = [
      form.nome ? `Nome: ${form.nome}` : "",
      form.empresa ? `Empresa: ${form.empresa}` : "",
      `WhatsApp: ${form.whatsapp}`,
      `Instagram: ${form.instagram}`,
      `Projeto: ${form.tipo_projeto}`,
      `Investimento: ${form.investimento}`,
      form.mensagem ? `Mensagem: ${form.mensagem}` : "",
    ].filter(Boolean).join("%0A");
    window.open(`https://wa.me/55?text=${texto}`, "_blank");
    setSent(true);
  }

  return (
    <section id="contato" className="w-full px-6 md:px-16 py-24 md:py-32">
      <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-16 items-start">
        {/* Texto */}
        <div className="lg:w-80 shrink-0">
          <p className="text-sm tracking-[0.3em] font-semibold mb-4" style={{ color: ORANGE }}>
            CONTATO
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Pronto para posicionar sua marca?
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Me conte sobre seu projeto e vamos construir algo que gere valor, conexão e resultado.
          </p>
        </div>

        {/* Formulário */}
        <div className="flex-1 w-full liquid-glass rounded-3xl p-6 md:p-8">
          {sent ? (
            <div className="liquid-glass-accent rounded-2xl p-10 text-center">
              <p className="text-2xl font-bold mb-2">Mensagem enviada!</p>
              <p className="text-white/60">Em breve entro em contato.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm block mb-1">Nome</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => set("nome", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF5200] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Empresa/Marca</label>
                  <input
                    type="text"
                    value={form.empresa}
                    onChange={(e) => set("empresa", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF5200] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-1">WhatsApp <span style={{ color: ORANGE }}>*</span></label>
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  required
                  placeholder="(00) 00000-0000"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF5200] transition-colors"
                />
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-1">Instagram <span style={{ color: ORANGE }}>*</span></label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => set("instagram", e.target.value)}
                  required
                  placeholder="@usuario"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF5200] transition-colors"
                />
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-1">Tipo de projeto <span style={{ color: ORANGE }}>*</span></label>
                <input
                  type="text"
                  value={form.tipo_projeto}
                  onChange={(e) => set("tipo_projeto", e.target.value)}
                  required
                  placeholder="Ex: vídeo institucional, reels, cobertura de evento..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF5200] transition-colors"
                />
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-1">Investimento <span style={{ color: ORANGE }}>*</span></label>
                <input
                  type="text"
                  value={form.investimento}
                  onChange={(e) => set("investimento", e.target.value)}
                  required
                  placeholder="Ex: R$ 1.000 - R$ 3.000"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF5200] transition-colors"
                />
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-1">Me conte sobre o projeto que você quer criar</label>
                <textarea
                  value={form.mensagem}
                  onChange={(e) => set("mensagem", e.target.value)}
                  rows={4}
                  placeholder="Insira uma resposta aqui"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF5200] transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full text-white text-lg font-bold py-4 rounded-full transition-colors"
                style={{ backgroundColor: ORANGE }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#cc4200")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ORANGE)}
              >
                Enviar mensagem
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="bg-black min-h-screen font-['Inter',sans-serif] text-white">
      <Navbar />

      {/* HERO */}
      <GooeyRevealHero
        id="inicio"
        className="relative isolate w-full max-w-[1800px] mx-auto min-h-screen flex flex-col justify-start lg:justify-center overflow-hidden"
        /*
         * Mesmo clique em dois tratamentos: a base é a versão neutra e a
         * revelada é a versão com grade quente/laranja, que combina com o
         * #FF5200 da marca. Recortes sem fundo, mesmo canvas 942x1670 — as
         * silhuetas divergem 0,7%, só na borda do cabelo.
         */
        baseImage="/images/hero/chicao-base.webp"
        revealImage="/images/hero/chicao-reveal.webp"
        /*
         * As duas fotos sozinhas diferem pouco (delta médio de 16/255 na tela),
         * então a revelação sumia sob o gradiente preto. Estes filtros afastam
         * as camadas: a base esfria e escurece, a revelada esquenta. Estes são
         * os dois números para mexer se quiserem o efeito mais forte ou mais sutil.
         */
        baseFilter="saturate(0.6) brightness(0.88)"
        revealFilter="saturate(1.5) brightness(1.14)"
        /*
         * Ancorado à direita em vez de centralizado: em telas largas isso abre
         * a coluna esquerda inteira para o texto sem tampar o rosto, que é
         * onde a revelação acontece. Em mobile a silhueta já ocupa a largura
         * toda do viewport (é mais estreita que a tela é baixa), então o
         * ancoramento horizontal não muda nada — o mesmo `fit` serve pras duas.
         */
        fit="xMaxYMax meet"
      >
        {/*
          Fundo animado, atrás do retrato (z-index negativo: o <svg> do
          GooeyRevealHero não tem z-index, então qualquer valor negativo
          aqui já garante que fica por trás dele, não importa a ordem no
          DOM). Cores da marca: laranja #FF5200 subindo do preto, crista
          em âmbar claro. Desligado com "reduzir movimento" ligado — é
          decorativo, não vale gastar GPU à toa nesse caso.
        */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 -z-10">
            <GradientWaves
              horizonColor="#000000"
              waveColor="#FF5200"
              crestColor="#FFD9C2"
              speed={0.25}
              amplitude={2.2}
              waveScale={0.6}
              waveRatio={0.9}
              swell={35}
              turbulence={20}
              tilt={0.75}
              zoom={1.0}
              height={3}
              fogDepth={30}
              detail="low"
              brightness={0.9}
              opacity={0.6}
              mouseInteraction={true}
              parallaxStrength={0.4}
              grain={true}
              grainIntensity={0.04}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/10 to-transparent pointer-events-none" />

        <div className="relative z-10 w-full px-6 md:px-16 pt-28 sm:pt-32 pb-10 lg:py-0">
          <div className="flex flex-col lg:flex-row lg:items-center gap-10 xl:gap-20">
          <div className="max-w-xl lg:max-w-2xl mx-auto lg:mx-0 shrink-0 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <span className="w-8 h-px shrink-0" style={{ backgroundColor: ORANGE }} />
              <span className="text-xs md:text-sm tracking-[0.3em] font-semibold text-white/80">
                VÍDEOS QUE POSICIONAM MARCAS
              </span>
            </div>

            <h1 className="font-extrabold leading-[0.95] tracking-tight text-5xl sm:text-7xl lg:text-8xl mb-3 sm:mb-5">
              <span className="block">CHICÃO</span>
              <span className="block" style={{ color: ORANGE }}>
                MAKER
              </span>
            </h1>

            <p className="text-xl sm:text-2xl md:text-3xl tracking-wide uppercase mb-4 sm:mb-6">
              <span className="font-light text-white/80">Videomaker e </span>
              <span className="font-bold">criador</span>
            </p>

            <p className="text-white/60 text-base md:text-lg leading-relaxed mb-6 sm:mb-10 max-w-md">
              Transformo ideias em vídeos que conectam, engajam e posicionam marcas no digital.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <a
                href="#contato"
                className="inline-flex items-center gap-2 text-white text-lg font-extrabold px-10 py-4 rounded-full shadow-lg transition-colors"
                style={{ backgroundColor: ORANGE }}
              >
                Vamos criar
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#projetos"
                className="liquid-glass inline-flex items-center gap-3 text-white text-base font-semibold pl-2 pr-8 py-2 rounded-full transition-colors hover:border-white/40"
              >
                <span className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 ml-0.5" />
                </span>
                Ver projetos
              </a>
            </div>
          </div>

          {/*
            PLACEHOLDER — ver HERO_STATS acima. Só aparece em telas grandes
            (lg+), onde sobra vazio entre o texto e o retrato.
          */}
          <div className="hidden lg:flex items-start gap-8 xl:gap-12 pl-8 xl:pl-12 border-l border-white/10 shrink-0">
            {HERO_STATS.map((stat) => (
              <CountUpStat key={stat.label} {...stat} />
            ))}
          </div>
          </div>
        </div>

        {/* Selo vertical, lado direito */}
        <div className="hidden lg:flex absolute right-10 top-1/2 -translate-y-1/2 z-10">
          <span
            className="text-xs tracking-[0.35em] uppercase text-white/50 whitespace-nowrap"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Estratégia. Criatividade.{" "}
            <span style={{ color: ORANGE }}>Resultado.</span>
          </span>
        </div>

        {/* Indicador de scroll */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
          <span className="w-5 h-8 rounded-full border border-white/25 flex items-start justify-center p-1.5">
            <span className="w-1 h-1.5 rounded-full bg-white/60 animate-bounce" />
          </span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/40">
            Role para explorar
          </span>
        </div>
      </GooeyRevealHero>

      {/* PROJETOS */}
      <ProjetosSection />

      {/* SOBRE MIM */}
      <section id="sobre" className="w-full px-6 md:px-16 py-24 md:py-32">
        <p className="text-sm tracking-[0.3em] font-semibold mb-12" style={{ color: ORANGE }}>
          SOBRE MIM
        </p>
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Texto */}
          <div className="flex-1 text-white text-xl md:text-2xl leading-relaxed space-y-6">
            <p>
              Sou videomaker e criador especializado em posicionar marcas através de vídeo. Mais do que produzir, construo narrativas que geram conexão e aumentam percepção de valor.
            </p>
            <p>
              Da ideia à entrega final, unindo estética e estratégia — para transformar cada projeto numa marca que é vista, lembrada e escolhida.
            </p>
          </div>

          {/* Cartão de perfil — ver francisco-card.tsx. Substituiu o crachá
              3D (three.js+r3f+drei foram removidos do package.json). */}
          <FranciscoCard />
        </div>

        {/* CTA */}
        <div className="mt-20 flex justify-center">
          <a
            href="#contato"
            className="text-white text-2xl md:text-3xl font-normal px-16 py-4 rounded-full shadow-lg transition-colors text-center"
            style={{ backgroundColor: ORANGE }}
          >
            Quero posicionar minha marca
          </a>
        </div>
      </section>

      {/* MARCAS */}
      <section className="w-full py-24 overflow-hidden">
        <h2 className="text-4xl md:text-6xl font-extrabold text-center leading-tight mb-16 md:mb-20 px-6 md:px-16">
          Marcas que já confiaram
          <br />
          no meu trabalho
        </h2>

        <div
          className="relative w-full overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <div className="marquee-track flex items-center gap-16 md:gap-24 w-max">
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <img
                key={i}
                src={brand.src}
                alt={brand.alt}
                className="h-9 md:h-11 w-auto object-contain shrink-0 opacity-80 hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <ContatoSection />

      {/* FOOTER */}
      <footer className="w-full py-10 border-t border-white/10 text-center">
        <p className="font-['Montserrat',sans-serif] text-white/70 text-base tracking-widest">
          DIREITOS RESERVADOS SOARTS - 2026
        </p>
      </footer>
    </div>
  );
}
