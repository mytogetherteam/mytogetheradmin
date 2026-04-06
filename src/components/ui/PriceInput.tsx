import * as React from "react"
import { Input } from "./input"
import { formatNumberWithCommas, parseNumberFromCommas } from "@/lib/utils"

interface PriceInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: string | number;
  onValueChange: (value: string) => void;
  allowAnyInput?: boolean;
}

const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  ({ value, onValueChange, allowAnyInput = false, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(formatNumberWithCommas(value));

    React.useEffect(() => {
      const formatted = formatNumberWithCommas(value);
      if (parseNumberFromCommas(formatted) !== parseNumberFromCommas(displayValue)) {
        setDisplayValue(formatted);
      }
    }, [value, displayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      
      if (allowAnyInput) {
        setDisplayValue(input);
        onValueChange(input);
        return;
      }

      const rawValue = parseNumberFromCommas(input);
      
      // Allow only numbers and one decimal point
      if (rawValue === "" || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
        setDisplayValue(input); // Local state stays exactly as user typed (to keep dots)
        onValueChange(rawValue); // Parent gets the numeric string
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        type="text"
        inputMode="decimal"
      />
    );
  }
)
PriceInput.displayName = "PriceInput"

export { PriceInput }
