import { useEffect, useRef, useState } from "react";
import { type Resolver, Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Loader2, Trash2 } from "lucide-react";

import {
  useCreatePlatformPaymentAccountMutation,
  useDeletePlatformPaymentAccountMutation,
  usePlatformPaymentAccount,
  useUpdatePlatformPaymentAccountMutation,
} from "@/hooks/platform-payment-accounts/usePlatformPaymentAccount";
import { usePaymentMethods } from "@/hooks/payment-methods/usePaymentMethod";
import {
  platformPaymentAccountSchema,
  type PlatformPaymentAccountFormValues,
} from "@/schemas/platform-payment-account.schema";
import type { PaymentMethodDTO } from "@/services/shopService";
import type { PlatformPaymentAccountListItem } from "@/services/platformPaymentAccountService";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { FormValidationAlert } from "@/components/common/FormValidationAlert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const BLANK_ACCOUNT: PlatformPaymentAccountFormValues = {
  paymentMethodId: 0,
  accountName: "",
  accountNumber: "",
  note: "",
  isActive: true,
};

function mapAccountToFormValues(
  account: PlatformPaymentAccountListItem,
): PlatformPaymentAccountFormValues {
  return {
    paymentMethodId: account.paymentMethodId,
    accountName: account.accountName,
    accountNumber: account.accountNumber,
    note: account.note ?? "",
    isActive: account.isActive,
  };
}

/**
 * Loads the account and the channel list first, then mounts the form so its
 * defaultValues ARE the API response — nothing depends on effect ordering.
 */
export default function CreatePlatformPaymentAccount() {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");
  const id = idParam ? parseInt(idParam, 10) : 0;
  const isEditMode = !!id;

  const { data: account, isPending: loadingAccount } =
    usePlatformPaymentAccount(id);
  // This hook is 0-based: it sends page + 1 to the API. Every channel is fetched
  // (inactive ones included) so an existing selection always resolves to a label.
  const { data: methodsData, isPending: loadingMethods } = usePaymentMethods({
    page: 0,
    size: 200,
  });

  if ((isEditMode && loadingAccount) || loadingMethods) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PlatformPaymentAccountForm
      key={isEditMode ? `account-${id}` : "new-account"}
      account={isEditMode ? account : undefined}
      accountId={id}
      methods={methodsData?.content ?? []}
    />
  );
}

interface PlatformPaymentAccountFormProps {
  account?: PlatformPaymentAccountListItem;
  accountId: number;
  methods: PaymentMethodDTO[];
}

function PlatformPaymentAccountForm({
  account,
  accountId,
  methods,
}: PlatformPaymentAccountFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!accountId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const qrPreviewRef = useRef<string | null>(null);
  /** True once the admin clears an existing QR without picking a new one. */
  const [qrRemoved, setQrRemoved] = useState(false);

  const { mutateAsync: createAccount, isPending: isCreating } =
    useCreatePlatformPaymentAccountMutation();
  const { mutateAsync: updateAccount, isPending: isUpdating } =
    useUpdatePlatformPaymentAccountMutation();
  const { mutateAsync: deleteAccount, isPending: isDeleting } =
    useDeletePlatformPaymentAccountMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PlatformPaymentAccountFormValues>({
    resolver: zodResolver(
      platformPaymentAccountSchema,
    ) as Resolver<PlatformPaymentAccountFormValues>,
    defaultValues: account ? mapAccountToFormValues(account) : BLANK_ACCOUNT,
  });

  // Object URLs survive navigation in an SPA, so release the last one on unmount.
  useEffect(() => {
    return () => {
      if (qrPreviewRef.current) URL.revokeObjectURL(qrPreviewRef.current);
    };
  }, []);

  const storedQrUrl = qrRemoved ? null : (account?.qrUrl ?? null);
  const shownQr = qrPreview ?? storedQrUrl;

  const handlePickQr = (file: File | undefined) => {
    if (!file) return;
    setQrFile(file);
    setQrRemoved(false);
    setQrPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      const next = URL.createObjectURL(file);
      qrPreviewRef.current = next;
      return next;
    });
  };

  const handleClearQr = () => {
    if (qrPreview) URL.revokeObjectURL(qrPreview);
    qrPreviewRef.current = null;
    setQrPreview(null);
    setQrFile(null);
    // Only tell the API to wipe the stored image when there was one to begin with.
    setQrRemoved(!!account?.qrUrl);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (values: PlatformPaymentAccountFormValues) => {
    setShowValidationAlert(false);
    const payload = {
      paymentMethodId: values.paymentMethodId,
      accountName: values.accountName.trim(),
      accountNumber: values.accountNumber.trim(),
      note: values.note?.trim() || undefined,
      isActive: values.isActive,
      qr: qrFile,
      removeQr: qrRemoved,
    };

    if (isEditMode) {
      await updateAccount({ id: accountId, payload });
    } else {
      await createAccount(payload);
    }
  };

  const handleDelete = async () => {
    await deleteAccount(accountId);
    navigate("/platform-payment-accounts/manage");
  };

  const submitting = isCreating || isUpdating;
  const errorMessages = Object.values(errors)
    .map((error) => error?.message)
    .filter((message): message is string => !!message);

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/platform-payment-accounts/manage")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to accounts
      </Button>

      <form
        onSubmit={handleSubmit(onSubmit, () => {
          setShowValidationAlert(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        })}
        className="space-y-6"
      >
        <FormValidationAlert
          visible={showValidationAlert}
          messages={errorMessages}
        />

        <Card>
          <CardHeader>
            <CardTitle>
              {isEditMode ? "Edit Payment Account" : "Add Payment Account"}
            </CardTitle>
            <CardDescription>
              One of your own accounts. Shop admins see these when they buy a
              plan and transfer the money into them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethodId">Channel</Label>
              <Controller
                name="paymentMethodId"
                control={control}
                render={({ field }) => {
                  const selected = methods.find(
                    (method) => method.id === field.value,
                  );
                  return (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(next) => field.onChange(Number(next))}
                    >
                      <SelectTrigger id="paymentMethodId" hideClear>
                        <SelectValue placeholder="Select a payment channel">
                          {selected?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {methods.map((method) => (
                          <SelectItem key={method.id} value={String(method.id)}>
                            {method.name}
                            {method.isActive ? "" : " — inactive"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {errors.paymentMethodId ? (
                <p className="text-xs text-destructive">
                  {errors.paymentMethodId.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account name</Label>
                <Controller
                  name="accountName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="accountName"
                      placeholder="MyTogether Co., Ltd."
                      {...field}
                    />
                  )}
                />
                {errors.accountName ? (
                  <p className="text-xs text-destructive">
                    {errors.accountName.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account number</Label>
                <Controller
                  name="accountNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="accountNumber"
                      placeholder="1234-5678-9012"
                      className="font-mono"
                      {...field}
                    />
                  )}
                />
                {errors.accountNumber ? (
                  <p className="text-xs text-destructive">
                    {errors.accountNumber.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Transfer note</Label>
              <Controller
                name="note"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="note"
                    rows={2}
                    placeholder="Put your shop name in the transfer note"
                    {...field}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Shown to the shop right next to the account number.
              </p>
            </div>

            <div className="space-y-2">
              <Label>QR image</Label>
              <div className="flex items-start gap-4">
                {shownQr ? (
                  <img
                    src={shownQr}
                    alt="Account QR"
                    className="h-28 w-28 rounded-md border object-contain p-1"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                    No QR
                  </div>
                )}
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePickQr(e.target.files?.[0])}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {shownQr ? "Replace" : "Upload"}
                    </Button>
                    {shownQr ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearQr}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional, max 5 MB. Shops scan this instead of typing the
                    number.
                  </p>
                </div>
              </div>
            </div>

            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label>Active</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Inactive accounts stay in the payment history but shops can
                    no longer pick them.
                  </p>
                </div>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          {isEditMode ? (
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => setDeleteDialogOpen(true)}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/platform-payment-accounts/manage")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isEditMode ? "Save changes" : "Add account"}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete payment account"
        description="If shops have already paid into this account, deletion is blocked — set it inactive instead."
        confirmText="Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
