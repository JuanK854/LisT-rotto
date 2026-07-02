"use client";

import { useCallback, useEffect, useState } from "react";
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

export default function AdminPage() {
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [sessions, setSessions] = useState<{ id: string; open: boolean }[]>([]);
  const [viewSession, setViewSession] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
        api(`/api/admin/attendance${viewSession ? `?session=${viewSession}` : ""}`),
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
  }, [api, viewSession]);

  // Carga inicial + polling cada 10s mientras hay usuario
  useEffect(() => {
    if (!authSession) return;
    // refresh es async: el setState ocurre tras la respuesta de red, no en el render
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [authSession, refresh]);

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

  async function toggleStudent(row: Row) {
    // Optimista: actualiza la UI de inmediato y revierte si falla
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, present: !r.present, markedBy: "admin" } : r))
    );
    try {
      await api("/api/admin/attendance", {
        method: "POST",
        body: JSON.stringify({
          studentId: row.id,
          sessionId: viewSession || undefined,
          present: !row.present,
        }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      await refresh();
    }
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
        </form>
      </main>
    );
  }

  const presentCount = rows.filter((r) => r.present).length;
  const viewingToday = !viewSession || viewSession === session?.sessionId;

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="font-semibold tracking-widest uppercase text-xs bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent">
            Remotto · Taller Vibe Coding
          </p>
          <h1 className="text-2xl font-bold">Panel de asistencia</h1>
        </div>
        <button
          onClick={() => clientAuth().auth.signOut()}
          className="text-muted hover:text-foreground text-sm border border-border rounded-lg px-3 py-2"
        >
          Salir
        </button>
      </header>

      {error && (
        <p className="mb-4 rounded-xl border border-danger/40 bg-danger/10 text-danger px-4 py-3">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-border bg-card p-6 mb-6 text-center">
        {session?.open ? (
          <>
            <p className="text-muted mb-1">Código del día — proyéctalo en pantalla</p>
            <p className="text-7xl font-mono font-bold tracking-[0.2em] text-accent">
              {session.code}
            </p>
            <button
              onClick={() => toggleSession("close")}
              disabled={busy}
              className="mt-4 rounded-xl border border-danger/50 text-danger px-5 py-2 hover:bg-danger/10"
            >
              Cerrar sesión de hoy
            </button>
          </>
        ) : (
          <>
            <p className="text-muted mb-3">
              No hay sesión abierta hoy ({session?.sessionId})
            </p>
            <button
              onClick={() => toggleSession("open")}
              disabled={busy}
              className="rounded-xl bg-accent hover:bg-accent-hover text-white text-lg font-semibold px-6 py-3"
            >
              {busy ? "Abriendo…" : "Abrir sesión de hoy"}
            </button>
          </>
        )}
      </section>

      <section className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={viewSession}
          onChange={(e) => setViewSession(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2"
        >
          <option value="">Hoy</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id}
            </option>
          ))}
        </select>
        <span className="text-muted">
          {presentCount} / {rows.length} presentes
        </span>
        <button
          onClick={exportCsv}
          className="ml-auto rounded-xl border border-border px-4 py-2 text-sm hover:border-accent"
        >
          Exportar CSV
        </button>
      </section>

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
                  ? `✓ Presente${r.markedBy === "admin" ? " (manual)" : ""}`
                  : "Ausente"}
              </span>
            </button>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="text-center text-muted py-8">
            No hay alumnos cargados todavía{viewingToday ? "" : " para esa sesión"}.
          </li>
        )}
      </ul>
    </main>
  );
}
