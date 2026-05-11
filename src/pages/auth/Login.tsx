import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { adminLoginFormSchema, type AdminLoginFormValues } from "@/schemas/admin-login.schema"
import { useAdminLoginMutation } from "@/hooks/auth/useAdminLogin"

export default function Login() {

    const [showPassword, setShowPassword] = useState(false)
    const { mutateAsync: mutate, isPending } = useAdminLoginMutation()

    const form = useForm<AdminLoginFormValues>({
        resolver: zodResolver(adminLoginFormSchema),
        defaultValues: {
            usernameOrEmail: "",
            password: "",
        },
    })

    const onSubmit = async (values: AdminLoginFormValues) => {
        await mutate({
            usernameOrEmail: values.usernameOrEmail,
            password: values.password,
        })
    }

    return (
        <div className="flex h-screen w-full items-center justify-center px-4">
            <Card className="mx-auto max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your credentials to access the admin panel
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="usernameOrEmail">Username or Email</Label>
                            <Input
                                id="usernameOrEmail"
                                type="text"
                                autoComplete="username"
                                placeholder="john_doe or john@example.com"
                                disabled={isPending}
                                aria-invalid={Boolean(form.formState.errors.usernameOrEmail)}
                                {...form.register("usernameOrEmail")}
                            />
                            {form.formState.errors.usernameOrEmail ? (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.usernameOrEmail.message}
                                </p>
                            ) : null}
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="********"
                                    disabled={isPending}
                                    aria-invalid={Boolean(form.formState.errors.password)}
                                    {...form.register("password")}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isPending}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="sr-only">
                                        {showPassword ? "Hide password" : "Show password"}
                                    </span>
                                </Button>
                            </div>
                            {form.formState.errors.password ? (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.password.message}
                                </p>
                            ) : null}
                        </div>
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                "Login"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
