import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeCheck,
  Camera,
  Loader2,
  Mail,
  Save,
  Shield,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { handleApiError } from "@/lib/error-utils";
import { resolveMediaUrl } from "@/lib/resolveMediaUrl";
import {
  useAdminProfileQuery,
  useUpdateAdminProfileMutation,
} from "@/hooks/profile/useAdminProfile";
import {
  adminProfileFormSchema,
  type AdminProfileFormValues,
} from "@/schemas/admin-profile.schema";

const DEFAULT_PROFILE_AVATAR = "/profile.png";

function roleLabel(role?: string) {
  if (!role) return "Admin";
  return role.replace(/([A-Z])/g, " $1").trim();
}

export default function Profile() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    data: profile,
    isPending: isLoadingProfile,
    isError,
    error,
  } = useAdminProfileQuery();
  const { mutate: updateProfile, isPending: isUpdatingProfile } =
    useUpdateAdminProfileMutation();

  const form = useForm<AdminProfileFormValues>({
    resolver: zodResolver(adminProfileFormSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
    },
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      fullName: profile.fullName,
      username: profile.username ?? "",
      email: profile.email,
    });
  }, [profile, form]);

  useEffect(() => {
    if (isError) {
      handleApiError(error, "Failed to load profile");
    }
  }, [isError, error]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const avatarSrc = useMemo(() => {
    if (photoPreview) return photoPreview;
    return resolveMediaUrl(profile?.profileUrl) ?? DEFAULT_PROFILE_AVATAR;
  }, [photoPreview, profile?.profileUrl]);

  const onPhotoSelected = (file?: File) => {
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhotoSelection = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  function onSubmit(values: AdminProfileFormValues) {
    updateProfile(
      {
        fullName: values.fullName,
        username: values.username,
        photoFile,
      },
      {
        onSuccess: () => {
          clearPhotoSelection();
        },
      },
    );
  }

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-muted/40">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-background shadow-md">
                <AvatarImage
                  src={avatarSrc}
                  alt={profile?.fullName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted p-0">
                  <img
                    src={DEFAULT_PROFILE_AVATAR}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  onPhotoSelected(event.target.files?.[0])
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {profile?.fullName || "Admin Profile"}
                </h1>
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  {roleLabel(profile?.role)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage your account details used across the admin panel.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {profile?.isActive ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
                    <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                Account Details
              </CardTitle>
              <CardDescription>
                Update how your name appears in the admin panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="admin_user" {...field} />
                    </FormControl>
                    <FormDescription>
                      Used for login and display when name is empty.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        disabled
                        className="bg-muted"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Email cannot be changed here.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
                <CardDescription>Read-only account metadata.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium">{roleLabel(profile?.role)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <span>{profile?.isActive ? "Active" : "Inactive"}</span>
                </div>
                {profile?.updatedAt ? (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Last updated</span>
                      <span>
                        {new Date(profile.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={isUpdatingProfile}
                className="min-w-[160px]"
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
