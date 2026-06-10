import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, EyeOff } from 'lucide-react';
import {
  updateShopAdminSchema,
  type UpdateShopAdminFormValues,
} from '@/schemas/updateshopadmin.schema';
import { useUpdateShopAdminMutation } from '@/hooks/shops/profiles/useUpdateShopAdminMutation';

export type EditableShopAdmin = {
  id: number;
  name: string | null;
  username: string | null;
  email: string;
};

type EditShopAdminDialogProps = {
  shopId: number;
  admin: EditableShopAdmin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Reusable dialog to edit an assigned shop administrator's account details
 * (email, name, username, optional new password). Used from both the shop
 * detail page and the Manage Shop Admins dialog.
 */
export function EditShopAdminDialog({
  shopId,
  admin,
  open,
  onOpenChange,
}: EditShopAdminDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateMutation = useUpdateShopAdminMutation(shopId);

  // Sync the form with the selected admin (react-hook-form re-fills when this
  // reference changes — no setState-in-effect needed).
  const formValues = useMemo<UpdateShopAdminFormValues>(
    () => ({
      email: admin?.email ?? '',
      name: admin?.name ?? '',
      username: admin?.username ?? '',
      password: '',
      confirmPassword: '',
    }),
    [admin]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateShopAdminFormValues>({
    resolver: zodResolver(updateShopAdminSchema),
    values: formValues,
  });

  // Reset password-visibility toggles when the dialog closes.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
    onOpenChange(next);
  };

  const onSubmit = (values: UpdateShopAdminFormValues) => {
    if (!admin) return;
    updateMutation.mutate(
      {
        adminId: admin.id,
        email: values.email.trim(),
        username: values.username?.trim() || undefined,
        name: values.name?.trim() || undefined,
        password: values.password?.trim() ? values.password : undefined,
      },
      {
        onSuccess: () => handleOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl">Edit Administrator</DialogTitle>
          <DialogDescription>
            Update the account details for this administrator. Leave the password
            blank to keep it unchanged.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-admin-email">
              Email address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-admin-email"
              type="email"
              placeholder="admin@example.com"
              {...register('email')}
              className={`h-10 rounded-xl ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Name & Username */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-admin-name">Full Name (Optional)</Label>
              <Input
                id="edit-admin-name"
                placeholder="e.g. John Doe"
                {...register('name')}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-admin-username">Username (Optional)</Label>
              <Input
                id="edit-admin-username"
                placeholder="johndoe"
                {...register('username')}
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-admin-password">New Password</Label>
              <div className="relative">
                <Input
                  id="edit-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Leave blank to keep current"
                  {...register('password')}
                  className={`pr-10 h-10 rounded-xl ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-admin-confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="edit-admin-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className={`pr-10 h-10 rounded-xl ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={updateMutation.isPending}
              className="rounded-xl h-10 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-xl h-10 px-4"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
