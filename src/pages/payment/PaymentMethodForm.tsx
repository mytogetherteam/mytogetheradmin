import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, X } from "lucide-react";
import { PaymentService } from "@/services/paymentService";
import { PaymentMethodDTO } from "@/services/shopService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

interface PaymentMethodFormValues {
    code: string;
    name: string;
    nameMm: string;
    nameTh: string;
    displayOrder: number;
    active: boolean;
}

const paymentMethodSchema = z.object({
    code: z.string().min(1, "Code is required"),
    name: z.string().min(1, "Name is required"),
    nameMm: z.string().default(""),
    nameTh: z.string().default(""),
    displayOrder: z.coerce.number().int().min(1, "Display Order must be at least 1").default(1),
    active: z.boolean().default(true),
});

export default function PaymentMethodForm() {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [iconFile, setIconFile] = useState<File | null>(null);

    const form = useForm<PaymentMethodFormValues>({
        resolver: zodResolver(paymentMethodSchema) as Resolver<PaymentMethodFormValues>,
        defaultValues: {
            code: "",
            name: "",
            nameMm: "",
            nameTh: "",
            displayOrder: 1,
            active: true,
        },
    });

    const loadPaymentMethod = useCallback(async (paymentId: number) => {
        setLoading(true);
        try {
            const data = await PaymentService.getPaymentMethodById(paymentId);
            form.reset({
                code: data.code,
                name: (data as PaymentMethodDTO & { nameEn?: string }).nameEn || data.name || "",
                nameMm: data.nameMm || "",
                nameTh: data.nameTh || "",
                displayOrder: data.displayOrder || 1,
                active: data.active ?? true,
            });
            if (data.iconUrl) {
                setIconPreview(data.iconUrl);
            }
        } catch (error) {
            handleApiError(error, "Failed to load payment method details.");
            navigate("/payment/methods");
        } finally {
            setLoading(false);
        }
    }, [form, navigate]);

    useEffect(() => {
        if (isEditMode && id) {
            loadPaymentMethod(parseInt(id, 10));
        }
    }, [id, isEditMode, loadPaymentMethod]);

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setIconFile(file);
        if (!file) {
            if (!iconPreview?.startsWith('http')) setIconPreview(null);
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setIconPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const clearIcon = () => {
        setIconPreview(null);
        setIconFile(null);
    };

    const onSubmit = async (data: PaymentMethodFormValues) => {
        setSubmitting(true);
        try {
            const paymentData = {
                code: data.code || "",
                nameEn: data.name || "",
                nameMm: data.nameMm || "",
                nameTh: data.nameTh || "",
                displayOrder: data.displayOrder,
                active: data.active,
            };

            const formData = new FormData();
            formData.append("data", new Blob([JSON.stringify(paymentData)], { type: "application/json" }));

            if (iconFile) {
                formData.append("icon", iconFile);
            }

            if (isEditMode && id) {
                await PaymentService.updatePaymentMethod(parseInt(id, 10), formData);
                toast.success("Payment method updated successfully!");
            } else {
                await PaymentService.createPaymentMethod(formData);
                toast.success("Payment method created successfully!");
            }
            navigate("/payment/methods");
        } catch (error) {
            handleApiError(error, isEditMode ? "Failed to update payment method." : "Failed to create payment method.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle>{isEditMode ? "Edit Payment Method" : "Create Payment Method"}</CardTitle>
                    <CardDescription>
                        {isEditMode
                            ? "Update the details of an existing payment method."
                            : "Define a new payment method available for shops."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. KPAY" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="displayOrder"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Display Order</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === "" || /^\d+$/.test(val)) field.onChange(val === "" ? "" : parseInt(val));
                                                    }}
                                                    onBlur={(e) => {
                                                        const val = e.target.value;
                                                        const num = val === "" ? NaN : parseInt(val, 10);
                                                        if (!val || isNaN(num) || num < 1) {
                                                            field.onChange(1);
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-sm font-medium">Names (Multi-language)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name (English)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. KBZ Pay" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nameMm"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name (Myanmar)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="KBZ Pay (မြန်မာ)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nameTh"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name (Thai)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="KBZ Pay (Thai)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-sm font-medium">Icon</h3>
                                <div className="flex items-start gap-4">
                                    <div className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors w-32 h-32 relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            onChange={handleIconChange}
                                        />
                                        {iconPreview ? (
                                            <>
                                                <img src={iconPreview?.startsWith('data:') ? iconPreview : (iconPreview ?? '')} alt="Icon Preview" className="w-full h-full object-contain" />
                                                <div className="absolute top-1 right-1 z-20">
                                                    <Button type="button" variant="destructive" size="icon" className="h-6 w-6 rounded-full shadow-sm" onClick={(e) => { e.preventDefault(); clearIcon(); }}>
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                <span className="text-xs text-muted-foreground text-center">Upload Icon</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium">Payment Method Icon</p>
                                        <p className="text-xs text-muted-foreground">Upload a recognizable icon or logo for this payment method. Recommended size: 256x256.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <FormField
                                    control={form.control}
                                    name="active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Active Status</FormLabel>
                                                <CardDescription>
                                                    If inactive, this payment method will not be available for selection.
                                                </CardDescription>
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
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => navigate("/payment/methods")} disabled={submitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditMode ? "Update" : "Create"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
