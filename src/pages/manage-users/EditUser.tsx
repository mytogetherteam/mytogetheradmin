import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AsyncSelectField } from "@/components/common/AsyncSelectField";
import { ArrowLeft, Eye, EyeOff, Loader2, Save } from "lucide-react";
import {
  useManageUser,
  useManageUserRoles,
  useUpdateManageUserMutation,
} from "@/hooks/manage-users/useManageUsers";
import {
  editManageUserSchema,
  manageUserAccountTypeSchema,
  type EditManageUserFormValues,
} from "@/schemas/manage-user.schema";
import { authService } from "@/services/authService";
import { manageUsersService } from "@/services/manageUsersService";
import { getEarlyBirdStatusLabel } from "./manageUsersHelpers";

export default function EditUser() {
  const navigate = useNavigate();
  const { accountType: accountTypeParam, id: idParam } = useParams();
  const accountTypeResult =
    manageUserAccountTypeSchema.safeParse(accountTypeParam);
  const accountType = accountTypeResult.success
    ? accountTypeResult.data
    : undefined;
  const userId =
    idParam && !Number.isNaN(parseInt(idParam, 10))
      ? parseInt(idParam, 10)
      : undefined;

  const { data: user, isPending: loadingUser } = useManageUser(
    accountType,
    userId,
  );
  const { data: roles = [], isPending: loadingRoles } = useManageUserRoles();
  const { mutateAsync: updateUser, isPending: submitting } =
    useUpdateManageUserMutation();
  const currentAdmin = authService.getUserData();
  const isCurrentAdmin =
    accountType === "admin" && userId === currentAdmin?.id;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialRole = useMemo(() => {
    if (!user) return undefined;
    const matched =
      roles.find((role) => role.id === user.roleId) ??
      roles.find((role) => role.name === user.role);
    if (matched) {
      return { value: String(matched.id), label: matched.name };
    }
    if (user.roleId && user.role) {
      return { value: String(user.roleId), label: user.role };
    }
    return undefined;
  }, [roles, user]);

  const fetchRoles = useCallback(
    async (page: number, pageSize: number, searchTerm?: string) => {
      const allRoles =
        roles.length > 0 ? roles : await manageUsersService.getRoles();
      const query = searchTerm?.trim().toLowerCase() ?? "";
      const filtered = query
        ? allRoles.filter((role) => role.name.toLowerCase().includes(query))
        : allRoles;
      const start = (page - 1) * pageSize;
      const slice = filtered.slice(start, start + pageSize);
      return {
        data: slice.map((role) => ({
          value: String(role.id),
          label: role.name,
        })),
        totalCount: filtered.length,
      };
    },
    [roles],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditManageUserFormValues>({
    resolver: zodResolver(editManageUserSchema) as Resolver<EditManageUserFormValues>,
    defaultValues: {
      name: "",
      username: "",
      email: "",
      phone: "",
      roleId: null,
      roleName: null,
      isActive: true,
      password: "",
      confirmPassword: "",
      pin: "",
      confirmPin: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    if (accountType === "admin" && roles.length === 0) return;

    const matchedRole =
      roles.find((role) => role.id === user.roleId) ??
      roles.find((role) => role.name === user.role);

    reset({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      roleId: matchedRole?.id ?? user.roleId ?? null,
      roleName: matchedRole?.name ?? user.role ?? null,
      isActive: user.isActive,
      password: "",
      confirmPassword: "",
      pin: "",
      confirmPin: "",
    });
  }, [accountType, reset, roles, user]);

  const onSubmit = async (values: EditManageUserFormValues) => {
    if (!accountType || !userId) return;
    await updateUser({
      accountType,
      id: userId,
      data: {
        ...values,
        isActive: isCurrentAdmin ? (user?.isActive ?? true) : values.isActive,
      },
    });
  };

  if (!accountType || !userId) {
    return (
      <div className="container mx-auto py-10 max-w-3xl">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Invalid user route.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingUser || loadingRoles) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="text-muted-foreground mt-1">
            Update {accountType === "admin" ? "admin" : "user"} account
            information.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/users/manage")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="border-solid">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            Change basic profile, role, and active status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...register("username")} />
                {errors.username && (
                  <p className="text-xs text-red-500">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {accountType === "user" && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...register("phone")} />
                  {errors.phone && (
                    <p className="text-xs text-red-500">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              )}

              {accountType === "admin" && (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Controller
                    name="roleId"
                    control={control}
                    render={({ field }) => (
                      <AsyncSelectField
                        label="Role"
                        hideLabel
                        fetchFunction={fetchRoles}
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(value) => {
                          const roleId = value ? Number(value) : null;
                          const matchedRole = roles.find(
                            (role) => role.id === roleId,
                          );
                          field.onChange(roleId);
                          setValue(
                            "roleName",
                            matchedRole?.name ?? null,
                          );
                        }}
                        initialValue={initialRole}
                        placeholder="Search role..."
                        emptyTriggerLabel="Select role"
                        showSearch={false}
                        pageSize={50}
                      />
                    )}
                  />
                  {errors.roleId && (
                    <p className="text-xs text-red-500">
                      {errors.roleId.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {accountType === "admin" && (
              <div className="space-y-4 rounded-lg border p-4">
                <div>
                  <Label className="text-base">Change Password</Label>
                  <p className="text-sm text-muted-foreground">
                    Leave blank to keep the current password.
                  </p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="pr-10"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="pr-10"
                        {...register("confirmPassword")}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {accountType === "user" && (
              <div className="space-y-4 rounded-lg border p-4">
                <div>
                  <Label className="text-base">Change PIN</Label>
                  <p className="text-sm text-muted-foreground">
                    6-digit numeric PIN used to sign in. Leave blank to keep the
                    current PIN.
                  </p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pin">New PIN</Label>
                    <Controller
                      name="pin"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="pin"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="••••••"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            )
                          }
                        />
                      )}
                    />
                    {errors.pin && (
                      <p className="text-xs text-red-500">
                        {errors.pin.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPin">Confirm PIN</Label>
                    <Controller
                      name="confirmPin"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="confirmPin"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="••••••"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            )
                          }
                        />
                      )}
                    />
                    {errors.confirmPin && (
                      <p className="text-xs text-red-500">
                        {errors.confirmPin.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {accountType === "user" && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Early Bird</Label>
                  <p className="text-sm text-muted-foreground">
                    Whether this user can use Early Bird shop coupons.
                  </p>
                </div>
                <Badge variant={user?.isEarlyBird ? "default" : "secondary"}>
                  {getEarlyBirdStatusLabel(user?.isEarlyBird)}
                </Badge>
              </div>
            )}

            {isCurrentAdmin ? (
              <div className="rounded-lg border p-4">
                <Label>Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  You cannot deactivate your own admin account.
                </p>
              </div>
            ) : (
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label>Active Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Disabled accounts cannot be treated as active in admin
                        lists.
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/users/manage")}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
