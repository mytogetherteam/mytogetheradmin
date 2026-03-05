import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";
import { User, Mail, Shield, Hash } from "lucide-react";

const adminProfileFormSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters."),
    fullName: z.string().min(2, "Full name must be at least 2 characters."),
    email: z.string().email("Invalid email address."),
});

type AdminProfileFormValues = z.infer<typeof adminProfileFormSchema>;

export default function AdminProfile() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [adminData, setAdminData] = useState<any>(null);

    const form = useForm<AdminProfileFormValues>({
        resolver: zodResolver(adminProfileFormSchema),
        defaultValues: {
            username: "",
            fullName: "",
            email: "",
        },
    });

    useEffect(() => {
        loadAdminProfile();
    }, []);

    const loadAdminProfile = async () => {
        setLoading(true);
        try {
            const userData = authService.getUserData();
            if (userData) {
                setAdminData(userData);
                form.reset({
                    username: userData.username,
                    fullName: userData.fullName,
                    email: userData.email,
                });
            }
        } catch (error) {
            console.error("Failed to load admin profile:", error);
            toast.error("Failed to load profile", {
                description: "Unable to fetch profile data"
            });
        } finally {
            setLoading(false);
        }
    };

    async function onSubmit(data: AdminProfileFormValues) {
        setSubmitting(true);
        try {
            // Update admin profile via service
            await userService.updateAdminProfile({
                username: data.username,
                fullName: data.fullName,
            });

            // Update local storage with new data
            const updatedUserData = {
                ...adminData,
                username: data.username,
                fullName: data.fullName,
            };
            localStorage.setItem('user_data', JSON.stringify(updatedUserData));
            setAdminData(updatedUserData);

            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast.error("Failed to update profile", {
                description: "An error occurred while updating your profile"
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Admin Profile</h2>
                <p className="text-muted-foreground">Manage your admin account information and settings.</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-24">
                    <Loader />
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Account Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Information</CardTitle>
                                <CardDescription>Your admin account details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Admin ID - Display Only */}
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Hash className="h-4 w-4" />
                                        Admin ID
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono text-sm">
                                            {adminData?.id}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Role - Display Only */}
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Role
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Badge className="font-normal">
                                            {adminData?.role || "ADMIN"}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Email - Readonly */}
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
                                                    placeholder="admin@example.com"
                                                    {...field}
                                                    readOnly
                                                    className="bg-muted cursor-not-allowed"
                                                />
                                            </FormControl>
                                            <FormDescription>Email address cannot be changed</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Username - Editable */}
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Username
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="admin_user" {...field} />
                                            </FormControl>
                                            <FormDescription>Your unique username</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Full Name - Editable */}
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Full Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormDescription>Your full name as displayed in the system</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button type="submit" size="lg" disabled={submitting}>
                                {submitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    );
}
