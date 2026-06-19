import { useState, useEffect } from "react";
import imgArteHome1 from "@/imports/LpSoarts-1/18e8e1526bce6171fc812f220318b02f70d54c1c.png";
import imgFotoSobreMim1 from "@/imports/LpSoarts-1/62e6d952a145ea13a362f06ec0abb6a9b6a95ec0.png";
import imgPromenac from "@/imports/LpSoarts-1/4f9ded526e079a81f945748a1d5b20399db88462.png";
import imgGlobo from "@/imports/LpSoarts-1/ebd2fbc1227c2348e8af1bd608466186a92edd14.png";
import imgHelp from "@/imports/LpSoarts-1/9a24a967396e3a96c514b6606d83fbc921a8502e.png";
import imgPixel from "@/imports/LpSoarts-1/53e6e0a0c85759b6fc7455999a19d4d8698285ab.png";
import svgPaths from "@/imports/LpSoarts-1/svg-0n58f4rxvu";
import { createClient } from "@/utils/supabase/client";

type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  type: "video" | "foto";
  file_url: string;
};

function ProjetosSection() {
  const [tab, setTab] = useState<"video" | "foto">("video");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MediaItem | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("media")
      .select("id, title, description, type, file_url")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMedia((data as MediaItem[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = media.filter((m) => m.type === tab);

  return (
    <section id="projetos" className="w-full px-8 md:px-16 py-20">
      <p className="text-white/60 text-xl tracking-widest mb-4">PROJETOS</p>
      <p className="text-4xl md:text-6xl font-extrabold text-center leading-tight max-w-4xl mx-auto mb-10">
        O mundo através da minha lente
      </p>

      {/* Abas */}
      <div className="flex gap-4 mb-10">
        {(["video", "foto"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 rounded-full font-semibold text-sm border transition-colors ${
              tab === t
                ? "bg-[#ff9000] border-[#ff9000] text-white"
                : "border-white/20 text-white/50 hover:border-white/50"
            }`}
          >
            {t === "video" ? "Vídeos" : "Fotos"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-video bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-white/30 text-center py-16">Nenhum conteúdo ainda.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              className="aspect-video rounded-xl overflow-hidden cursor-pointer group relative bg-white/5 border border-white/10 hover:border-[#ff9000]/50 transition-colors"
            >
              {item.type === "foto" ? (
                <img
                  src={item.file_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <video
                  src={item.file_url}
                  className="w-full h-full object-cover"
                  muted
                  onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-white font-semibold text-sm">{item.title}</p>
              </div>
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-[#ff9000]/80 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                    <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal lightbox */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {selected.type === "foto" ? (
              <img src={selected.file_url} alt={selected.title} className="w-full max-h-[80vh] object-contain rounded-xl" />
            ) : (
              <video src={selected.file_url} controls autoPlay className="w-full max-h-[80vh] rounded-xl" />
            )}
            <div className="mt-4 flex items-start justify-between">
              <div>
                <p className="text-white font-bold text-lg">{selected.title}</p>
                {selected.description && <p className="text-white/50 text-sm mt-1">{selected.description}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="text-white/50 hover:text-white ml-4 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
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

function ContatoSection() {
  const [form, setForm] = useState({ nome: "", empresa: "", whatsapp: "", instagram: "", tipo_projeto: "", investimento: "", mensagem: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.from("contatos").insert({
      nome: form.nome || null,
      empresa: form.empresa || null,
      whatsapp: form.whatsapp,
      instagram: form.instagram,
      tipo_projeto: form.tipo_projeto,
      investimento: form.investimento,
      mensagem: form.mensagem || null,
    });
    if (error) {
      setError("Erro ao enviar. Tente novamente.");
    } else {
      setSent(true);
    }
    setSending(false);
  }

  return (
    <section id="contato" className="w-full px-8 md:px-16 py-20">
      <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-16 items-start">
        {/* Texto */}
        <div className="lg:w-80 shrink-0">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Pronto para posicionar sua marca?
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Me conte sobre seu projeto e vamos construir algo que gere valor, conexão e resultado.
          </p>
        </div>

        {/* Formulário */}
        <div className="flex-1 w-full">
          {sent ? (
            <div className="bg-[#ff9000]/10 border border-[#ff9000]/30 rounded-2xl p-10 text-center">
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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff9000] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Empresa/Marca</label>
                  <input
                    type="text"
                    value={form.empresa}
                    onChange={(e) => set("empresa", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff9000] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-1">WhatsApp <span className="text-[#ff9000]">*</span></label>
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  required
                  placeholder="(00) 00000-0000"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff9000] transition-colors"
                />
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-1">Instagram <span className="text-[#ff9000]">*</span></label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => set("instagram", e.target.value)}
                  required
                  placeholder="@usuario"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff9000] transition-colors"
                />
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-1">Tipo de projeto <span className="text-[#ff9000]">*</span></label>
                <input
                  type="text"
                  value={form.tipo_projeto}
                  onChange={(e) => set("tipo_projeto", e.target.value)}
                  required
                  placeholder="Ex: vídeo institucional, reels, cobertura de evento..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff9000] transition-colors"
                />
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-1">Investimento <span className="text-[#ff9000]">*</span></label>
                <input
                  type="text"
                  value={form.investimento}
                  onChange={(e) => set("investimento", e.target.value)}
                  required
                  placeholder="Ex: R$ 1.000 - R$ 3.000"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff9000] transition-colors"
                />
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-1">Me conte sobre o projeto que você quer criar</label>
                <textarea
                  value={form.mensagem}
                  onChange={(e) => set("mensagem", e.target.value)}
                  rows={4}
                  placeholder="Insira uma resposta aqui"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff9000] transition-colors resize-none"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-[#ff9000] text-white text-lg font-bold py-4 rounded-full hover:bg-[#e08000] transition-colors disabled:opacity-50"
              >
                {sending ? "Enviando..." : "Enviar mensagem"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="bg-black min-h-screen font-['Inter',sans-serif] text-white">
      {/* NAVBAR */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 md:px-16 py-6">
        <SoartsLogo />
        <ul className="hidden md:flex items-center gap-10 text-white text-lg tracking-wide">
          <li><a href="#inicio" className="hover:text-[#ff9000] transition-colors">INICIO</a></li>
          <li><a href="#projetos" className="hover:text-[#ff9000] transition-colors">PROJETOS</a></li>
          <li><a href="#sobre" className="hover:text-[#ff9000] transition-colors">SOBRE</a></li>
          <li><a href="#contato" className="hover:text-[#ff9000] transition-colors">CONTATO</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section id="inicio" className="relative w-full min-h-[85vh] flex flex-col items-center justify-end pb-20 overflow-hidden">
        <img
          src={imgArteHome1}
          alt="Hero background"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black" />
        <div className="relative z-10 flex flex-col items-center text-center px-6">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
            CHICÃO MAKER
          </h1>
          <p className="text-3xl md:text-5xl font-extrabold mb-1">
            Vídeo que posiciona marcas
          </p>
          <p className="text-3xl md:text-5xl font-light mb-10 text-white/90">
            Videomaker e criador
          </p>
          <a
            href="#contato"
            className="bg-[#ff9000] border-2 border-white text-white text-2xl md:text-3xl font-extrabold px-14 py-4 rounded-full shadow-lg hover:bg-[#e08000] transition-colors"
          >
            Vamos criar
          </a>
        </div>
      </section>

      {/* PROJETOS */}
      <ProjetosSection />

      {/* SOBRE MIM */}
      <section id="sobre" className="w-full px-8 md:px-16 py-20">
        <p className="text-white/60 text-xl tracking-widest mb-12">SOBRE MIM</p>
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Text */}
          <div className="flex-1 text-white text-xl md:text-2xl leading-relaxed space-y-6">
            <p>
              Sou videomaker e criador especializado em posicionamento de marcas através de conteúdo estratégico.
            </p>
            <p>
              Mais do que produzir vídeos, desenvolvo narrativas visuais que aumentam percepção de valor, geram conexão e destacam empresas no mercado.
            </p>
            <p>
              Atuo desde a ideia até a entrega final, unindo estética, estratégia e impacto — transformando projetos em ferramentas reais de crescimento.
            </p>
            <p>
              Cada projeto é pensado para ir além do visual.
              <br />
              É sobre posicionar, atrair e fazer a marca ser lembrada
            </p>
          </div>
          {/* Photo */}
          <div className="lg:w-[400px] xl:w-[500px] shrink-0">
            <img
              src={imgFotoSobreMim1}
              alt="Foto sobre mim"
              className="w-full h-[600px] object-cover object-top rounded-2xl"
            />
          </div>
        </div>

        {/* CTA button */}
        <div className="mt-20 flex justify-center">
          <a
            href="#contato"
            id="contato"
            className="bg-[#ff9000] border-2 border-white text-white text-2xl md:text-3xl font-normal px-16 py-4 rounded-full shadow-lg hover:bg-[#e08000] transition-colors text-center"
          >
            Quero posicionar minha marca
          </a>
        </div>
      </section>

      {/* BRANDS */}
      <section className="w-full px-8 md:px-16 py-24">
        <h2 className="text-4xl md:text-6xl font-extrabold text-center leading-tight mb-20">
          Marcas que ja confiaram
          <br />
          no meu trabalho
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20">
          <img src={imgPixel} alt="Logo cliente" className="h-10 object-contain opacity-90 hover:opacity-100 transition-opacity" />
          <img src={imgPromenac} alt="Promenac Camvel" className="h-8 object-contain opacity-90 hover:opacity-100 transition-opacity" />
          <img src={imgGlobo} alt="Grupo Globo" className="h-7 object-contain opacity-90 hover:opacity-100 transition-opacity" />
          <img src={imgHelp} alt="HelpSmart" className="h-10 object-contain opacity-90 hover:opacity-100 transition-opacity" />
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
