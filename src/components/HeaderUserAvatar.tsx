import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdminProfileQuery } from "@/hooks/profile/useAdminProfile";
import { resolveMediaUrl } from "@/lib/resolveMediaUrl";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";

const DEFAULT_PROFILE_AVATAR = "/profile.png";

type HeaderUserAvatarProps = {
  className?: string;
};

export function HeaderUserAvatar({ className }: HeaderUserAvatarProps) {
  const userData = authService.getUserData();
  const { data: profile } = useAdminProfileQuery();

  const avatarSrc = useMemo(
    () => resolveMediaUrl(profile?.profileUrl) ?? DEFAULT_PROFILE_AVATAR,
    [profile?.profileUrl],
  );

  const displayName =
    profile?.fullName ?? userData?.fullName ?? "Admin User";

  return (
    <Avatar className={cn("h-8 w-8 rounded-full", className)}>
      <AvatarImage
        src={avatarSrc}
        alt={displayName}
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
  );
}
