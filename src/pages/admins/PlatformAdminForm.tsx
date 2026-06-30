import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AdminsService,
  CreatePlatformAdminPayload,
  PlatformAdminRole,
  UpdatePlatformAdminPayload,
} from "@/services/adminsService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, UserCog } from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

export default function PlatformAdminForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [roleName, setRoleName] = useState<PlatformAdminRole>("OperationAdmin");
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    name: "",
    password: "",
  });

  useEffect(() => {
    if (!isEditMode) return;

    const fetchAdmin = async () => {
      try {
        const data = await AdminsService.getAdminById(Number(id));
        if (!data) {
          toast.error("Admin not found");
          navigate("/admins/manage");
          return;
        }
        setFormData({
          email: data.email,
          username: data.username ?? "",
          name: data.name ?? "",
          password: "",
        });
        setRoleName(data.role.name);
      } catch (error) {
        handleApiError(error, "Failed to load admin details");
        navigate("/admins/manage");
      } finally {
        setFetching(false);
      }
    };

    fetchAdmin();
  }, [id, isEditMode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        const payload: UpdatePlatformAdminPayload = {
          email: formData.email.trim(),
          username: formData.username.trim() || null,
          name: formData.name.trim() || null,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        await AdminsService.updateAdmin(Number(id), payload);
        toast.success("Admin updated successfully");
      } else {
        if (!formData.password.trim()) {
          toast.error("Password is required");
          return;
        }
        const payload: CreatePlatformAdminPayload = {
          email: formData.email.trim(),
          username: formData.username.trim() || undefined,
          name: formData.name.trim() || undefined,
          password: formData.password.trim(),
          roleName,
        };
        await AdminsService.createAdmin(payload);
        toast.success("Admin created successfully");
      }
      navigate("/admins/manage");
    } catch (error) {
      handleApiError(
        error,
        isEditMode ? "Failed to update admin" : "Failed to create admin",
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <Button
        variant="ghost"
        className="gap-2 -ml-2"
        onClick={() => navigate("/admins/manage")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Admin Management
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            {isEditMode ? "Edit Platform Admin" : "Create Platform Admin"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update account details. Leave password blank to keep the current one."
              : "Create a Super Admin or Operation Admin account for the platform panel."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
              />
            </div>

            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={roleName}
                  onValueChange={(value) =>
                    setRoleName(value as PlatformAdminRole)
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OperationAdmin">
                      Operation Admin
                    </SelectItem>
                    <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {isEditMode && (
              <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
                Role:{" "}
                <span className="font-medium">
                  {roleName === "SuperAdmin"
                    ? "Super Admin"
                    : "Operation Admin"}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {isEditMode ? "(optional)" : "*"}
              </Label>
              <Input
                id="password"
                type="password"
                minLength={6}
                required={!isEditMode}
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder={
                  isEditMode ? "Leave blank to keep current password" : ""
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admins/manage")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEditMode ? "Save changes" : "Create admin"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
