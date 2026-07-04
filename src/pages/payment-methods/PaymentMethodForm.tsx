import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  paymentMethodSchema,
  type PaymentMethodFormValues,
} from "@/schemas/payment-method.schema";
import {
  usePaymentMethod,
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
} from "@/hooks/payment-methods/usePaymentMethod";

export default function PaymentMethodForm() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const { data: paymentData, isPending: loading } = usePaymentMethod(
    isEditMode && id ? parseInt(id) : 0,
  );
  const { mutateAsync: createPaymentMethod, isPending: isCreating } =
    useCreatePaymentMethodMutation();
  const { mutateAsync: updatePaymentMethod, isPending: isUpdating } =
    useUpdatePaymentMethodMutation();

  const submitting = isCreating || isUpdating;

  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconRemoved, setIconRemoved] = useState(false);

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(
      paymentMethodSchema,
    ) as Resolver<PaymentMethodFormValues>,
    defaultValues: {
      name: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (isEditMode && paymentData) {
      form.reset({
        name: paymentData.name || "",
        isActive: paymentData.isActive ?? true,
      });
      setTimeout(() => {
        setIconPreview(paymentData.iconUrl ?? null);
        setIconFile(null);
        setIconRemoved(false);
      }, 0);
    }
  }, [isEditMode, paymentData, form]);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setIconFile(file);
    if (!file) {
      if (!iconPreview?.startsWith("http")) setIconPreview(null);
      return;
    }
    setIconRemoved(false);
    const reader = new FileReader();
    reader.onloadend = () => setIconPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearIcon = () => {
    setIconPreview(null);
    setIconFile(null);
    setIconRemoved(true);
  };

  const onSubmit = async (data: PaymentMethodFormValues) => {
    const formData = new FormData();
    formData.append("name", data.name || "");
    formData.append("isActive", String(data.isActive));

    if (iconFile) {
      formData.append("icon", iconFile);
    } else if (isEditMode && iconRemoved) {
      formData.append("removeIcon", "true");
    }

    if (isEditMode && id) {
      await updatePaymentMethod({ id: parseInt(id, 10), data: formData });
    } else {
      await createPaymentMethod(formData);
    }
  };

  if (isEditMode && loading) {
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
          <CardTitle>
            {isEditMode ? "Edit Payment Method" : "Create Payment Method"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the details of an existing payment method."
              : "Define a new payment method available for shops."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. KBZ Pay" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        <img
                          src={
                            iconPreview?.startsWith("data:")
                              ? iconPreview
                              : (iconPreview ?? "")
                          }
                          alt="Icon Preview"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-1 right-1 z-20">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6 rounded-full shadow-sm"
                            onClick={(e) => {
                              e.preventDefault();
                              clearIcon();
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground text-center">
                          Upload Icon
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Payment Method Icon</p>
                    <p className="text-xs text-muted-foreground">
                      Upload a recognizable icon or logo for this payment
                      method. Recommended size: 256x256.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active Status
                        </FormLabel>
                        <CardDescription>
                          If inactive, this payment method will not be available
                          for selection.
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/payment-methods/manage")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
