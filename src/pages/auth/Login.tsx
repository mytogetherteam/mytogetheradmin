import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
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
        <div className="flex min-h-screen w-full bg-background">
            {/* Left side: branding & background */}
            <div className="hidden w-1/2 flex-col justify-between border-r bg-zinc-900 p-10 text-white lg:flex relative overflow-hidden">
                {/* Full image showing clearly */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: 'url(/login-bg.png)' }}
                />

                {/* Overlay fade only at the bottom */}
                <div className="absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

                <div className="relative z-20 flex items-center gap-3">
                    <img src="/logo-mytogether.jpg" alt="myTogether Logo" className="h-10 w-10 rounded-xl shadow-lg object-cover" />
                    <span className="text-xl font-bold tracking-tight text-white">MyTogether Admin</span>
                </div>

                <div className="relative z-20 mt-auto">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <blockquote className="space-y-2">
                        <p className="text-3xl font-semibold leading-tight text-white drop-shadow-md">
                            Easy Connect - MyTogether App!
                        </p>
                        <footer className="text-sm font-medium text-zinc-300">Secure Access Portal</footer>
                    </blockquote>
                </div>
            </div>

            {/* Right side: login form */}
            <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
                <div className="w-full max-w-sm space-y-6">
                    <div className="flex flex-col items-center justify-center space-y-3 lg:hidden mb-6">
                        <img src="/logo-mytogether.jpg" alt="myTogether Logo" className="h-16 w-16 rounded-2xl shadow-sm object-cover" />
                        <h1 className="text-2xl font-bold tracking-tight">MyTogether Admin</h1>
                    </div>

                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to securely sign in to your account
                        </p>
                    </div>

                    <div className="grid gap-6">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="usernameOrEmail">Username or Email</Label>
                                <Input
                                    id="usernameOrEmail"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="name@example.com"
                                    disabled={isPending}
                                    aria-invalid={Boolean(form.formState.errors.usernameOrEmail)}
                                    className="h-11 bg-background"
                                    {...form.register("usernameOrEmail")}
                                />
                                {form.formState.errors.usernameOrEmail && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.usernameOrEmail.message}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        disabled={isPending}
                                        aria-invalid={Boolean(form.formState.errors.password)}
                                        className="h-11 pr-10 bg-background"
                                        {...form.register("password")}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
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
                                {form.formState.errors.password && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.password.message}
                                    </p>
                                )}
                            </div>
                            <Button type="submit" className="w-full h-11 text-base font-medium mt-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:opacity-90 transition-opacity border-0" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign in"
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
