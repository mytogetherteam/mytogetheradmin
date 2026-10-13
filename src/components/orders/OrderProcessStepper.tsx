import React from "react";
import { Order, OrderHistoryEntry } from "@/services/orderService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ShoppingBag,
    Receipt,
    Clock,
    CheckCircle2,
    ChefHat,
    PackageCheck,
    Bike,
    CheckCheck,
    XCircle,
    AlertTriangle,
    GitCommit,
    Sparkles,
} from "lucide-react";

interface Props {
    order: Order;
    history?: OrderHistoryEntry[];
}

interface StepDefinition {
    key: string;
    aliasKeys?: string[];
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

const DELIVERY_STEPS: StepDefinition[] = [
    {
        key: "PENDING",
        name: "Order Placed",
        description: "Customer placed the order",
        icon: ShoppingBag,
    },
    {
        key: "PAYMENT_SLIP_REQUESTED",
        aliasKeys: ["CONFIRMED", "ACCEPTED"],
        name: "Slip Requested",
        description: "Waiting for payment slip",
        icon: Receipt,
    },
    {
        key: "AWAITING_APPROVAL",
        aliasKeys: ["PAYMENT_UPLOADED"],
        name: "Under Review",
        description: "Slip submitted for verification",
        icon: Clock,
    },
    {
        key: "PAYMENT_VERIFIED",
        name: "Payment Verified",
        description: "Payment approved by shop/admin",
        icon: CheckCircle2,
    },
    {
        key: "COOKING",
        aliasKeys: ["PREPARING"],
        name: "Preparing Food",
        description: "Kitchen is preparing items",
        icon: ChefHat,
    },
    {
        key: "READY_FOR_PICKUP",
        aliasKeys: ["READY"],
        name: "Ready for Pickup",
        description: "Order packed and ready",
        icon: PackageCheck,
    },
    {
        key: "ON_THE_WAY",
        aliasKeys: ["DELIVERING"],
        name: "On The Way",
        description: "Rider delivering to customer",
        icon: Bike,
    },
    {
        key: "DELIVERED",
        name: "Delivered",
        description: "Order successfully delivered",
        icon: CheckCheck,
    },
];

const PICKUP_STEPS: StepDefinition[] = [
    {
        key: "PENDING",
        name: "Order Placed",
        description: "Customer placed the order",
        icon: ShoppingBag,
    },
    {
        key: "PAYMENT_SLIP_REQUESTED",
        aliasKeys: ["CONFIRMED", "ACCEPTED"],
        name: "Slip Requested",
        description: "Waiting for payment slip",
        icon: Receipt,
    },
    {
        key: "AWAITING_APPROVAL",
        aliasKeys: ["PAYMENT_UPLOADED"],
        name: "Under Review",
        description: "Slip submitted for verification",
        icon: Clock,
    },
    {
        key: "PAYMENT_VERIFIED",
        name: "Payment Verified",
        description: "Payment approved by shop/admin",
        icon: CheckCircle2,
    },
    {
        key: "COOKING",
        aliasKeys: ["PREPARING"],
        name: "Preparing Food",
        description: "Kitchen is preparing items",
        icon: ChefHat,
    },
    {
        key: "READY_FOR_PICKUP",
        aliasKeys: ["READY"],
        name: "Ready for Pickup",
        description: "Order packed and ready",
        icon: PackageCheck,
    },
    {
        key: "PICKED_UP",
        name: "Picked Up",
        description: "Collected by customer",
        icon: CheckCheck,
    },
];

function formatStepTime(timestamp?: string | null): string | null {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

function normalizeStatus(status?: string | null): string {
    return (status || "").toUpperCase().trim();
}

export function OrderProcessStepper({ order, history = [] }: Props) {
    const isPickup =
        order.orderType === "PICK_UP" ||
        order.orderType === "PICKUP" ||
        order.deliveryType === "PICKUP";

    const steps = isPickup ? PICKUP_STEPS : DELIVERY_STEPS;
    const currentStatus = normalizeStatus(order.status);
    const isCanceled = currentStatus === "CANCELED" || currentStatus === "CANCELLED";
    const isRevised = currentStatus === "REVISED";

    // Map each step to any matching timestamp from history or order creation
    const stepTimestamps: Record<string, string> = {};
    if (order.createdAt) {
        stepTimestamps["PENDING"] = order.createdAt;
    }

    history.forEach((h) => {
        const to = normalizeStatus(h.toStatus);
        if (to && h.changedAt) {
            stepTimestamps[to] = h.changedAt;
        }
    });

    // Check terminal statuses
    if ((currentStatus === "DELIVERED" || currentStatus === "PICKED_UP") && order.updatedAt) {
        stepTimestamps[currentStatus] = stepTimestamps[currentStatus] || order.updatedAt;
    }

    // Determine the active step index
    let activeIndex = -1;

    if (!isCanceled) {
        activeIndex = steps.findIndex(
            (s) => s.key === currentStatus || (s.aliasKeys && s.aliasKeys.includes(currentStatus))
        );

        if (activeIndex === -1 && isRevised) {
            // Revised usually pauses at or before COOKING
            activeIndex = 1;
        }
    } else {
        // For canceled orders, find the last step reached before cancellation
        const nonCanceledEntries = history.filter(
            (h) => normalizeStatus(h.toStatus) !== "CANCELED" && normalizeStatus(h.toStatus) !== "CANCELLED"
        );
        const lastValidStatus =
            nonCanceledEntries.length > 0
                ? normalizeStatus(nonCanceledEntries[nonCanceledEntries.length - 1].toStatus)
                : "PENDING";

        activeIndex = steps.findIndex(
            (s) => s.key === lastValidStatus || (s.aliasKeys && s.aliasKeys.includes(lastValidStatus))
        );
        if (activeIndex === -1) activeIndex = 0;
    }

    const isAllCompleted = !isCanceled && activeIndex === steps.length - 1;

    return (
        <Card className="border-border/70 shadow-sm overflow-hidden bg-card/90">
            <CardContent className="p-4 sm:p-5">
                {/* Stepper Header Summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3.5 border-b border-border/50">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center border border-pink-500/20">
                            <GitCommit className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                                    Ordering Process Flow
                                </h3>
                                {isPickup ? (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/60">
                                        Pick-Up
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/60">
                                        Delivery
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isCanceled ? (
                                    <span className="text-destructive font-medium">
                                        Order was stopped & cancelled
                                    </span>
                                ) : isRevised ? (
                                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3 inline" />
                                        Order has revisions pending
                                    </span>
                                ) : isAllCompleted ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                        <Sparkles className="h-3 w-3 inline" />
                                        All ordering steps completed successfully
                                    </span>
                                ) : (
                                    <span>
                                        Current Progress:{" "}
                                        <strong className="text-foreground font-semibold">
                                            Step {activeIndex + 1} of {steps.length} (
                                            {steps[activeIndex]?.name || currentStatus})
                                        </strong>
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Stage status indicator badge */}
                    <div className="flex items-center gap-2">
                        {isCanceled ? (
                            <Badge variant="destructive" className="gap-1.5 text-xs px-2.5 py-1">
                                <XCircle className="h-3.5 w-3.5" />
                                Process Cancelled
                            </Badge>
                        ) : isAllCompleted ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1.5 text-xs px-2.5 py-1">
                                <CheckCheck className="h-3.5 w-3.5" />
                                Completed
                            </Badge>
                        ) : (
                            <Badge className="bg-pink-600 hover:bg-pink-600 text-white gap-1.5 text-xs px-2.5 py-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                In Progress
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Horizontal Stepper Progress Flow */}
                <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin">
                    <div className="min-w-[760px] flex items-start justify-between relative">
                        {steps.map((step, index) => {
                            const IconComponent = step.icon;
                            const isCompleted = !isCanceled && index < activeIndex;
                            const isCurrent = !isCanceled && index === activeIndex;
                            const isPastBeforeCancel = isCanceled && index < activeIndex;
                            const isCanceledAtStep = isCanceled && index === activeIndex;
                            const isFuture = isCanceled ? index > activeIndex : index > activeIndex;

                            // Timestamp for this step
                            const stepTime =
                                stepTimestamps[step.key] ||
                                (step.aliasKeys &&
                                    step.aliasKeys.map((k) => stepTimestamps[k]).find(Boolean));
                            const formattedTime = formatStepTime(stepTime);

                            return (
                                <div
                                    key={step.key}
                                    className="flex-1 relative flex flex-col items-center group"
                                >
                                    {/* Connector line between steps */}
                                    {index < steps.length - 1 && (
                                        <div
                                            className="absolute top-5 left-[50%] w-full h-[3px] -translate-y-1/2 z-0"
                                            style={{
                                                background: isCompleted
                                                    ? "linear-gradient(90deg, #10b981 0%, #10b981 100%)"
                                                    : isCurrent
                                                    ? "linear-gradient(90deg, #ec4899 0%, #e2e8f0 100%)"
                                                    : isPastBeforeCancel
                                                    ? "linear-gradient(90deg, #94a3b8 0%, #94a3b8 100%)"
                                                    : isCanceledAtStep
                                                    ? "linear-gradient(90deg, #ef4444 0%, #e2e8f0 100%)"
                                                    : "var(--border, #e2e8f0)",
                                            }}
                                        />
                                    )}

                                    {/* Step Circle & Icon */}
                                    <div className="relative z-10 flex flex-col items-center">
                                        {isCompleted && (
                                            <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm ring-4 ring-emerald-500/20 transition-all duration-200">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                        )}

                                        {isCurrent && (
                                            <div className="relative">
                                                <span className="animate-ping absolute inset-0 rounded-full bg-pink-500 opacity-30" />
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-pink-600 to-orange-500 text-white flex items-center justify-center shadow-md ring-4 ring-pink-500/25 transition-all duration-200">
                                                    <IconComponent className="h-5 w-5" />
                                                </div>
                                            </div>
                                        )}

                                        {isCanceledAtStep && (
                                            <div className="h-10 w-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md ring-4 ring-destructive/25 transition-all duration-200">
                                                <XCircle className="h-5 w-5" />
                                            </div>
                                        )}

                                        {isPastBeforeCancel && (
                                            <div className="h-10 w-10 rounded-full bg-muted-foreground/30 text-foreground flex items-center justify-center border-2 border-muted-foreground/40 transition-all duration-200">
                                                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}

                                        {isFuture && (
                                            <div className="h-10 w-10 rounded-full bg-muted/60 text-muted-foreground/70 flex items-center justify-center border-2 border-dashed border-border/80 transition-all duration-200">
                                                <IconComponent className="h-4 w-4" />
                                            </div>
                                        )}

                                        {/* Step Number Pill */}
                                        <div
                                            className={`mt-2 text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                                                isCurrent
                                                    ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 font-semibold"
                                                    : isCompleted
                                                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                                    : isCanceledAtStep
                                                    ? "bg-destructive/15 text-destructive font-semibold"
                                                    : "text-muted-foreground/60"
                                            }`}
                                        >
                                            Step {index + 1}
                                        </div>

                                        {/* Step Name */}
                                        <p
                                            className={`mt-1 text-xs text-center font-medium max-w-[90px] leading-tight ${
                                                isCurrent
                                                    ? "text-foreground font-bold"
                                                    : isCompleted
                                                    ? "text-foreground"
                                                    : isCanceledAtStep
                                                    ? "text-destructive font-semibold"
                                                    : "text-muted-foreground/70"
                                            }`}
                                        >
                                            {step.name}
                                        </p>



                                        {/* Timestamp if reached */}
                                        {formattedTime && (
                                            <span className="mt-1 text-[10px] font-mono tabular-nums text-muted-foreground bg-muted/50 px-1 py-0.2 rounded border border-border/40">
                                                {formattedTime}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
