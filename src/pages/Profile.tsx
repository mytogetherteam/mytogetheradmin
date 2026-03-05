import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"
import { userService } from "@/services/userService"
import { Utensils, Leaf, DollarSign, Flame } from "lucide-react"

const profileFormSchema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters."),
    email: z.string().email("Invalid email address."),
    isVegetarian: z.boolean(),
    isHalal: z.boolean(),
    pricePreference: z.enum(["LOW", "MEDIUM", "HIGH"]),
    spicinessPreference: z.enum(["MILD", "MEDIUM", "HOT"]),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function Profile() {
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            fullName: "",
            email: "",
            isVegetarian: false,
            isHalal: false,
            pricePreference: "MEDIUM",
            spicinessPreference: "MEDIUM",
        },
    })

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        setLoading(true)
        try {
            const profile = await userService.getProfile()
            form.reset({
                fullName: profile.fullName,
                email: profile.email,
                isVegetarian: profile.isVegetarian,
                isHalal: profile.isHalal,
                pricePreference: profile.pricePreference,
                spicinessPreference: profile.spicinessPreference,
            })
        } catch (error) {
            console.error("Failed to load profile:", error)
            toast.error("Failed to load profile", {
                description: "Unable to fetch profile data"
            })
        } finally {
            setLoading(false)
        }
    }

    async function onSubmit(data: ProfileFormValues) {
        setSubmitting(true)
        try {
            await userService.updateProfile(data)
            toast.success("Profile updated successfully!")
        } catch (error) {
            console.error("Failed to update profile:", error)
            toast.error("Failed to update profile", {
                description: "An error occurred"
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-24">
                    <Loader />
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Personal Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Your basic account information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="john@example.com" {...field} disabled />
                                            </FormControl>
                                            <FormDescription>Email cannot be changed</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Food Preferences */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Food Preferences</CardTitle>
                                <CardDescription>Customize your dining preferences</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="isVegetarian"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Leaf className="h-5 w-5 text-green-600" />
                                                    <FormLabel className="text-base">Vegetarian</FormLabel>
                                                </div>
                                                <FormDescription>
                                                    Show vegetarian-friendly options
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="isHalal"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Utensils className="h-5 w-5 text-blue-600" />
                                                    <FormLabel className="text-base">Halal</FormLabel>
                                                </div>
                                                <FormDescription>
                                                    Show halal-certified options
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <Separator />

                                <FormField
                                    control={form.control}
                                    name="pricePreference"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <DollarSign className="h-5 w-5" />
                                                Price Preference
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select price range" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="LOW">Low ($)</SelectItem>
                                                    <SelectItem value="MEDIUM">Medium ($$)</SelectItem>
                                                    <SelectItem value="HIGH">High ($$$)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Your preferred price range for dining
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="spicinessPreference"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Flame className="h-5 w-5 text-orange-600" />
                                                Spiciness Preference
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select spiciness level" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="MILD">Mild 🌶️</SelectItem>
                                                    <SelectItem value="MEDIUM">Medium 🌶️🌶️</SelectItem>
                                                    <SelectItem value="HOT">Hot 🌶️🌶️🌶️</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Your preferred spice level
                                            </FormDescription>
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
    )
}
