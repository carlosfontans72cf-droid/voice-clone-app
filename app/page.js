"use client";

import { useEffect, useRef, useState } from "react";

const LANGUAGES = ["Español", "English", "Português", "Français", "Italiano", "Deutsch"];
const DEFAULT_BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const MAX_CHARS = 5000;

export default function Home() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND);
  const [refFile, setRefFile] = useState(null);
  const [refPreview, setRefPreview] = useState("");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("Español");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const clientRef = useRef({ url: "", client: null });

  // Recordar la última URL del backend (Colab genera una nueva en cada sesión).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("backendUrl");
      if (saved) setBackendUrl(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("backendUrl", backendUrl);
    } catch {}
  }, [backendUrl]);

  // Vista previa del audio de referencia, liberando la URL anterior.
  useEffect(() => {
    if (!refFile) {
      setRefPreview("");
      return;
    }
    const url = URL.createObjectURL(refFile);
    setRefPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [refFile]);

  const cleanUrl = backendUrl.trim().replace(/\/+$/, "");
  const canSubmit = cleanUrl && refFile && text.trim() && consent && !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResultUrl("");

    if (!/^https?:\/\//.test(cleanUrl)) {
      setError("La URL del backend debe empezar con https:// (la copiás del notebook de Colab).");
      return;
    }

    setLoading(true);
    try {
      // El cliente de Gradio corre en el navegador y llama directo al backend,
      // así Vercel no corta por tiempo de ejecución.
      if (clientRef.current.url !== cleanUrl) {
        const { Client } = await import("@gradio/client");
        clientRef.current = { url: cleanUrl, client: await Client.connect(cleanUrl) };
      }
      const result = await clientRef.current.client.predict("/clone", {
        ref_audio: refFile,
        text,
        language,
      });
      const audio = result.data?.[0];
      if (!audio?.url) throw new Error("El servidor no devolvió audio.");
      setResultUrl(audio.url);
    } catch (err) {
      clientRef.current = { url: "", client: null };
      const msg = err?.message || String(err);
      setError(
        /fetch|network|Could not resolve|connect/i.test(msg)
          ? "No se pudo conectar al backend. Revisá que el notebook de Colab siga corriendo y que la URL sea la actual."
          : `Error: ${msg}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Clonador de voz</h1>
      <p className="sub">
        Subí un audio de referencia, escribí el texto y generá el audio con esa voz.
      </p>

      <form onSubmit={handleSubmit}>
        <label>
          URL del backend
          <span className="hint">
            La que aparece al ejecutar el notebook de Colab (termina en .gradio.live)
          </span>
          <input
            type="url"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            placeholder="https://xxxxxxxx.gradio.live"
          />
        </label>

        <label>
          Audio de referencia
          <span className="hint">10 a 30 segundos, una sola voz, sin ruido de fondo</span>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setRefFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {refPreview && <audio controls src={refPreview} />}

        <label>
          Texto
          <textarea
            rows={7}
            value={text}
            maxLength={MAX_CHARS}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribí o pegá el texto acá..."
          />
          <span className="hint">
            {text.length} / {MAX_CHARS} caracteres
          </span>
        </label>

        <label>
          Idioma
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          Confirmo que la voz es mía o que tengo permiso de la persona para usarla.
        </label>

        <button type="submit" disabled={!canSubmit}>
          {loading ? "Generando... (puede tardar)" : "Generar audio"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {resultUrl && (
        <section className="result">
          <h2>Resultado</h2>
          <audio controls src={resultUrl} />
          <a href={resultUrl} download="voz-generada.wav" target="_blank" rel="noreferrer">
            Descargar WAV
          </a>
        </section>
      )}
    </main>
  );
}
