import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Intervexa — AI mock interviews",
    short_name: "Intervexa",
    description: "Practice like it's the real interview. An adaptive AI interviewer that remembers your weak spots.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fcf8ff",
    theme_color: "#5b4bd6",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New interview", url: "/interview/new" },
      { name: "Practice drill", url: "/practice" },
    ],
  };
}
