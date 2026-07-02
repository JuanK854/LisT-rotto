"use client";

import { useEffect, useMemo, useState } from "react";

type Student = { id: string; name: string; present: boolean };

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
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [confirmed, setConfirmed] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setSessionOpen(data.sessionOpen);
        setStudents(data.students);
      })
      .catch(() => setError("No se pudo cargar la lista. Recarga la página."))
      .finally(() => setLoading(false));
  }, []);

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
        body: JSON.stringify({ studentId: selected.id, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "Ocurrió un error, intenta de nuevo");
        return;
      }
      setStudents((prev) =>
        prev.map((s) => (s.id === selected.id ? { ...s, present: true } : s))
      );
      setConfirmed(selected.name);
      setSelected(null);
      setCode("");
    } catch {
      setModalError("Error de conexión, intenta de nuevo");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <header className="text-center mb-8">
        <p className="text-accent font-semibold tracking-widest uppercase text-sm mb-2">
          Curso Vibe Coding
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold">Pase de lista</h1>
        {!loading && (
          <p className={`mt-3 text-lg ${sessionOpen ? "text-success" : "text-muted"}`}>
            {sessionOpen
              ? "● La sesión de hoy está abierta"
              : "○ No hay sesión activa en este momento"}
          </p>
        )}
      </header>

      {confirmed && (
        <div className="mb-6 rounded-2xl border border-success/40 bg-success/10 p-6 text-center">
          <p className="text-2xl font-bold text-success">✓ ¡Listo, {confirmed}!</p>
          <p className="text-lg mt-1">Tu asistencia quedó registrada.</p>
        </div>
      )}

      {error && (
        <p className="text-danger text-center text-lg mb-6">{error}</p>
      )}

      {loading ? (
        <p className="text-center text-muted text-lg">Cargando lista…</p>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe tu nombre…"
            autoComplete="off"
            className="w-full text-xl rounded-2xl border border-border bg-card px-5 py-4 outline-none focus:border-accent placeholder:text-muted"
          />

          <ul className="mt-4 space-y-2">
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    if (s.present || !sessionOpen) return;
                    setSelected(s);
                    setCode("");
                    setModalError("");
                  }}
                  disabled={s.present || !sessionOpen}
                  className={`w-full text-left text-lg rounded-xl border px-5 py-4 transition-colors ${
                    s.present
                      ? "border-success/40 bg-success/10 text-success"
                      : sessionOpen
                        ? "border-border bg-card hover:border-accent active:bg-accent/10"
                        : "border-border bg-card text-muted"
                  }`}
                >
                  {s.name}
                  {s.present && <span className="float-right font-bold">✓ Presente</span>}
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <h2 className="text-2xl font-bold text-center">{selected.name}</h2>
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
              className="w-full text-center text-4xl tracking-[0.5em] font-mono rounded-xl border border-border bg-background px-4 py-4 outline-none focus:border-accent"
            />
            {modalError && (
              <p className="text-danger text-center text-lg mt-3">{modalError}</p>
            )}
            <div className="mt-5 flex flex-col gap-3">
              <button
                onClick={submitCheckin}
                disabled={code.length !== 4 || submitting}
                className="w-full rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-xl font-semibold py-4 transition-colors"
              >
                {submitting ? "Registrando…" : "Marcar mi asistencia"}
              </button>
              <button
                onClick={() => setSelected(null)}
                className="w-full rounded-xl border border-border text-lg py-3 text-muted hover:text-foreground"
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
