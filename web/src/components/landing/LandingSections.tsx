import { useEffect, useRef, useState } from "react";
import { LuLayoutGrid } from "react-icons/lu";
import type { RankedJobResult } from "../../types/data";
import officesupport from "../../assets/officesupport.jpg";
import hostlive from "../../assets/hostlive.webp";
import cs from "../../assets/cs.jpeg";
import graphicdesign from "../../assets/graphicdesigm.webp";
import gurules from "../../assets/gurules.webp";
import barista from "../../assets/barista.jpg";
import lescoding from "../../assets/lescoding.jpg";
import kurir from "../../assets/kurir.webp";
import kasir from "../../assets/kasir.jpg";
import sales from "../../assets/sales.jpg";
import glintsLogo from "../../assets/portals/glints.png";
import kitalulusLogo from "../../assets/portals/kitalulus.png";
import lokeridLogo from "../../assets/portals/lokerid.png";
import kalibrrLogo from "../../assets/portals/kalibrr.png";

// 4 portal resmi yang benar-benar dipakai sebagai sumber scraping lowongan.
// Logo diambil langsung dari domain masing-masing (bukan rekonstruksi).
const SOURCE_PORTALS: Array<{ name: string; logo: string }> = [
  { name: "Glints", logo: glintsLogo },
  { name: "Loker.id", logo: lokeridLogo },
  { name: "KitaLulus", logo: kitalulusLogo },
  { name: "Kalibrr", logo: kalibrrLogo },
];

// Card 380x240 (landscape ~1.58), foto asli campur portrait/square.
// Tiap foto punya titik fokus + zoom sendiri supaya area aktivitasnya
// (tangan, alat kerja, benda kerjaan) yang kelihatan, bukan cuma wajah.
const CATEGORY_CARDS: Array<{
  match: string;
  label: string;
  category: string;
  image: string;
  focus: string;
  zoom: number;
}> = [
  {
    match: "Admin",
    label: "Admin & Office Support",
    category: "Admin & Office Support",
    image: officesupport,
    focus: "50% 46%",
    zoom: 1.06,
  },
  {
    match: "Content",
    label: "Content & Media",
    category: "Content & Media",
    image: hostlive,
    focus: "50% 42%",
    zoom: 1.06,
  },
  {
    match: "Customer",
    label: "Customer Service & Support",
    category: "Customer Service & Support",
    image: cs,
    focus: "58% 58%",
    zoom: 1.1,
  },
  {
    match: "Design",
    label: "Design & Creative",
    category: "Design & Creative",
    image: graphicdesign,
    focus: "50% 50%",
    zoom: 1.1,
  },
  {
    match: "Education",
    label: "Education & Tutoring",
    category: "Education & Tutoring",
    image: gurules,
    focus: "50% 48%",
    zoom: 1.08,
  },
  {
    match: "Food",
    label: "Food & Beverage (F&B)",
    category: "Food & Beverage (F&B)",
    image: barista,
    focus: "44% 62%",
    zoom: 1.28,
  },
  {
    match: "IT & Software",
    label: "IT & Software",
    category: "IT & Software",
    image: lescoding,
    focus: "50% 55%",
    zoom: 1.08,
  },
  {
    match: "Logistics",
    label: "Logistics & Delivery",
    category: "Logistics & Delivery",
    image: kurir,
    focus: "50% 55%",
    zoom: 1.06,
  },
  {
    match: "Marketing",
    label: "Marketing & Sales",
    category: "Marketing & Sales",
    image: sales,
    focus: "50% 55%",
    zoom: 1.06,
  },
  {
    match: "Retail",
    label: "Retail & Store Operations",
    category: "Retail & Store Operations",
    image: kasir,
    focus: "50% 50%",
    zoom: 1.06,
  },
];

export function CategoryGrid({
  jobs,
  onSelectCategory,
  onExploreAll,
}: {
  jobs: RankedJobResult[];
  onSelectCategory: (cat: string) => void;
  onExploreAll: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [active, setActive] = useState(0);

  const cardStep = () => {
    const el = trackRef.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return 0;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    return card.offsetWidth + gap;
  };

  const cardCount = () =>
    trackRef.current?.querySelectorAll("[data-card]").length ?? 0;

  // Dots = jumlah posisi snap yang valid, bukan jumlah card.
  // Hitung dari jumlah card agar不受 padding track & spacer kanan.
  const visibleCount = () => {
    const el = trackRef.current;
    const step = cardStep();
    if (!el || step === 0) return 1;
    const padLeft = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    return Math.max(1, Math.floor((el.clientWidth - padLeft) / step));
  };

  const lastPage = () => Math.max(0, cardCount() - visibleCount());

  const syncActive = () => {
    const el = trackRef.current;
    const step = cardStep();
    if (!el || step === 0) return;
    const last = lastPage();
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    // Di ujung kanan selalu anggap halaman terakhir, walau bukan kelipatan step.
    const index = left >= max - 2 ? last : Math.round(left / step);
    setActive(Math.min(last, Math.max(0, index)));
  };

  const measure = () => {
    setPages(lastPage() + 1);
    syncActive();
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    const step = cardStep();
    if (!el || step === 0) return;
    const last = lastPage();
    const clamped = Math.min(last, Math.max(0, i));
    setActive(clamped);
    // Halaman terakhir harus menyentor total ke kanan, bukan kelipatan step.
    // Kalau tidak, kartu biru cuma kelihatan setipis garis di tepi.
    const left =
      clamped === last
        ? Math.max(0, el.scrollWidth - el.clientWidth)
        : clamped * step;
    el.scrollTo({ left, behavior: "smooth" });
  };

  const scroll = (dir: 1 | -1) => goTo(active + dir);

  // Drag-to-scroll dengan mouse (pointer events)
  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startScroll: 0,
    moved: false,
    pointerId: -1,
  });

  const onPointerDown = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el) return;
    dragRef.current.startX = e.clientX;
    dragRef.current.startScroll = el.scrollLeft;
    dragRef.current.pointerId = e.pointerId;
    dragRef.current.dragging = false;
    dragRef.current.moved = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el || e.pointerId !== dragRef.current.pointerId) return;
    const dx = e.clientX - dragRef.current.startX;
    if (!dragRef.current.dragging && Math.abs(dx) > 5) {
      dragRef.current.dragging = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (dragRef.current.dragging) {
      dragRef.current.moved = true;
      el.scrollLeft = dragRef.current.startScroll - dx;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (
      el &&
      dragRef.current.dragging &&
      e.pointerId === dragRef.current.pointerId
    ) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    dragRef.current.dragging = false;
  };

  // Cegah klik kartu terpicu setelah drag
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 dark:text-white">
            Browse by category
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light">
            Temukan pekerjaan yang tepat untukmu dari {jobs.length}+ lowongan
            terverifikasi di Jabodetabek.
          </p>
        </div>

        <div className="relative">
          <div
            ref={trackRef}
            onScroll={syncActive}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClickCapture={onClickCapture}
            className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth snap-pl-4 snap-pr-14 sm:snap-pl-10 sm:snap-pr-10 pb-2 px-4 sm:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
          >
            {CATEGORY_CARDS.map((c) => {
              return (
                <button
                  key={c.match}
                  data-card
                  onClick={() => onSelectCategory(c.category)}
                  className="relative shrink-0 w-[78vw] max-w-[340px] sm:w-[380px] sm:max-w-none h-[220px] sm:h-[240px] rounded-2xl overflow-hidden text-left snap-start cursor-pointer border border-slate-200 dark:border-slate-800 shadow-2xs"
                >
                  <img
                    src={c.image}
                    alt={c.label}
                    loading="lazy"
                    draggable={false}
                    style={{
                      objectPosition: c.focus,
                      transform: `scale(${c.zoom})`,
                    }}
                    className="absolute inset-0 w-full h-full object-cover select-none"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/90 via-black/50 via-45% to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 p-5 pb-6">
                    <h3 className="text-sm sm:text-base font-medium text-white leading-snug">
                      {c.label}
                    </h3>
                    <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-white bg-[#0C52EE] px-2.5 py-1 rounded-full transition-all duration-200 hover:bg-[#0942c4] hover:scale-105">
                      Lihat {">"}
                    </span>
                  </div>
                </button>
              );
            })}

            <div
              data-card
              className="relative shrink-0 w-[78vw] max-w-[340px] sm:w-[380px] sm:max-w-none h-[220px] sm:h-[240px] rounded-2xl overflow-hidden snap-start snap-end border border-[#0C52EE] bg-[#0C52EE] text-white flex items-center text-left"
            >
              {/* overlay icon besar di kanan, dipotong tepi card */}
              <LuLayoutGrid
                aria-hidden="true"
                className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 text-[190px] leading-none text-white/12 select-none"
              />

              <div className="relative z-10 px-6 sm:px-7">
                <h3 className="text-base sm:text-lg font-semibold text-white leading-snug">
                  Explore
                </h3>
                <button
                  onClick={onExploreAll}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-white underline underline-offset-4 hover:text-blue-100 hover:gap-2.5 transition-all duration-200 cursor-pointer"
                >
                  Semua Lowongan
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => scroll(-1)}
            aria-label="Sebelumnya"
            className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            disabled={active === 0}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ke halaman ${i + 1}`}
                aria-current={i === active}
                className={`h-2 rounded-full transition-all ${
                  i === active
                    ? "w-6 bg-[#0C52EE]"
                    : "w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => scroll(1)}
            aria-label="Berikutnya"
            className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            disabled={active >= pages - 1}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

// Logo perusahaan utuh di sisi kanan card — tampil penuh tanpa dipotong tepi
// card dan tanpa transparansi. Tanpa logo (atau gagal load) → placeholder
// ikon gedung netral.
function LogoSide({ logoUrl, name }: { logoUrl?: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!logoUrl || failed) {
    return (
      <div
        aria-hidden="true"
        title={`Belum ada logo untuk ${name}`}
        className="shrink-0 h-16 w-16 sm:h-20 sm:w-20 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center"
      >
        <svg
          className="h-1/2 w-1/2 text-slate-200 dark:text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M3 21h18M5 21V5a1 1 0 011-1h8a1 1 0 011 1v16m0-9h3a1 1 0 011 1v9M8 8h.01M8 12h.01M8 16h.01M11 8h.01M11 12h.01M11 16h.01"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`Logo ${name}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="shrink-0 h-16 w-16 sm:h-20 sm:w-20 object-contain"
    />
  );
}

export function FeaturedJobs({
  jobs,
  onOpenJob,
  onBrowseAll,
}: {
  jobs: RankedJobResult[];
  onOpenJob: (job: RankedJobResult) => void;
  onBrowseAll: () => void;
}) {
  const featured = jobs.slice(0, 9);
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-100 dark:border-slate-800">
      <div className="space-y-8">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 dark:text-white">
            Explore The Latest Job Openings
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light">
            Daftar pekerjaan part-time yang mungkin cocok dengan jadwal kuliahmu
            !
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((job) => {
            return (
              <button
                key={job.job_id}
                onClick={() => onOpenJob(job)}
                className="p-4 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl text-left transition-all shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                      {job.job_title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light truncate">
                      {job.company_name}
                    </p>
                    <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/40 text-[#c83472] dark:text-pink-300 text-[10px] font-semibold">
                      {job.job_category}
                    </span>
                  </div>
                  <LogoSide
                    logoUrl={job.company_logo}
                    name={job.company_name}
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400 font-light">
                  <span className="font-medium text-slate-900 dark:text-white">
                    Rp {job.work_salaryperhour.toLocaleString("id-ID")}/jam
                  </span>
                  <span>{job.work_hours} jam/mgg</span>
                  <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-normal">
                    {job.work_system}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onBrowseAll}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors bg-white dark:bg-slate-900 shadow-2xs cursor-pointer"
          >
            Browse All {jobs.length} Jobs {"\u2192"}
          </button>
        </div>
      </div>
    </section>
  );
}

export function StatsPartners({ jobs }: { jobs: RankedJobResult[] }) {
  return (
    <section className="py-14 bg-white dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="max-w-2xl mx-auto space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-white tracking-tight">
            Find Your Perfect Part-Time Job
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light">
            Rekomendasi pekerjaan part-time yang paling cocok untuk kamu dengan
            sumber yang terpercaya
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto py-2">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-medium text-slate-900 dark:text-white tracking-tight">
              {jobs.length - 21}
              <span className="text-[#0C52EE]">+</span>
            </div>
            <p className="text-xs text-slate-400 font-light">
              Loker Terverifikasi
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-medium text-slate-900 dark:text-white tracking-tight">
              5<span className="text-[#0C52EE]">+</span>
            </div>
            <p className="text-xs text-slate-400 font-light">
              Kriteria Penilaian
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-medium text-slate-900 dark:text-white tracking-tight">
              100<span className="text-[#ED1E79]">%</span>
            </div>
            <p className="text-xs text-slate-400 font-light">
              Transparansi ROC
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-x-10 sm:gap-x-14 gap-y-5">
          {SOURCE_PORTALS.map((portal) => (
            <div
              key={portal.name}
              className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity"
            >
              <img
                src={portal.logo}
                alt={`${portal.name} logo`}
                loading="lazy"
                className="h-6 w-6 object-contain shrink-0"
              />
              <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                {portal.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BlueBanner({
  onQuickSearch,
}: {
  onQuickSearch: (q: string) => void;
}) {
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="w-full rounded-2xl bg-[#0C52EE] p-8 sm:p-12 text-center text-white space-y-4 shadow-sm">
        <h2 className="text-2xl sm:text-3xl font-medium tracking-tight">
          Start Looking For The Best Part-Time
        </h2>
        <p className="text-xs sm:text-sm text-blue-100 font-light max-w-xl mx-auto leading-relaxed">
          Temukan posisi kerja yang paling fleksibel dengan jadwal kuliahmu hari
          ini menggunakan algoritma SMARTER &amp; ROC.
        </p>

        <div className="pt-4">
          <button
            onClick={() => onQuickSearch("")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 hover:bg-blue-50 rounded-xl text-sm font-medium transition-all duration-200 hover:gap-3 shadow-sm cursor-pointer"
          >
            Eksplore Semua Lowongan
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter({
  totalJobs,
  onNavigate,
}: {
  totalJobs: number;
  onNavigate: (view: "landing" | "portal" | "matrix" | "kuesioner") => void;
}) {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400 font-light transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
        <div className="space-y-2 col-span-2 md:col-span-1">
          <div className="font-medium text-slate-900 dark:text-white text-base tracking-tighter">
            upmatch
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-light">
            Sistem rekomendasi part-time untuk mahasiswa berbasis metode
            Multi-Criteria Decision Making (MCDM) SMARTER &amp; ROC.
          </p>
        </div>
        <div className="space-y-1.5">
          <h4 className="font-medium text-slate-900 dark:text-white text-xs">
            Navigasi
          </h4>
          <p>
            <button
              onClick={() => onNavigate("landing")}
              className="hover:text-[#0C52EE] cursor-pointer"
            >
              Beranda
            </button>
          </p>
          <p>
            <button
              onClick={() => onNavigate("portal")}
              className="hover:text-[#0C52EE] cursor-pointer"
            >
              Lowongan
            </button>
          </p>
          <p>
            <button
              onClick={() => onNavigate("matrix")}
              className="hover:text-[#0C52EE] cursor-pointer"
            >
              Perhitungan SPK
            </button>
          </p>
        </div>
        <div className="space-y-1.5">
          <h4 className="font-medium text-slate-900 dark:text-white text-xs">
            Untuk Siapa
          </h4>
          <p className="text-slate-400">Mahasiswa Aktif</p>
          <p className="text-slate-400">Semua Jurusan & Kampus</p>
          <p className="text-slate-400">Indonesia</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px]">
        <span className="tracking-tighter">
          {"\u00A9"} 2026 upmatch. All rights reserved.
        </span>
        <span>
          {totalJobs} Lowongan Terverifikasi {"\u2022"} Untuk Mahasiswa
        </span>
      </div>
    </footer>
  );
}
