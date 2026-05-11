"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface NumericInputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    label: string
    error?: string
    value?: number | null | string
    onChange?: (value: number | null) => void
}

export const NumericInputField = React.forwardRef<HTMLInputElement, NumericInputFieldProps>(
    ({ label, error, className, value, onChange, ...props }, ref) => {
        const [displayValue, setDisplayValue] = useState("")

        // Function to format number with thousand separators
        const formatNumber = useCallback((val: number | string | null | undefined) => {
            if (val === null || val === undefined || val === "") return ""
            const num = typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : val
            if (isNaN(num)) return ""

            // Split into integer and decimal parts
            const parts = num.toString().split(".")
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            return parts.join(".")
        }, [])

        // Update display value when internal value changes
        useEffect(() => {
            setDisplayValue(formatNumber(value))
        }, [value, formatNumber])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value.replace(/,/g, "")

            // Only allow numbers and decimal point
            if (rawValue !== "" && !/^\d*\.?\d*$/.test(rawValue)) {
                return
            }

            // Update display locally immediately for better UX
            // But avoid multiple commas while typing
            const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            setDisplayValue(formatted)

            // Notify parent of numeric change
            if (onChange) {
                if (rawValue === "") {
                    onChange(null)
                } else {
                    const num = parseFloat(rawValue)
                    onChange(isNaN(num) ? null : num)
                }
            }
        }

        return (
            <div className="flex flex-col gap-1">
                <Label htmlFor={props.id}>{label}</Label>
                <Input
                    ref={ref}
                    className={cn(error && "border-red-500", className)}
                    {...props}
                    type="text" // Change to text to allow comma display
                    value={displayValue}
                    onChange={handleChange}
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        )
    }
)

NumericInputField.displayName = "NumericInputField"
