"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Records microphone audio for server-side transcription (Safari/Firefox, or higher accuracy).
 * Returns the recording and its duration when stopped.
 */
export function useRecorder() {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedRef = useRef(0);
  const resolveRef = useRef<((r: { blob: Blob; seconds: number } | null) => void) | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "MediaRecorder" in window && Boolean(navigator.mediaDevices?.getUserMedia));
    return () => recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m));
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        resolveRef.current?.({ blob, seconds: (Date.now() - startedRef.current) / 1000 });
        resolveRef.current = null;
      };
      recorderRef.current = recorder;
      startedRef.current = Date.now();
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access was blocked. Allow it in your browser, or type your answer.");
    }
  }, []);

  const stop = useCallback(() => {
    return new Promise<{ blob: Blob; seconds: number } | null>((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") return resolve(null);
      resolveRef.current = resolve;
      recorder.stop();
      setRecording(false);
    });
  }, []);

  return { supported, recording, error, start, stop };
}
