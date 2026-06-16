'use client';

import { useState } from "react";

export function ContactForm({ C, isDark }) {
  const [form, setForm] = useState({ nombre: "", email: "", mensaje: "", website: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | ok | error
  const [error, setError] = useState("");

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Honeypot: si está relleno, es un bot. Fingimos éxito y no enviamos.
    if (form.website) {
      setStatus("ok");
      return;
    }
    if (!form.nombre.trim() || !form.email.trim() || !form.mensaje.trim()) {
      setError("Por favor, rellena todos los campos.");
      return;
    }
    if (!/.+@.+\..+/.test(form.email)) {
      setError("Introduce un email válido.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setError(data?.error || "No se pudo enviar. Inténtalo de nuevo.");
        return;
      }
      setStatus("ok");
      setForm({ nombre: "", email: "", mensaje: "", website: "" });
    } catch {
      setStatus("error");
      setError("No se pudo enviar. Inténtalo de nuevo o escríbeme por email.");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 16px",
    fontSize: 15,
    fontFamily: "inherit",
    color: C.ctaText,
    background: isDark ? "#ffffff" : "#2a2a2d",
    border: `1px solid ${isDark ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.16)"}`,
    borderRadius: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  if (status === "ok") {
    return (
      <p style={{ fontSize: 16, color: C.ctaText, fontWeight: 500, margin: 0 }}>
        ¡Gracias! Tu mensaje se ha enviado. Te responderé pronto.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
      <input
        type="text"
        name="nombre"
        placeholder="Nombre"
        value={form.nombre}
        onChange={onChange}
        autoComplete="name"
        style={inputStyle}
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={onChange}
        autoComplete="email"
        style={inputStyle}
      />
      <textarea
        name="mensaje"
        placeholder="Tu mensaje"
        value={form.mensaje}
        onChange={onChange}
        rows={4}
        style={{ ...inputStyle, resize: "vertical", minHeight: 110 }}
      />
      {/* Honeypot anti-spam: invisible para humanos */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={onChange}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      {error ? <p style={{ fontSize: 13, color: "#e0564f", margin: 0 }}>{error}</p> : null}
      <button
        type="submit"
        className="btn-blue"
        disabled={status === "sending"}
        style={{
          padding: "13px 28px",
          border: "none",
          cursor: status === "sending" ? "default" : "pointer",
          opacity: status === "sending" ? 0.7 : 1,
        }}>
        {status === "sending" ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
