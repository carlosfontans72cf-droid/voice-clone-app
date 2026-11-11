"use client";

import { useRef, useState } from "react";

const LANGUAGES = ["Español", "English", "Português", "Français", "Italiano", "Deutsch"];
const SPACE_ID = process.env.NEXT_PUBLIC_SPACE_ID;
const MAX_CHARS = 5000;

export default function Home() {
  const [refFile, setRefFile] = useState(null);
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("Español");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const clientRef = useRef(null);

  const canSubmit = refFile && text.trim() && consent && !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResultUrl("");

    if (!SPACE_ID) {
      setError("Falta configurar NEXT_PUBLIC_SPACE_ID (ver README).");
      return;
    }

    setLoading(true);
    try {
      // Import dinámico: el cliente de Gradio corre solo en el navegador.
      // La llamada va directo del navegador al Space, así Vercel no corta por tiempo.
      if (!clientRef.current) {
        const { Client } = await import("@gradio/client");
        clientRef.current = await Client.connect(SPACE_ID);
      }
      const result = await clientRef.current.predict("/clone", {
        ref_audio: refFile,
        text,
        language,
      });
      const audio = result.data?.[0];
      if (!audio?.url) throw new Error("El servidor no devolvió audio.");
      setResultUrl(audio.url);
    } catch (err) {
      const msg = err?.message || String(err);
      setError(
        msg.includes("sleeping") || msg.includes("starting")
          ? "El Space está despertando. Esperá un minuto y probá de nuevo."
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
          Audio de referencia
          <span className="hint">10 a 30 segundos, una sola voz, sin ruido de fondo</span>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setRefFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {refFile && <audio controls src={URL.createObjectURL(refFile)} />}

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
