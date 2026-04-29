"use client";

import { useEffect } from "react";
import { initVocabDevTools } from "@/lib/dev-tools";

/**
 * VocabDevToolsProvider
 *
 * Injects `window.__vocabDevTools` into the browser console for
 * developers to inspect the current user's word-learning metadata.
 *
 * Safe to include in all environments; silently no-ops in production.
 */
export default function VocabDevToolsProvider() {
  useEffect(() => {
    initVocabDevTools();
  }, []);

  return null;
}
