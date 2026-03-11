import * as React from "react"
import { Input } from "./input"
import { formatNumberWithCommas, parseNumberFromCommas } from "@/lib/utils"

interface PriceInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: string | number;
  onValueChange: (value: string) => void;
}

const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(formatNumberWithCommas(value));

    React.useEffect(() => {
      setDisplayValue(formatNumberWithCommas(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = parseNumberFromCommas(e.target.value);
      
      // Allow only numbers and one decimal point
      if (rawValue === "" || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
        onValueChange(rawValue);
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
