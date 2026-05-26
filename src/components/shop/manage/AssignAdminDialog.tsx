import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { ShopActionDialogState } from '@/hooks/shops/profiles/manageShopRestaurantTypes';
import { Eye, EyeOff, Trash2, Shield, User, Loader2, Users } from 'lucide-react';
import { assignAdminSchema, type AssignAdminFormValues, AdminRoleName } from '@/schemas/assignadmin.schema';
import { useQuery } from '@tanstack/react-query';
import { ShopService } from '@/services/shopService';
import { useUnassignAdminMutation } from '@/hooks/shops/profiles/useUnassignAdminMutation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type AssignAdminDialogProps = {
  state: ShopActionDialogState;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    variables: {
      id: number;
      email: string;
      username?: string;
      password: string;
      name?: string;
      role: AdminRoleName;
    },
    options?: {
      onSuccess?: () => void;
    }
  ) => void;
};

export function AssignAdminDialog({
  state,
  isLoading,
  onOpenChange,
  onConfirm,
}: AssignAdminDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminToUnassign, setAdminToUnassign] = useState<{ id: number; name: string } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AssignAdminFormValues>({
    resolver: zodResolver(assignAdminSchema),
    defaultValues: {
      role: AdminRoleName.ShopAdmin,
      email: '',
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Query to fetch shop details (including current admins)
  const { data: shopDetail, isLoading: isShopLoading } = useQuery({
    queryKey: ['admin-shop-profile', state.id],
    queryFn: () => ShopService.getAdminShopProfileById(state.id),
    enabled: state.open && state.id > 0,
  });

  // Unassign admin mutation
  const unassignMutation = useUnassignAdminMutation(state.id);

  // Reset fields on modal open
  useEffect(() => {
    if (state.open) {
      reset({
        role: AdminRoleName.ShopAdmin,
        email: '',
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [state.open, reset]);

  const onSubmitForm = (values: AssignAdminFormValues) => {
    onConfirm(
      {
        id: state.id,
        email: values.email.trim(),
        username: values.username?.trim() || undefined,
        password: values.password,
        name: values.name?.trim() || undefined,
        role: values.role,
      },
      {
        onSuccess: () => {
          reset({
            role: AdminRoleName.ShopAdmin,
            email: '',
            name: '',
            username: '',
            password: '',
            confirmPassword: '',
          });
          setShowPassword(false);
          setShowConfirmPassword(false);
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl">Manage Shop Admins</DialogTitle>
          <DialogDescription>
            Manage administrators and accounts for <strong>{state.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="assign" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger
              value="assign"
              className="rounded-lg transition-all py-2 font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Assign Admin
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="rounded-lg transition-all py-2 font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Admin List ({shopDetail?.adminShops?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
              {/* Role Choice */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-role">Role</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="admin-role" className="w-full h-10 rounded-xl">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value={AdminRoleName.ShopAdmin} className="rounded-lg">Shop Admin</SelectItem>
                        <SelectItem value={AdminRoleName.OperationAdmin} className="rounded-lg">Operation Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Email address <span className="text-destructive">*</span></Label>
                <Input
                  id="admin-email"
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
                  <Label htmlFor="admin-name">Full Name (Optional)</Label>
                  <Input
                    id="admin-name"
                    placeholder="e.g. John Doe"
                    {...register('name')}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-username">Username (Optional)</Label>
                  <Input
                    id="admin-username"
                    placeholder="johndoe"
                    {...register('username')}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="admin-password">Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
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

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="admin-confirm-password">Confirm Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="admin-confirm-password"
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
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="rounded-xl h-10 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-xl h-10 px-4"
                >
                  {isLoading ? 'Assigning...' : 'Assign Admin'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="list" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
            {isShopLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading administrators...</p>
              </div>
            ) : !shopDetail?.adminShops || shopDetail.adminShops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-2xl bg-muted/20 px-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary mb-3">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground">No Administrators Assigned</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                  This shop doesn't have any dedicated administrators yet. Assign one in the first tab.
                </p>
              </div>
            ) : (
              <div className="max-h-[340px] overflow-y-auto space-y-2.5 pr-1">
                {shopDetail.adminShops.map((assignment) => {
                  const admin = assignment.admin;
                  if (!admin) return null;
                  const isUnassigning =
                    unassignMutation.isPending &&
                    unassignMutation.variables === admin.id;

                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3.5 border rounded-2xl hover:border-primary/30 transition-all bg-card shadow-sm hover:shadow-md group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-secondary/80 rounded-xl text-secondary-foreground">
                          {admin.email.includes('op') || admin.username?.includes('op') ? (
                            <Shield className="h-4.5 w-4.5 text-primary" />
                          ) : (
                            <User className="h-4.5 w-4.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-foreground">
                            {admin.name || admin.username || 'Shop Administrator'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {admin.email}
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-9 w-9 transition-colors"
                        disabled={isUnassigning}
                        onClick={() =>
                          setAdminToUnassign({
                            id: admin.id,
                            name: admin.name || admin.username || admin.email,
                          })
                        }
                      >
                        {isUnassigning ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl h-10 px-4"
              >
                Close
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <AlertDialog
        open={adminToUnassign !== null}
        onOpenChange={(open) => !open && setAdminToUnassign(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Unassign Administrator</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to unassign <strong>{adminToUnassign?.name}</strong> from <strong>{state.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 flex items-center gap-2">
            <AlertDialogCancel className="rounded-xl h-10 mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (adminToUnassign) {
                  unassignMutation.mutate(adminToUnassign.id);
                  setAdminToUnassign(null);
                }
              }}
            >
              Unassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
