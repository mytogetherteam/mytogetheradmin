import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useUpdateShopSlugMutation } from '@/hooks/shops/profiles/useUpdateShopSlugMutation';
import { ShopSlugQr } from '@/components/shop/ShopSlugQr';

export type EditShopSlugDialogState = {
  open: boolean;
  id: number;
  name: string;
  slug: string;
};

type EditShopSlugDialogProps = {
  state: EditShopSlugDialogState;
  onOpenChange: (open: boolean) => void;
};

export function EditShopSlugDialog({
  state,
  onOpenChange,
}: EditShopSlugDialogProps) {
  const [slug, setSlug] = useState(state.slug);
  const updateMutation = useUpdateShopSlugMutation();

  useEffect(() => {
    if (state.open) {
      setSlug(state.slug);
    }
  }, [state.open, state.slug]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSlug('');
    }
    onOpenChange(open);
  };

  const handleSave = () => {
    updateMutation.mutate(
      {
        id: state.id,
        slug: slug.trim(),
        shopName: state.name,
      },
      {
        onSuccess: () => handleOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={state.open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Edit slug</DialogTitle>
          <DialogDescription>
            Set a unique URL slug for {state.name}. Spaces become hyphens
            (e.g. &quot;Hispaw house&quot; → hispaw-house).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {slug.trim() ? (
            <div className="flex justify-center">
              <ShopSlugQr slug={slug.trim()} size={120} showActions />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="shop-slug-name">Name</Label>
            <Input
              id="shop-slug-name"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. Hispaw house"
              maxLength={100}
              disabled={updateMutation.isPending}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
