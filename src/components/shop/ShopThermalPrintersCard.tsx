import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Printer,
  Plus,
  Trash2,
  Edit,
  Wifi,
  Bluetooth,
  Save,
  RefreshCw,
  AlertCircle,
  Layers,
  Power,
  ShieldAlert,
} from "lucide-react";
import { ShopService, type ShopPrinterRecord } from "@/services/shopService";
import { toast } from "sonner";

interface ShopThermalPrintersCardProps {
  shopId: number;
}

const DEFAULT_PRESETS: Partial<ShopPrinterRecord>[] = [
  {
    id: "station_kitchen_main",
    name: "Kitchen Food Printer (မီးဖိုချောင်)",
    connectionType: "network",
    ipAddress: "192.168.1.100",
    port: 9100,
    paperSize: "mm80",
    languageMode: "myanmarEnglish",
    routingTarget: "kitchenFoodOnly",
    autoPrintTrigger: "onCookingStarted",
    printLogo: false, // Standard: OFF for kitchen to save paper & print fastest
    isEnabled: true,
  },
  {
    id: "station_bar_drinks",
    name: "Drinks Bar Printer (ဘား/အအေး)",
    connectionType: "network",
    ipAddress: "192.168.1.101",
    port: 9100,
    paperSize: "mm80",
    languageMode: "myanmarEnglish",
    routingTarget: "barDrinksOnly",
    autoPrintTrigger: "onCookingStarted",
    printLogo: false, // Standard: OFF for bar
    isEnabled: true,
  },
  {
    id: "station_cashier_counter",
    name: "Cashier Counter Slip (ငွေကိုင်/ကောင်တာ)",
    connectionType: "bluetooth",
    bluetoothName: "RPP02N / MTP-II",
    bluetoothMac: "",
    paperSize: "mm58",
    languageMode: "myanmarEnglish",
    routingTarget: "all",
    autoPrintTrigger: "onPaymentSuccess",
    printLogo: true, // Standard: ON for cashier customer receipt
    isEnabled: true,
  },
];

export function ShopThermalPrintersCard({ shopId }: ShopThermalPrintersCardProps) {
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(true);
  const [printers, setPrinters] = useState<ShopPrinterRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form state for Add/Edit
  const [formData, setFormData] = useState<Partial<ShopPrinterRecord>>({
    name: "",
    connectionType: "network",
    ipAddress: "192.168.1.100",
    port: 9100,
    bluetoothName: "",
    bluetoothMac: "",
    paperSize: "mm80",
    languageMode: "myanmarEnglish",
    routingTarget: "all",
    autoPrintTrigger: "onCookingStarted",
    printLogo: false,
    isEnabled: true,
  });

  const loadPrinters = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const data = await ShopService.getAdminShopPrinters(shopId);
      setIsFeatureEnabled(data.isFeatureEnabled);
      setPrinters(data.printers);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load thermal printers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrinters();
  }, [shopId]);

  const handleSaveAll = async () => {
    if (!shopId) return;
    setSaving(true);
    try {
      const updated = await ShopService.updateAdminShopPrinters(
        shopId,
        printers,
        isFeatureEnabled,
      );
      setIsFeatureEnabled(updated.isFeatureEnabled);
      setPrinters(updated.printers);
      toast.success("Thermal printer configurations saved and broadcasted to Shop App!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save thermal printers");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPresets = () => {
    const populated = DEFAULT_PRESETS.map((p, idx) => ({
      ...p,
      id: p.id || `preset_${Date.now()}_${idx}`,
      shopId,
    })) as ShopPrinterRecord[];
    setPrinters(populated);
    toast.info("Applied default 3-station presets. Click 'Save Configurations' to commit.");
  };

  const handleTogglePrinter = (index: number, checked: boolean) => {
    const updated = [...printers];
    updated[index] = { ...updated[index], isEnabled: checked };
    setPrinters(updated);
  };

  const handleDeletePrinter = (index: number) => {
    const updated = printers.filter((_, idx) => idx !== index);
    setPrinters(updated);
    toast.success("Printer removed. Remember to save changes.");
  };

  const handleOpenAddDialog = () => {
    setEditingIndex(null);
    setFormData({
      id: `printer_${Date.now()}`,
      name: `Printer Station #${printers.length + 1}`,
      connectionType: "network",
      ipAddress: "192.168.1.100",
      port: 9100,
      bluetoothName: "",
      bluetoothMac: "",
      paperSize: "mm80",
      languageMode: "myanmarEnglish",
      routingTarget: "all",
      autoPrintTrigger: "onCookingStarted",
      printLogo: false,
      isEnabled: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (index: number) => {
    setEditingIndex(index);
    setFormData({ ...printers[index] });
    setDialogOpen(true);
  };

  const handleDialogSubmit = () => {
    if (!formData.name?.trim()) {
      toast.error("Please enter a printer name");
      return;
    }

    if (formData.connectionType === "network" && !formData.ipAddress?.trim()) {
      toast.error("Please enter a valid IP address for Network printer");
      return;
    }

    const updated = [...printers];
    if (editingIndex !== null) {
      updated[editingIndex] = { ...updated[editingIndex], ...formData } as ShopPrinterRecord;
    } else {
      updated.push({
        ...formData,
        id: formData.id || `printer_${Date.now()}`,
        shopId,
      } as ShopPrinterRecord);
    }

    setPrinters(updated);
    setDialogOpen(false);
    toast.success(editingIndex !== null ? "Printer station updated" : "New printer station added");
  };

  const getLanguageLabel = (mode: string) => {
    switch (mode) {
      case "myanmarOnly":
        return "🇲🇲 Myanmar Only";
      case "thaiOnly":
        return "🇹🇭 Thai Only";
      case "englishOnly":
        return "🇬🇧 English Only";
      case "myanmarEnglish":
        return "🇲🇲/🇬🇧 Myanmar + English";
      case "thaiEnglish":
        return "🇹🇭/🇬🇧 Thai + English";
      case "threeLanguages":
        return "🌐 All 3 Languages";
      default:
        return mode;
    }
  };

  const getRoutingLabel = (target: string) => {
    switch (target) {
      case "kitchenFoodOnly":
        return "🍳 Kitchen / Food Only";
      case "barDrinksOnly":
        return "🍹 Drinks / Bar Only";
      case "all":
      default:
        return "🍽️ All Categories";
    }
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case "onPaymentSuccess":
        return "💵 Payment Success";
      case "onCookingStarted":
        return "🔥 Cooking Started";
      case "onBoth":
        return "⚡ Payment + Cooking";
      case "manualOnly":
        return "🖐️ Manual Print Only";
      default:
        return trigger;
    }
  };

  return (
    <Card className="border-solid shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Thermal Kitchen Printers (မီးဖိုချောင်သုံး ပရင်တာ စီမံခန့်ခွဲမှု)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Configure multi-station 58mm/80mm thermal receipt printers with Burmese/Thai/English rendering and automatic print triggers.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadPrinters}
              disabled={loading || saving}
              className="h-8 gap-1"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Reload
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyPresets}
              disabled={saving}
              className="h-8 gap-1"
            >
              <Layers className="h-3.5 w-3.5" />
              Preset 3 Stations
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleOpenAddDialog}
              disabled={saving || !isFeatureEnabled}
              className="h-8 gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Station
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSaveAll}
              disabled={saving || loading}
              className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Configurations"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Master Feature Switch */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-colors gap-3 ${
          isFeatureEnabled
            ? "bg-amber-50/40 border-amber-300 text-amber-950 dark:bg-amber-950/20 dark:border-amber-700"
            : "bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-900/40 dark:border-slate-800"
        }`}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Power className={`h-4 w-4 ${isFeatureEnabled ? "text-amber-600" : "text-slate-400"}`} />
              <span>Thermal Kitchen Printers (မီးဖိုချောင်သုံး ပရင်တာ စနစ် အသုံးပြုခွင့်)</span>
              <Badge
                variant={isFeatureEnabled ? "default" : "outline"}
                className={isFeatureEnabled
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-[10px] shadow-sm"
                  : "border-slate-300 text-slate-500 font-semibold text-[10px]"
                }
              >
                {isFeatureEnabled ? "⭐ PREMIUM (ON - ဖွင့်ထားသည်)" : "OFF / DISABLED (ပိတ်ထားသည်)"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {isFeatureEnabled
                ? "⭐ Premium Feature ON: Restaurant can configure & use thermal printers. Syncs live to Shop App."
                : "🔒 Feature OFF: Shop App will show a gold 'PREMIUM' badge on the Printers service icon, locking configuration."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={isFeatureEnabled}
              onCheckedChange={async (checked) => {
                setIsFeatureEnabled(checked);
                try {
                  await ShopService.updateAdminShopPrinters(shopId, printers, checked);
                  toast.success(
                    checked
                      ? "Thermal Printers turned ON (Premium Active) & synced live to Shop App!"
                      : "Thermal Printers turned OFF (Disabled / Shows Gold Badge) & synced live to Shop App!"
                  );
                } catch (err: any) {
                  toast.error(err?.message || "Failed to update printer feature toggle");
                }
              }}
            />
          </div>
        </div>

        {/* Info banner when disabled */}
        {!isFeatureEnabled && (
          <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-3 text-xs text-amber-950 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Note:</strong> Printer functionality is currently disabled for this restaurant. The Shop App will display a gold <strong>PREMIUM</strong> badge over the printer service icon and prompt to upgrade when tapped.
            </span>
          </div>
        )}

        {/* Helper Banner */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-900 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-blue-950">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Standard Apps (Grab / Toast / Square) Best Practice:</span>
          </div>
          <p className="leading-relaxed">
            • <strong>MyTogether Logo on Slip:</strong> Included by default on <em>Cashier Counter</em> customer receipts (builds brand trust & official receipt). Disabled on <em>Kitchen & Bar</em> tickets (saves 2-3 cm paper per order, prints 3x faster, zero clutter for chefs).
          </p>
          <p className="leading-relaxed">
            • <strong>Real-Time Sync:</strong> Saving configurations broadcasts a WebSocket update. Active Shop Apps update instantly with zero restarts.
          </p>
        </div>

        {/* Printer List */}
        {printers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center space-y-3">
            <Printer className="h-10 w-10 text-muted-foreground/60" />
            <div className="space-y-1">
              <p className="text-sm font-medium">No thermal printers configured for this restaurant</p>
              <p className="text-xs text-muted-foreground max-w-md">
                Click &quot;Preset 3 Stations&quot; to quickly configure Kitchen, Drinks Bar, and Cashier printers, or add individual printers manually.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={handleApplyPresets}>
                <Layers className="h-3.5 w-3.5 mr-1" />
                Add 3 Standard Stations
              </Button>
              <Button type="button" size="sm" onClick={handleOpenAddDialog} disabled={!isFeatureEnabled}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Station
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {printers.map((printer, index) => (
              <div
                key={printer.id || index}
                className={`relative rounded-xl border p-4 transition-all space-y-3 ${
                  printer.isEnabled && isFeatureEnabled
                    ? "bg-card border-border shadow-sm hover:border-primary/50"
                    : "bg-muted/40 border-dashed text-muted-foreground opacity-75"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                      {printer.connectionType === "network" ? (
                        <Wifi className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Bluetooth className="h-4 w-4 text-blue-600" />
                      )}
                      <span>{printer.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {printer.connectionType === "network"
                        ? `${printer.ipAddress || "192.168.1.100"}:${printer.port || 9100}`
                        : printer.bluetoothName || "Bluetooth Device"}
                    </p>
                  </div>
                  <Switch
                    checked={printer.isEnabled}
                    onCheckedChange={(checked) => handleTogglePrinter(index, checked)}
                    title={printer.isEnabled ? "Printer Enabled" : "Printer Disabled"}
                  />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {printer.paperSize === "mm58" ? "58mm (Receipt)" : "80mm (Kitchen)"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {getLanguageLabel(printer.languageMode)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-normal ${
                      printer.routingTarget === "kitchenFoodOnly"
                        ? "border-amber-300 text-amber-700 bg-amber-50"
                        : printer.routingTarget === "barDrinksOnly"
                        ? "border-sky-300 text-sky-700 bg-sky-50"
                        : "border-gray-200 text-gray-700"
                    }`}
                  >
                    {getRoutingLabel(printer.routingTarget)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-normal ${
                      printer.autoPrintTrigger === "onCookingStarted"
                        ? "border-orange-300 text-orange-700 bg-orange-50"
                        : printer.autoPrintTrigger === "onPaymentSuccess"
                        ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                        : printer.autoPrintTrigger === "onBoth"
                        ? "border-purple-300 text-purple-700 bg-purple-50"
                        : "border-gray-200 text-gray-700"
                    }`}
                  >
                    {getTriggerLabel(printer.autoPrintTrigger)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-normal ${
                      printer.printLogo
                        ? "border-indigo-300 text-indigo-700 bg-indigo-50"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {printer.printLogo ? "🏷️ Logo: ON" : "🏷️ Logo: OFF"}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 pt-1 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => handleOpenEditDialog(index)}
                    title="Edit Printer"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeletePrinter(index)}
                    title="Remove Printer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              {editingIndex !== null ? "Edit Thermal Printer Station" : "Add Thermal Printer Station"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure connection, paper size (58mm/80mm), slip language, logo, and order routing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Station Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Station Name (အမည်)</Label>
              <Input
                placeholder="e.g. Kitchen Food Station / Bar Drinks / Cashier"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            {/* Connection Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Connection Type (ချိတ်ဆက်မှုပုံစံ)</Label>
                <Select
                  value={formData.connectionType || "network"}
                  onValueChange={(val: "network" | "bluetooth") =>
                    setFormData({ ...formData, connectionType: val })
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="network">🌐 WiFi / LAN (Ethernet Port 9100)</SelectItem>
                    <SelectItem value="bluetooth">📶 Bluetooth Classic SPP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Paper Size (စက္ကူဆိုဒ်)</Label>
                <Select
                  value={formData.paperSize || "mm80"}
                  onValueChange={(val: "mm58" | "mm80") =>
                    setFormData({ ...formData, paperSize: val })
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm80">80mm (Standard Kitchen Slip - 576 dots)</SelectItem>
                    <SelectItem value="mm58">58mm (Receipt / Small - 384 dots)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Network or Bluetooth Fields */}
            {formData.connectionType === "network" ? (
              <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 rounded-lg border">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">Printer IP Address</Label>
                  <Input
                    placeholder="192.168.1.100"
                    value={formData.ipAddress || ""}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Port</Label>
                  <Input
                    placeholder="9100"
                    type="number"
                    value={formData.port || 9100}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value, 10) || 9100 })}
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-3 bg-muted/20 rounded-lg border">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Bluetooth Device Name / Model</Label>
                  <Input
                    placeholder="e.g. MTP-II / RPP02N"
                    value={formData.bluetoothName || ""}
                    onChange={(e) => setFormData({ ...formData, bluetoothName: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Bluetooth MAC Address (Optional)</Label>
                  <Input
                    placeholder="00:11:22:33:44:55"
                    value={formData.bluetoothMac || ""}
                    onChange={(e) => setFormData({ ...formData, bluetoothMac: e.target.value })}
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>
            )}

            {/* Languages & Routing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Language Mode (ဘာသာစကား)</Label>
                <Select
                  value={formData.languageMode || "myanmarEnglish"}
                  onValueChange={(val: any) => setFormData({ ...formData, languageMode: val })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="myanmarEnglish">🇲🇲/🇬🇧 Myanmar + English</SelectItem>
                    <SelectItem value="myanmarOnly">🇲🇲 Myanmar Unicode Only</SelectItem>
                    <SelectItem value="thaiEnglish">🇹🇭/🇬🇧 Thai + English</SelectItem>
                    <SelectItem value="thaiOnly">🇹🇭 Thai Only</SelectItem>
                    <SelectItem value="englishOnly">🇬🇧 English Only</SelectItem>
                    <SelectItem value="threeLanguages">🌐 All 3 Languages</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category Routing (ပစ္စည်းအမျိုးအစား)</Label>
                <Select
                  value={formData.routingTarget || "all"}
                  onValueChange={(val: any) => setFormData({ ...formData, routingTarget: val })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🍽️ All Items (အားလုံး)</SelectItem>
                    <SelectItem value="kitchenFoodOnly">🍳 Food / Kitchen Only</SelectItem>
                    <SelectItem value="barDrinksOnly">🍹 Drinks / Bar Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Auto Print Trigger */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Auto-Print Event Trigger (အလိုအလျောက် ပရင့်ထုတ်မည့်အချိန်)</Label>
              <Select
                value={formData.autoPrintTrigger || "onCookingStarted"}
                onValueChange={(val: any) => setFormData({ ...formData, autoPrintTrigger: val })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onCookingStarted">🔥 Cooking Started (စတင်ချက်ပြုတ်ချိန် - အကြံပြု)</SelectItem>
                  <SelectItem value="onPaymentSuccess">💵 Payment Success (ငွေပေးချေမှု အောင်မြင်ချိန်)</SelectItem>
                  <SelectItem value="onBoth">⚡ Both States (ငွေချေချိန်ရော ချက်ပြုတ်ချိန်ပါ)</SelectItem>
                  <SelectItem value="manualOnly">🖐️ Manual Print Only (လက်ဖြင့် နှိပ်ထုတ်မှသာ)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Print Logo Switch */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/10">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Print MyTogether Logo (ဘောက်ချာထိပ်တွင် Logo ထည့်မည်)</Label>
                <p className="text-[11px] text-muted-foreground">
                  Recommended: ON for Cashier/Counter receipts, OFF for Kitchen/Bar to save paper and print fastest.
                </p>
              </div>
              <Switch
                checked={formData.printLogo ?? false}
                onCheckedChange={(checked) => setFormData({ ...formData, printLogo: checked })}
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/10">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Enable Station (အသုံးပြုရန် ဖွင့်ထားမည်)</Label>
                <p className="text-[11px] text-muted-foreground">
                  When enabled, this printer actively receives print dispatch jobs.
                </p>
              </div>
              <Switch
                checked={formData.isEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleDialogSubmit}>
              {editingIndex !== null ? "Update Station" : "Add Station"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
