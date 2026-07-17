"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Student = { id: string; name: string };

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function StudentPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  // { name, already } — already=true si intentó registrarse dos veces
  const [confirmed, setConfirmed] = useState<{ name: string; already: boolean } | null>(null);
  // Permite registrar a otra persona desde el mismo dispositivo
  const [showList, setShowList] = useState(false);
  // Código que viene en el QR (/?c=1234): el alumno ya no lo teclea
  const [urlCode, setUrlCode] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const c = new URLSearchParams(window.location.search).get("c");
    return c && /^\d{4}$/.test(c) ? c : null;
  });

  const load = useCallback(() => {
    fetch("/api/students")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setError("");
        setSessionOpen(data.sessionOpen);
        setSessionId(data.sessionId);
        setStudents(data.students);
        // Si este dispositivo ya registró a alguien hoy, mostrarlo de una vez
        const saved = localStorage.getItem(`checkin-${data.sessionId}`);
        if (saved) setConfirmed({ name: saved, already: false });
      })
      .catch(() => setError("No se pudo cargar la lista. Recarga la página."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    // Al volver con "atrás" el navegador restaura la página congelada (bfcache):
    // hay que volver a pedir los datos para que la lista siempre cargue.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) load();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [load]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return students;
    return students.filter((s) => normalize(s.name).includes(q));
  }, [query, students]);

  async function submitCheckin() {
    if (!selected || submitting) return;
    setSubmitting(true);
    setModalError("");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selected.id, code: urlCode ?? code }),
      });
      const data = await res.json();
      if (!res.ok) {
        // El código del QR ya no es válido (p. ej. QR de otro día):
        // se descarta y se pide teclearlo como siempre
        if (res.status === 403 && urlCode) {
          setUrlCode(null);
          setModalError("El código cambió. Escribe el que está en la pantalla del salón.");
          return;
        }
        setModalError(data.error || "Ocurrió un error, intenta de nuevo");
        return;
      }
      localStorage.setItem(`checkin-${sessionId}`, selected.name);
      setConfirmed({ name: selected.name, already: data.alreadyChecked === true });
      setSelected(null);
      setCode("");
      setShowList(false);
    } catch {
      setModalError("Error de conexión, intenta de nuevo");
    } finally {
      setSubmitting(false);
    }
  }

  const registered = confirmed !== null;

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10 sm:py-16">
      <header className="text-center mb-10">
        <p className="inline-flex items-center rounded-full glass px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-brand-gradient mb-5">
          Remotto · Taller Vibe Coding
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">Pase de lista</h1>
        <p className="mt-3 text-muted text-lg">Busca tu nombre y confirma tu asistencia de hoy.</p>
      </header>

      {confirmed && (
        <div className="mb-8 rounded-3xl glass border-success/30 p-8 text-center shadow-[0_20px_60px_-25px_rgba(52,211,153,0.5)]">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-success/15 text-success text-3xl">
            ✓
          </div>
          <p className="text-3xl font-bold">
            {confirmed.already ? "Ya estabas registrado" : `¡Listo, ${confirmed.name}!`}
          </p>
          <p className="text-lg mt-2 text-muted">
            {confirmed.already
              ? `${confirmed.name}, tu asistencia de hoy ya estaba guardada.`
              : "Tu asistencia de hoy quedó registrada. Ya no tienes que hacer nada más."}
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-2xl glass border-danger/30 text-danger text-center text-lg mb-6 px-4 py-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-center text-muted text-lg">Cargando lista…</p>
      ) : registered && !showList ? (
        <p className="text-center">
          <button
            onClick={() => setShowList(true)}
            className="text-muted underline underline-offset-4 hover:text-foreground text-lg transition-colors"
          >
            Registrar a otra persona desde este dispositivo
          </button>
        </p>
      ) : (
        <>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 size-5 text-muted"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe tu nombre…"
              autoComplete="off"
              className="w-full text-xl rounded-2xl glass pl-13 pr-5 py-4 outline-none focus:border-accent transition-colors placeholder:text-muted"
            />
          </div>

          <ul className="mt-4 space-y-2">
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    if (!sessionOpen) return;
                    setSelected(s);
                    setCode("");
                    setModalError("");
                  }}
                  disabled={!sessionOpen}
                  className={`group w-full flex items-center justify-between gap-3 text-left text-lg rounded-2xl glass px-5 py-4 transition-all ${
                    sessionOpen
                      ? "hover:border-accent hover:bg-white/[0.05]"
                      : "text-muted opacity-70"
                  }`}
                >
                  <span>{s.name}</span>
                  {sessionOpen && (
                    <span className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">→</span>
                  )}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-center text-muted text-lg py-6">
                No encontramos ese nombre. Avísale al instructor.
              </li>
            )}
          </ul>
        </>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#05050f]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl glass bg-card-solid/95 p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
            <h2 className="text-2xl font-bold text-center tracking-tight">{selected.name}</h2>
            {urlCode ? (
              <p className="text-center text-muted text-lg mt-2 mb-1">
                ¿Eres tú? Confirma para registrar tu asistencia.
              </p>
            ) : (
              <>
                <p className="text-center text-muted text-lg mt-2 mb-4">
                  Escribe el código de 4 dígitos que está en la pantalla del salón
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="0000"
                  autoFocus
                  className="w-full text-center text-4xl tracking-[0.5em] font-mono rounded-2xl border border-border bg-black/30 px-4 py-4 outline-none focus:border-accent transition-colors"
                />
              </>
            )}
            {modalError && (
              <p className="text-danger text-center text-lg mt-3">{modalError}</p>
            )}
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={submitCheckin}
                disabled={(!urlCode && code.length !== 4) || submitting}
                className="btn-brand w-full rounded-full text-xl font-semibold py-4"
              >
                {submitting ? "Registrando…" : "Marcar mi asistencia"}
              </button>
              <button
                onClick={() => setSelected(null)}
                className="w-full rounded-full border border-border text-lg py-3 text-muted hover:text-foreground hover:border-border-strong transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
