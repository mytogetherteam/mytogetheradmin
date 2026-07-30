import { useId, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { config } from '@/config/config';

type ShopSlugQrProps = {
  slug: string;
  size?: number;
  /** Show Copy link + Download PNG under the QR (modal use). */
  showActions?: boolean;
};

function buildEmenuUrl(slug: string): string | null {
  const base = config.eMenuUrl;
  const trimmed = slug.trim();
  if (!base || !trimmed) return null;
  return `${base}/${trimmed}`;
}

function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string) {
  const href = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}

async function copyCanvasPng(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png'),
  );
  if (!blob) throw new Error('Failed to create PNG');
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob }),
  ]);
}

/** QR for `${VITE_EMENU_URL}/{slug}`. Hidden when base URL or slug is missing. */
export function ShopSlugQr({
  slug,
  size = 56,
  showActions = false,
}: ShopSlugQrProps) {
  const canvasId = useId();
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const url = buildEmenuUrl(slug);
  if (!url) return null;

  const safeName = slug.trim().replace(/[^a-z0-9-_]+/gi, '-') || 'slug';

  const getCanvas = () =>
    canvasWrapRef.current?.querySelector('canvas') ?? null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleCopyImage = async () => {
    const canvas = getCanvas();
    if (!canvas) return;
    try {
      await copyCanvasPng(canvas);
      toast.success('QR image copied');
    } catch {
      toast.error('Could not copy QR image');
    }
  };

  const handleDownload = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    downloadCanvasPng(canvas, `${safeName}-qr.png`);
    toast.success('QR downloaded');
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={canvasWrapRef}
        className="inline-block rounded-sm bg-white p-0.5 shadow-sm ring-1 ring-border/60"
        title={url}
      >
        <QRCodeCanvas
          id={canvasId}
          value={url}
          size={size}
          level="M"
          marginSize={1}
        />
      </div>

      {showActions ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => void handleCopyLink()}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy link
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => void handleCopyImage()}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy QR
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      ) : null}
    </div>
  );
}
