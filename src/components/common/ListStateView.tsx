import { Loader2 } from "lucide-react";
import React from "react";

interface ListStateViewProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  loadingMessage?: string;
  errorMessage?: string;
  emptyMessage?: string;
  children: React.ReactNode;
}

const ListStateView: React.FC<ListStateViewProps> = ({
  isLoading,
  isError,
  isEmpty,
  loadingMessage,
  errorMessage = "Failed to load data.",
  emptyMessage = "No items found.",
  children
}) => {
  if (isLoading && isEmpty) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", gap: "12px" }}>
        {/* < name="crescent" color="primary" /> */}
        <Loader2 className="animate-spin" />
        {loadingMessage && <div style={{ color: "var(--pos-text-secondary)", fontSize: "14px" }}>{loadingMessage}</div>}
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--pos-danger)" }}>
        {errorMessage}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--pos-text-muted)" }}>
        {emptyMessage}
      </div>
    );
  }

  return <>{children}</>;
};

export default ListStateView;