import { createContext, useContext } from "react";

export const PODCASTS = [
  {
    id: "english",
    language: "English",
    flag: "🇺🇸",
    title: "U.S. History & Citizenship Study Guide",
    src: "/podcast-english.m4a",
    accent: "cyan",
  },
  {
    id: "spanish",
    language: "Español",
    flag: "🇪🇸",
    title: "Historia de Estados Unidos y Guía de Estudio",
    src: "/podcast-spanish.m4a",
    accent: "violet",
  },
  {
    id: "surviving-2026-interview-en",
    language: "English",
    flag: "🇺🇸",
    title: "Surviving the 2026 U.S. Citizenship Interview",
    src: "/podcast-surviving-2026-interview-en.m4a",
    accent: "cyan",
  },
  {
    id: "aprobar-entrevista-ciudadania-es",
    language: "Español",
    flag: "🇺🇸",
    title: "Cómo aprobar la entrevista de ciudadanía estadounidense",
    src: "/podcast-aprobar-entrevista-ciudadania-es.m4a",
    accent: "violet",
  },
];

export const PodcastContext = createContext(null);

export function formatPodcastTime(value) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function usePodcast() {
  const value = useContext(PodcastContext);
  if (!value) throw new Error("usePodcast must be used inside PodcastProvider");
  return value;
}
