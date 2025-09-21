import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type SoundEventKey =
  | "add_to_cart"
  | "like_toggle"
  | "checkout_open"
  | "checkout_success"
  | "submit_review"
  | "open_reviews";

type SoundConfig = {
  enabled: boolean;
  url: string; // public URL or relative / path
  volume: number; // 0..1
};

type SoundSettings = Record<SoundEventKey, SoundConfig>;

type SoundContextValue = {
  settings: SoundSettings;
  isLoaded: boolean;
  play: (eventName: SoundEventKey) => void;
  refresh: () => Promise<void>;
};

const DEFAULT_SETTINGS: SoundSettings = {
  add_to_cart: { enabled: true, url: "/sounds/click.mp3", volume: 0.6 },
  like_toggle: { enabled: true, url: "/sounds/like.mp3", volume: 0.7 },
  checkout_open: { enabled: true, url: "/sounds/open.mp3", volume: 0.5 },
  checkout_success: { enabled: true, url: "/sounds/success.mp3", volume: 0.8 },
  submit_review: { enabled: true, url: "/sounds/success.mp3", volume: 0.8 },
  open_reviews: { enabled: true, url: "/sounds/open.mp3", volume: 0.5 },
};

const SoundContext = createContext<SoundContextValue | null>(null);

function createAudioPool(src: string, volume: number, poolSize = 3): HTMLAudioElement[] {
  return Array.from({ length: poolSize }).map(() => {
    const el = new Audio(src);
    el.preload = "auto";
    el.volume = volume;
    return el;
  });
}

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Pools per event for seamless overlapping
  const poolsRef = useRef<Record<string, { pool: HTMLAudioElement[]; idx: number }>>({});

  const buildPools = useCallback((cfg: SoundSettings) => {
    const next: Record<string, { pool: HTMLAudioElement[]; idx: number }> = {};
    (Object.keys(cfg) as SoundEventKey[]).forEach((key) => {
      const s = cfg[key];
      if (s.enabled && s.url) {
        next[key] = { pool: createAudioPool(s.url, s.volume), idx: 0 };
      }
    });
    poolsRef.current = next;
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      // Try load from DB; fall back to localStorage; final fallback to defaults
      const { data, error } = await supabase
        .from("app_sounds")
        .select("event_key, enabled, url, volume")
        .order("updated_at", { ascending: false });

      let cfg: SoundSettings = DEFAULT_SETTINGS;
      if (!error && Array.isArray(data) && data.length > 0) {
        const merged: Partial<SoundSettings> = { ...DEFAULT_SETTINGS };
        data.forEach((row: any) => {
          const key = row.event_key as SoundEventKey;
          if (key && merged[key]) {
            merged[key] = {
              enabled: row.enabled ?? DEFAULT_SETTINGS[key].enabled,
              url: row.url ?? DEFAULT_SETTINGS[key].url,
              volume: typeof row.volume === "number" ? Math.min(1, Math.max(0, row.volume)) : DEFAULT_SETTINGS[key].volume,
            } as SoundConfig;
          }
        });
        cfg = merged as SoundSettings;
      } else {
        try {
          const raw = localStorage.getItem("isa_sound_settings");
          if (raw) {
            const parsed = JSON.parse(raw);
            cfg = { ...DEFAULT_SETTINGS, ...parsed };
          }
        } catch {}
      }

      setSettings(cfg);
      buildPools(cfg);
    } finally {
      setIsLoaded(true);
    }
  }, [buildPools]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    try {
      localStorage.setItem("isa_sound_settings", JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const play = useCallback((eventName: SoundEventKey) => {
    const cfg = settings[eventName];
    if (!cfg?.enabled) return;
    const bucket = poolsRef.current[eventName];
    if (!bucket) return;
    try {
      bucket.idx = (bucket.idx + 1) % bucket.pool.length;
      const audio = bucket.pool[bucket.idx];
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {}
  }, [settings]);

  const refresh = useCallback(async () => {
    setIsLoaded(false);
    await loadSettings();
  }, [loadSettings]);

  const value = useMemo<SoundContextValue>(() => ({ settings, isLoaded, play, refresh }), [settings, isLoaded, play, refresh]);

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
};

export function useSoundContext() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSoundContext must be used within SoundProvider");
  return ctx;
}

export function useUISound(eventName: SoundEventKey) {
  const { play } = useSoundContext();
  return useCallback(() => play(eventName), [play, eventName]);
}


