import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Loader2, RotateCcw, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { handleApiError } from "@/lib/error-utils";
import { resolveMediaUrl } from "@/lib/resolveMediaUrl";
import {
  socialReactionService,
  type SocialReaction,
} from "@/services/socialReactionService";

const FILE_PX = 256;
const MIN_PX = 128;
const MAX_PX = 1024;
const DISPLAY_PX = 36;

/**
 * The app draws this row on top of a video. Seven pictures, each 36px.
 * Anything that is not a square gets rejected before it can reach the phone.
 */
export default function SocialReactionsPage() {
  const [rows, setRows] = useState<SocialReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await socialReactionService.list();
      setRows([...data].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
    } catch (error) {
      handleApiError(error, "Could not load reactions");
    } finally {
      setLoading(false);
    }
  };

  const replaceRow = (next: SocialReaction) => {
    setRows((current) =>
      current
        .map((row) => (row.id === next.id ? next : row))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const visible = rows.filter((row) => row.isActive);

  return (
    <div className="container mx-auto max-w-5xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Social reactions</h1>
        <p className="mt-2 text-muted-foreground">
          These are the pictures that pop up when someone holds the like button on a post.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>How it looks on the video</CardTitle>
          <CardDescription>
            The phone draws each picture at {DISPLAY_PX}×{DISPLAY_PX} pixels inside this row.
            There is room for 7. An 8th one would run off the side of the screen, so slots cannot be added or deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-2">
            {visible.length === 0 ? (
              <span className="px-3 text-sm text-white/70">Turn on at least one reaction.</span>
            ) : (
              visible.map((row) => (
                <ReactionFace key={row.id} row={row} px={DISPLAY_PX} />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-950">
            <ImageIcon className="h-5 w-5" />
            Picture rules
          </CardTitle>
          <CardDescription className="text-amber-900">
            Follow these or the round button will crop the picture and the row will look broken.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-950">
          <p>Upload a square PNG, {FILE_PX}×{FILE_PX} pixels. PNG with a transparent background sits cleanly on the video.</p>
          <p>JPG and WebP are allowed only when they are also square. A photo with a white box around it will show that box.</p>
          <p>Keep the face in the center, with about 16 pixels of empty space around it, so the circle does not cut off the edges.</p>
          <p>Smallest accepted size is {MIN_PX}×{MIN_PX}. Largest is {MAX_PX}×{MAX_PX}. The server saves every picture as a {FILE_PX}×{FILE_PX} PNG.</p>
          <p>The file must be 1 MB or smaller. Do not put words in the picture. The name is the label below.</p>
          <p>Leave a slot without a picture and the phone shows its emoji instead. That is the safe fallback.</p>
          <p>Keep at least one reaction turned on. The like button needs one.</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {rows.map((row) => (
          <ReactionEditor key={row.id} row={row} onSaved={replaceRow} />
        ))}
      </div>
    </div>
  );
}

function ReactionFace({ row, px }: { row: SocialReaction; px: number }) {
  const src = resolveMediaUrl(row.imageUrl);
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full"
      style={{ width: px, height: px }}
      title={row.labelEn}
    >
      {src ? (
        <img src={src} alt={row.labelEn} className="h-full w-full object-contain" />
      ) : (
        <span style={{ fontSize: px * 0.72, lineHeight: 1 }}>{row.emoji}</span>
      )}
    </div>
  );
}

function ReactionEditor({
  row,
  onSaved,
}: {
  row: SocialReaction;
  onSaved: (next: SocialReaction) => void;
}) {
  const [labelEn, setLabelEn] = useState(row.labelEn);
  const [labelMm, setLabelMm] = useState(row.labelMm ?? "");
  const [labelTh, setLabelTh] = useState(row.labelTh ?? "");
  const [sortOrder, setSortOrder] = useState(String(row.sortOrder));
  const [isActive, setIsActive] = useState(row.isActive);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    setLabelEn(row.labelEn);
    setLabelMm(row.labelMm ?? "");
    setLabelTh(row.labelTh ?? "");
    setSortOrder(String(row.sortOrder));
    setIsActive(row.isActive);
    setFile(null);
    setPreview(null);
    setClearImage(false);
    setFileError(null);
  }, [row]);

  const onFile = async (next: File | null) => {
    setFileError(null);
    setClearImage(false);
    if (!next) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(next.type)) {
      setFileError("Use a PNG, JPG, or WebP.");
      return;
    }
    if (next.size > 1024 * 1024) {
      setFileError("The file must be 1 MB or smaller.");
      return;
    }
    const dims = await readSize(next);
    if (!dims) {
      setFileError("Could not read that picture.");
      return;
    }
    const ratio = dims.width / dims.height;
    if (dims.width < MIN_PX || dims.height < MIN_PX || dims.width > MAX_PX || dims.height > MAX_PX) {
      setFileError(
        `This picture is ${dims.width}×${dims.height}. Use a square between ${MIN_PX} and ${MAX_PX} pixels. ${FILE_PX}×${FILE_PX} is the size to upload.`,
      );
      return;
    }
    if (ratio < 0.95 || ratio > 1.05) {
      setFileError(
        `This picture is ${dims.width}×${dims.height}. It must be square, ${FILE_PX}×${FILE_PX}. A wide or tall picture is clipped by the round button.`,
      );
      return;
    }
    setFile(next);
    setPreview(URL.createObjectURL(next));
  };

  const save = async (active = isActive, dropImage = clearImage) => {
    const order = Number(sortOrder);
    if (!labelEn.trim()) {
      if (active !== row.isActive) setIsActive(row.isActive);
      toast.error("English label is required.");
      return false;
    }
    if (!Number.isInteger(order) || order < 1 || order > 7) {
      if (active !== row.isActive) setIsActive(row.isActive);
      toast.error("Order must be a number from 1 to 7.");
      return false;
    }
    if (fileError && !dropImage) return false;
    setSaving(true);
    try {
      const saved = await socialReactionService.update(row.id, {
        labelEn: labelEn.trim(),
        labelMm: labelMm.trim(),
        labelTh: labelTh.trim(),
        isActive: active,
        sortOrder: order,
        image: dropImage ? null : file,
        clearImage: dropImage,
      });
      onSaved(saved);
      toast.success(`${saved.labelEn} saved.`);
      return true;
    } catch (error) {
      setIsActive(row.isActive);
      handleApiError(error, "Could not save this reaction");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const currentSrc = clearImage ? null : preview ?? resolveMediaUrl(row.imageUrl);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-neutral-900">
            {currentSrc ? (
              <img src={currentSrc} alt="" className="h-9 w-9 object-contain" />
            ) : (
              <span className="text-2xl">{row.emoji}</span>
            )}
          </div>
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smile className="h-4 w-4" />
              {row.labelEn}
            </CardTitle>
            <CardDescription>Slot {row.key}. Shown at {DISPLAY_PX}×{DISPLAY_PX} px on the phone.</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`active-${row.id}`}>On</Label>
          <Switch
            id={`active-${row.id}`}
            checked={isActive}
            disabled={saving}
            onCheckedChange={(checked) => {
              if (fileError) return;
              setIsActive(checked);
              void save(checked);
            }}
          />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>English name</Label>
          <Input value={labelEn} maxLength={40} onChange={(e) => setLabelEn(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Myanmar name</Label>
          <Input value={labelMm} maxLength={40} onChange={(e) => setLabelMm(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Thai name</Label>
          <Input value={labelTh} maxLength={40} onChange={(e) => setLabelTh(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Order (1–7)</Label>
          <Input
            value={sortOrder}
            inputMode="numeric"
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label>Replace picture ({FILE_PX}×{FILE_PX} square PNG)</Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
          {fileError ? <p className="text-sm text-red-600">{fileError}</p> : null}
        </div>
        <div className="flex items-end gap-2">
          <Button type="button" onClick={() => void save()} disabled={saving || Boolean(fileError)}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving || (!row.imageUrl && !file)}
            onClick={() => {
              setFile(null);
              setPreview(null);
              setClearImage(true);
              setFileError(null);
              void save(isActive, true);
            }}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Use emoji
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function readSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}
