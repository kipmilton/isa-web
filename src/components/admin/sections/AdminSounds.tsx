import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Upload, Volume2, Save, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSoundContext } from "@/contexts/SoundContext";

type EventRow = {
  key: string;
  label: string;
  hint: string;
};

const EVENTS: EventRow[] = [
  { key: "add_to_cart", label: "Add to Cart", hint: "Plays after item added" },
  { key: "like_toggle", label: "Like / Unlike", hint: "Plays when toggling" },
  { key: "checkout_open", label: "Checkout Open", hint: "Plays when checkout opens" },
  { key: "checkout_success", label: "Checkout Success", hint: "Plays after payment success" },
  { key: "submit_review", label: "Submit Review", hint: "Plays after review submit" },
  { key: "open_reviews", label: "Open Reviews", hint: "Plays when opening reviews modal" },
];

const BUCKET = "app-sounds"; // Create this bucket in Supabase Storage

export default function AdminSounds() {
  const { toast } = useToast();
  const { settings, refresh } = useSoundContext();
  const [rows, setRows] = useState(() => EVENTS.map(e => ({
    key: e.key,
    enabled: settings[e.key as keyof typeof settings]?.enabled ?? true,
    url: settings[e.key as keyof typeof settings]?.url ?? "",
    volume: settings[e.key as keyof typeof settings]?.volume ?? 0.7,
  })) as any[]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(EVENTS.map(e => ({
      key: e.key,
      enabled: settings[e.key as keyof typeof settings]?.enabled ?? true,
      url: settings[e.key as keyof typeof settings]?.url ?? "",
      volume: settings[e.key as keyof typeof settings]?.volume ?? 0.7,
    })) as any[]);
  }, [settings]);

  const handleToggle = (key: string, enabled: boolean) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, enabled } : r));
  };

  const handleVolume = (key: string, volume: number[]) => {
    const v = Math.min(1, Math.max(0, (volume?.[0] ?? 0.7)));
    setRows(prev => prev.map(r => r.key === key ? { ...r, volume: v } : r));
  };

  const uploadFile = async (key: string, file: File) => {
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${key}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: false, cacheControl: '3600' });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      setRows(prev => prev.map(r => r.key === key ? { ...r, url: publicUrl } : r));
      toast({ title: "Uploaded", description: "Sound uploaded successfully" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message || "Try again", variant: "destructive" });
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Upsert into app_sounds table
      const upserts = rows.map(r => ({ event_key: r.key, enabled: r.enabled, url: r.url, volume: r.volume }));
      const { error } = await (supabase as any).from('app_sounds').upsert(upserts, { onConflict: 'event_key' });
      if (error) throw error;
      await refresh();
      toast({ title: "Saved", description: "Sound settings updated" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message || "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const playPreview = (url: string, volume: number) => {
    try {
      const a = new Audio(url);
      a.volume = volume;
      a.play().catch(() => {});
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Sounds</h1>
        <p className="text-gray-600 mt-2">Enable, disable, and upload sounds for key user actions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {EVENTS.map((e) => {
            const row = rows.find(r => r.key === e.key) || { enabled: false, url: '', volume: 0.7 };
            return (
              <div key={e.key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{e.label}</div>
                    <div className="text-sm text-gray-500">{e.hint}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={!!row.enabled} onCheckedChange={(v) => handleToggle(e.key, !!v)} />
                    <span className="text-sm text-gray-600">Enabled</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <Label className="text-sm">Sound URL</Label>
                    <Input value={row.url} onChange={(ev) => setRows(prev => prev.map(r => r.key === e.key ? { ...r, url: ev.target.value } : r))} placeholder="https://... or /sounds/click.mp3" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-gray-500" />
                    <Slider value={[row.volume]} onValueChange={(v) => handleVolume(e.key, v)} min={0} max={1} step={0.05} className="w-full" />
                    <span className="w-10 text-sm text-gray-600">{Math.round(row.volume * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <Input type="file" accept="audio/*" className="hidden" onChange={(ev) => {
                        const f = ev.target.files?.[0];
                        if (f) uploadFile(e.key, f);
                      }} />
                      <Button type="button" variant="outline">
                        <Upload className="w-4 h-4 mr-2" /> Upload
                      </Button>
                    </label>
                    <Button type="button" variant="ghost" onClick={() => playPreview(row.url, row.volume)}>
                      <Play className="w-4 h-4 mr-2" /> Preview
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex justify-end">
            <Button onClick={saveAll} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


