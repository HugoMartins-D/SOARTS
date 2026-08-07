import fotoFrancisco from "@/imports/LpSoarts-1/foto-francisco-card.webp";

/**
 * Cartão de perfil da seção "Sobre Mim" — substitui o crachá 3D.
 *
 * O enquadramento da foto em `.francisco-card__slot` (globals.css) foi
 * medido a partir do arquivo real: o cabelo começa a 18.8% da altura, e a
 * camisa só vira largura-total a partir de ~70%. Se troca a foto, remeça
 * essa medição (script de histograma de alpha no scratchpad da sessão que
 * criou este componente) antes de reusar os números de `background-size`/
 * `background-position`.
 */
export function FranciscoCard() {
  return (
    <div className="francisco-card w-full max-w-[360px] mx-auto lg:mx-0 lg:w-[380px] xl:w-[420px] shrink-0">
      <div className="px-1.5 pb-[34px]">
        <h1 className="francisco-card__name">
          Francisco
          <br />
          <span>Vilain</span>
        </h1>
        <div className="flex items-center gap-2 mt-2.5">
          <span className="francisco-card__dot" aria-hidden="true" />
          <span className="text-[0.86rem]" style={{ color: "var(--fc-mist)" }}>
            Disponível para novos projetos
          </span>
        </div>
      </div>

      <div
        className="francisco-card__slot"
        role="img"
        aria-label="Francisco Vilain, videomaker da SOARTS Films"
        style={{
          backgroundImage: `url(${fotoFrancisco}), radial-gradient(120% 100% at 30% -10%, rgba(255, 178, 138, 0.12), transparent 55%)`,
        }}
      />

      <div className="flex items-center justify-between gap-3 mt-5 px-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="francisco-card__avatar shrink-0"
            style={{ backgroundImage: `url(${fotoFrancisco})` }}
            aria-hidden="true"
          />
          <span className="text-white font-semibold text-[0.92rem] truncate">@chicaomaker</span>
        </div>
        <a
          href="https://www.instagram.com/chicaomaker/"
          target="_blank"
          rel="noopener noreferrer"
          className="francisco-card__cta shrink-0 inline-flex items-center gap-1.5 px-[18px] py-2.5 rounded-full font-bold text-[0.88rem]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="w-3.5 h-3.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Seguir
        </a>
      </div>
    </div>
  );
}
