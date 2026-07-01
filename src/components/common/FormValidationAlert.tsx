import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FormValidationAlertProps {
  visible: boolean;
  messages: string[];
  title?: string;
}

export function FormValidationAlert({
  visible,
  messages,
  title = "Please fix the following",
}: FormValidationAlertProps) {
  if (!visible || messages.length === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 list-disc pl-4">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
