"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API (not in lib.dom for all TS versions).
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Browser speech-to-text. Keeps listening across Chrome's automatic silence timeouts until
 * `stop()` is called, and tracks total speaking time for pace analysis.
 */
export function useSpeechRecognition(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const wantRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const totalMsRef = useRef(0);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    setSupported(Boolean(getCtor()));
    return () => {
      wantRef.current = false;
      recRef.current?.abort();
    };
  }, []);

  const closeSegment = () => {
    if (startedAtRef.current !== null) {
      totalMsRef.current += Date.now() - startedAtRef.current;
      startedAtRef.current = null;
    }
  };

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || wantRef.current) return;
    setError(null);
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    rec.onresult = (e) => {
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) onFinalRef.current(result[0].transcript.trim());
        else partial += result[0].transcript;
      }
      setInterim(partial);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone access was blocked. Allow it in your browser, or type your answer.");
        wantRef.current = false;
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setError(`Voice input error: ${e.error}`);
      }
    };
    rec.onend = () => {
      setInterim("");
      if (wantRef.current) {
        try {
          rec.start(); // Chrome ends sessions after silence; keep going until the user stops.
          return;
        } catch {
          /* fall through */
        }
      }
      closeSegment();
      setListening(false);
    };
    recRef.current = rec;
    wantRef.current = true;
    startedAtRef.current = Date.now();
    rec.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
    closeSegment();
    setListening(false);
  }, []);

  /** Returns total seconds spoken since the last call, and resets the counter. */
  const takeSpeakingSeconds = useCallback(() => {
    closeSegment();
    if (wantRef.current) startedAtRef.current = Date.now();
    const secs = totalMsRef.current / 1000;
    totalMsRef.current = 0;
    return secs;
  }, []);

  return { supported, listening, interim, error, start, stop, takeSpeakingSeconds };
}
