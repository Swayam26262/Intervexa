"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeechMetrics } from "@/lib/interview/types";

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

const PAUSE_SEC = 3;

/**
 * Browser speech-to-text. Keeps listening across Chrome's silence timeouts until `stop()`,
 * and tracks speaking time and long pauses (> 3s between phrases) for coaching.
 */
export function useSpeechRecognition(onFinal: (text: string) => void, lang = "en-IN") {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const wantRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const totalMsRef = useRef(0);
  const lastSpeechRef = useRef<number | null>(null);
  const pausesRef = useRef({ pauses: 0, longest: 0 });
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

  const markSpeech = () => {
    const now = Date.now();
    if (lastSpeechRef.current !== null) {
      const gap = (now - lastSpeechRef.current) / 1000;
      if (gap > PAUSE_SEC) {
        pausesRef.current.pauses += 1;
        pausesRef.current.longest = Math.max(pausesRef.current.longest, gap);
      }
    }
    lastSpeechRef.current = now;
  };

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || wantRef.current) return;
    setError(null);
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onresult = (e) => {
      markSpeech();
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
    lastSpeechRef.current = Date.now();
    rec.start();
    setListening(true);
  }, [lang]);

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
    closeSegment();
    lastSpeechRef.current = null;
    setListening(false);
  }, []);

  /** Speaking seconds and pause metrics since the last call; resets the counters. */
  const takeMetrics = useCallback((): { seconds: number; speech: SpeechMetrics } => {
    closeSegment();
    if (wantRef.current) startedAtRef.current = Date.now();
    const seconds = totalMsRef.current / 1000;
    const speech = { pauses: pausesRef.current.pauses, longestPauseSec: Math.round(pausesRef.current.longest * 10) / 10 };
    totalMsRef.current = 0;
    pausesRef.current = { pauses: 0, longest: 0 };
    return { seconds, speech };
  }, []);

  return { supported, listening, interim, error, start, stop, takeMetrics };
}
