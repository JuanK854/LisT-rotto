"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { clientAuth } from "@/lib/supabase-client";

type Row = {
  id: string;
  name: string;
  present: boolean;
  markedBy: "self" | "admin" | null;
  checkedInAt: string | null;
};

type SessionInfo = { sessionId: string; open: boolean; code: string | null };
type SessionSummary = { id: string; open: boolean; present: number };

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState<"hoy" | "historial" | "codigo">("codigo");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [historyDate, setHistoryDate] = useState<string | null>(null);
  const [historyRows, setHistoryRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [creatingDate, setCreatingDate] = useState(false);
  const [addMessage, setAddMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const supa = clientAuth();
    supa.auth.getSession().then(({ data }) => {
      setAuthSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supa.auth.onAuthStateChange((_event, s) => {
      setAuthSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const { data } = await clientAuth().auth.getSession();
    const token = data.session?.access_token;
    const res = await fetch(path, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (res.status === 401) {
      throw new Error("Tu cuenta no tiene acceso de administrador");
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Error del servidor");
    }
    return res;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [sessRes, listRes, allRes] = await Promise.all([
        api("/api/admin/session"),
        api("/api/admin/attendance"),
        api("/api/admin/sessions"),
      ]);
      const sess = await sessRes.json();
      const list = await listRes.json();
      const all = await allRes.json();
      setSession({
        sessionId: sess.sessionId,
        open: sess.exists && sess.open,
        code: sess.exists ? sess.code : null,
      });
      setRows(list.students);
      setSessions(all.sessions);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }, [api]);

  // Carga inicial + polling cada 10s mientras hay usuario
  useEffect(() => {
    if (!authSession) return;
    // refresh es async: el setState ocurre tras la respuesta de red, no en el render
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [authSession, refresh]);

  // Detalle de una fecha del historial
  useEffect(() => {
    if (!historyDate) return;
    api(`/api/admin/attendance?session=${historyDate}`)
      .then((r) => r.json())
      .then((data) => setHistoryRows(data.students))
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [historyDate, api]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setLoggingIn(true);
    const { error } = await clientAuth().auth.signInWithPassword({
      email,
      password,
    });
    if (error) setAuthError("Email o contraseña incorrectos");
    setLoggingIn(false);
  }

  async function toggleSession(action: "open" | "close") {
    setBusy(true);
    try {
      await api("/api/admin/session", {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStudent(row: Row, sessionId?: string) {
    const apply = (list: Row[]) =>
      list.map((r) =>
        r.id === row.id ? { ...r, present: !r.present, markedBy: "admin" as const } : r
      );
    // Optimista: actualiza la UI de inmediato y revierte si falla
    if (sessionId) setHistoryRows(apply);
    else setRows(apply);
    try {
      await api("/api/admin/attendance", {
        method: "POST",
        body: JSON.stringify({
          studentId: row.id,
          sessionId,
          present: !row.present,
        }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      await refresh();
    }
  }

  async function createPastSession(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate || creatingDate) return;
    setCreatingDate(true);
    try {
      await api("/api/admin/session", {
        method: "POST",
        body: JSON.stringify({ action: "create", sessionId: newDate }),
      });
      await refresh();
      // Abre directo el detalle de la fecha para rellenar la asistencia
      setHistoryDate(newDate);
      setNewDate("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setCreatingDate(false);
    }
  }

  async function deleteSession(sessionId: string) {
    if (
      !window.confirm(
        `¿Eliminar el pase de lista del ${formatDate(sessionId)}? Se borra también su asistencia. Esto no se puede deshacer.`
      )
    )
      return;
    try {
      await api(`/api/admin/session?session=${sessionId}`, { method: "DELETE" });
      setHistoryDate(null);
      setHistoryRows([]);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    if (adding) return;
    setAdding(true);
    setAddMessage(null);
    try {
      const res = await api("/api/admin/students", {
        method: "POST",
        body: JSON.stringify({ name: newName, phone: newPhone }),
      });
      const data = await res.json();
      setAddMessage({ ok: true, text: `${data.name} ya aparece en la lista` });
      setNewName("");
      setNewPhone("");
      await refresh();
    } catch (e) {
      setAddMessage({ ok: false, text: e instanceof Error ? e.message : "Error" });
    } finally {
      setAdding(false);
    }
  }

  async function showQr() {
    // Carga diferida: la librería solo se descarga cuando se usa
    const QRCode = (await import("qrcode")).default;
    // Si el pase está abierto, el QR lleva el código: el alumno ya no lo teclea
    const target =
      session?.open && session.code
        ? `${window.location.origin}/?c=${session.code}`
        : window.location.origin;
    // Corrección "H": el QR sigue leyéndose aunque el centro esté tapado por los dígitos
    const url = await QRCode.toDataURL(target, {
      width: 960,
      margin: 2,
      errorCorrectionLevel: "H",
    });
    setQrDataUrl(url);
  }

  async function exportCsv() {
    try {
      const res = await api("/api/admin/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "asistencia.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  if (!authReady) {
    return <main className="flex-1 grid place-items-center text-muted">Cargando…</main>;
  }

  if (!authSession) {
    return (
      <main className="flex-1 grid place-items-center px-4">
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center"
        >
          <p className="font-semibold tracking-widest uppercase text-sm mb-2 bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent">
            Remotto · Taller Vibe Coding
          </p>
          <h1 className="text-2xl font-bold mb-6">Panel de administración</h1>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            required
            className="w-full mb-3 rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete="current-password"
            required
            className="w-full mb-5 rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={loggingIn}
            className="w-full rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-lg font-semibold py-3 transition-colors"
          >
            {loggingIn ? "Entrando…" : "Entrar"}
          </button>
          {authError && <p className="text-danger mt-4">{authError}</p>}
          <p className="mt-6 text-muted">
            Esta pantalla es solo para los instructores.
          </p>
          <Link
            href="/"
            className="mt-3 block w-full rounded-xl border border-border text-lg py-3 text-foreground hover:border-accent transition-colors"
          >
            ← Volver al pase de lista
          </Link>
        </form>
      </main>
    );
  }

  const presentCount = rows.filter((r) => r.present).length;

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="font-semibold tracking-widest uppercase text-xs bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent">
            Remotto · Taller Vibe Coding
          </p>
          <h1 className="text-2xl font-bold">Panel de asistencia</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-muted hover:text-foreground text-sm border border-border hover:border-accent rounded-lg px-3 py-2 transition-colors"
          >
            Ver pase de lista
          </Link>
          <button
            onClick={() => clientAuth().auth.signOut()}
            className="text-muted hover:text-foreground text-sm border border-border rounded-lg px-3 py-2"
          >
            Salir
          </button>
        </div>
      </header>

      {error && (
        <p className="mb-4 rounded-xl border border-danger/40 bg-danger/10 text-danger px-4 py-3">
          {error}
        </p>
      )}

      <nav className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("codigo")}
          className={`rounded-xl px-5 py-2 font-semibold transition-colors ${
            tab === "codigo" ? "bg-accent text-white" : "border border-border text-muted hover:text-foreground"
          }`}
        >
          Código
        </button>
        <button
          onClick={() => setTab("hoy")}
          className={`rounded-xl px-5 py-2 font-semibold transition-colors ${
            tab === "hoy" ? "bg-accent text-white" : "border border-border text-muted hover:text-foreground"
          }`}
        >
          Hoy
        </button>
        <button
          onClick={() => {
            setTab("historial");
            setHistoryDate(null);
          }}
          className={`rounded-xl px-5 py-2 font-semibold transition-colors ${
            tab === "historial" ? "bg-accent text-white" : "border border-border text-muted hover:text-foreground"
          }`}
        >
          Historial
        </button>
      </nav>

      {tab === "codigo" && (
        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          {session?.open ? (
            <>
              <p className="text-muted mb-1">Código para marcar asistencia</p>
              <p className="text-[min(21vw,11rem)] leading-none my-4 font-mono font-bold tracking-[0.15em] text-accent">
                {session.code}
              </p>
              <p className="text-muted mt-3 max-w-md mx-auto">
                Esta pestaña no muestra la lista ni la asistencia: es segura para
                proyectarla en el salón. El QR ya lleva el código integrado.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={showQr}
                  className="rounded-xl bg-accent hover:bg-accent-hover text-white text-lg font-semibold px-6 py-3 transition-colors"
                >
                  ⛶ Proyectar QR
                </button>
                <button
                  onClick={() => toggleSession("close")}
                  disabled={busy}
                  className="rounded-xl border border-danger/50 text-danger px-5 py-3 hover:bg-danger/10"
                >
                  Terminar pase de lista
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-2">Pase de lista de hoy</h2>
              <p className="text-muted mb-4 max-w-md mx-auto">
                Al iniciarlo se genera el código de 4 dígitos del día y se habilita el QR
                para proyectar. Los alumnos escanean, buscan su nombre y quedan registrados.
              </p>
              <button
                onClick={() => toggleSession("open")}
                disabled={busy}
                className="rounded-xl bg-accent hover:bg-accent-hover text-white text-lg font-semibold px-6 py-3"
              >
                {busy ? "Iniciando…" : "Iniciar pase de lista"}
              </button>
            </>
          )}
        </section>
      )}

      {tab === "hoy" && (
        <>
          <section className="mb-6 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold text-lg mb-1">Añadir integrante</h2>
            <p className="text-muted text-sm mb-4">
              Se agrega a la base de datos y aparece de inmediato en la lista para pasar lista.
              El teléfono es opcional y sale en el Excel junto al total de asistencias.
            </p>
            <form onSubmit={addStudent} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre completo (nombre y apellidos)"
                required
                minLength={3}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent placeholder:text-muted"
              />
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Teléfono (opcional)"
                className="sm:w-52 rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent placeholder:text-muted"
              />
              <button
                type="submit"
                disabled={adding || newName.trim().length < 3}
                className="rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 text-white font-semibold px-6 py-3 transition-colors"
              >
                {adding ? "Añadiendo…" : "Añadir"}
              </button>
            </form>
            {addMessage && (
              <p className={`mt-3 ${addMessage.ok ? "text-success" : "text-danger"}`}>
                {addMessage.ok ? "✓ " : ""}{addMessage.text}
              </p>
            )}
          </section>

          <section className="flex items-center gap-3 mb-4">
            <h2 className="font-bold text-lg">Lista de hoy</h2>
            <span className="text-muted">
              {presentCount} / {rows.length} presentes
            </span>
          </section>
          <p className="text-muted text-sm mb-3">
            Toca un nombre para marcarlo o desmarcarlo manualmente.
          </p>

          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => toggleStudent(r)}
                  className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    r.present
                      ? "border-success/40 bg-success/10"
                      : "border-border bg-card hover:border-accent"
                  }`}
                >
                  <span>{r.name}</span>
                  <span className={r.present ? "text-success font-semibold" : "text-muted"}>
                    {r.present
                      ? `✓ ${formatTime(r.checkedInAt)}${r.markedBy === "admin" ? " (manual)" : ""}`
                      : "Ausente"}
                  </span>
                </button>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="text-center text-muted py-8">No hay alumnos cargados todavía.</li>
            )}
          </ul>

        </>
      )}

      {tab === "historial" && !historyDate && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted">
              Cada día de clase queda guardado aquí. Toca una fecha para ver quiénes asistieron.
            </p>
            <button
              onClick={exportCsv}
              className="shrink-0 ml-3 rounded-xl border border-border px-4 py-2 text-sm hover:border-accent"
            >
              Descargar Excel
            </button>
          </div>

          <form
            onSubmit={createPastSession}
            className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-border bg-card p-4 mb-4"
          >
            <div className="flex-1">
              <p className="text-sm text-muted mb-2">
                ¿Faltó registrar un día? Elige la fecha y rellena la asistencia a mano.
              </p>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                max={session?.sessionId}
                required
                className="w-full sm:w-auto rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent [color-scheme:light_dark]"
              />
            </div>
            <button
              type="submit"
              disabled={!newDate || creatingDate}
              className="self-end rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 text-white font-semibold px-6 py-3 transition-colors"
            >
              {creatingDate ? "Creando…" : "Añadir fecha"}
            </button>
          </form>
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-stretch gap-2">
                <button
                  onClick={() => setHistoryDate(s.id)}
                  className="flex-1 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-4 text-left hover:border-accent transition-colors"
                >
                  <span className="capitalize font-semibold">{formatDate(s.id)}</span>
                  <span className="text-muted">
                    {s.present} asistente{s.present === 1 ? "" : "s"} →
                  </span>
                </button>
                <button
                  onClick={() => deleteSession(s.id)}
                  title="Eliminar este pase de lista"
                  className="shrink-0 rounded-xl border border-border px-4 text-muted hover:border-danger hover:text-danger transition-colors"
                >
                  🗑
                </button>
              </li>
            ))}
            {sessions.length === 0 && (
              <li className="text-center text-muted py-8">
                Todavía no hay días registrados. Se guardan al iniciar el pase de lista.
              </li>
            )}
          </ul>
        </>
      )}

      {tab === "historial" && historyDate && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => {
                setHistoryDate(null);
                setHistoryRows([]);
              }}
              className="rounded-xl border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
            >
              ← Fechas
            </button>
            <h2 className="font-bold text-lg capitalize">{formatDate(historyDate)}</h2>
            <span className="text-muted">
              {historyRows.filter((r) => r.present).length} / {historyRows.length}
            </span>
          </div>
          <p className="text-muted text-sm mb-3">
            Toca un nombre si necesitas corregir la asistencia de ese día.
          </p>
          <ul className="space-y-2">
            {historyRows.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => toggleStudent(r, historyDate)}
                  className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    r.present
                      ? "border-success/40 bg-success/10"
                      : "border-border bg-card hover:border-accent"
                  }`}
                >
                  <span>{r.name}</span>
                  <span className={r.present ? "text-success font-semibold" : "text-muted"}>
                    {r.present
                      ? `✓ ${formatTime(r.checkedInAt)}${r.markedBy === "admin" ? " (manual)" : ""}`
                      : "Ausente"}
                  </span>
                </button>
              </li>
            ))}
            {historyRows.length === 0 && (
              <li className="text-center text-muted py-8">Cargando…</li>
            )}
          </ul>
        </>
      )}

      {qrDataUrl && (
        <div
          onClick={() => setQrDataUrl(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white cursor-pointer p-8"
        >
          <p className="text-3xl sm:text-5xl font-bold text-black text-center">
            Escanea para pasar lista
          </p>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="Código QR del pase de lista"
              className="w-[min(70vh,90vw)] max-w-full"
            />
            {session?.open && session.code && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl border-4 border-black px-4 py-2 font-mono font-bold text-black text-[min(8vh,10vw)] leading-none tracking-widest">
                {session.code}
              </span>
            )}
          </div>
          <p className="text-2xl sm:text-4xl font-mono font-bold text-black text-center">
            {typeof window !== "undefined" ? window.location.host : ""}
          </p>
        </div>
      )}
    </main>
  );
}
