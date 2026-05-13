"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Option {
  value: string | number;
  label: string;
}

interface SingleSelectProps {
  multiple?: false;
  value?: string;
  onValueChange: (value: string) => void;
  showAllOption?: boolean;
  allOptionLabel?: string;
}

interface MultiSelectProps {
  multiple: true;
  value?: string[];
  onValueChange: (value: string[]) => void;
  maxDisplay?: number;
  showAllOption?: never;
  allOptionLabel?: never;
}

interface BaseAsyncSelectFieldProps {
  label: string;
  /** Hide the visible label (useful for compact filter bars). */
  hideLabel?: boolean;
  fetchFunction: (
    page: number,
    pageSize: number,
    searchTerm?: string,
  ) => Promise<{ data: Option[]; totalCount: number }>;
  placeholder?: string;
  error?: string;
  showSearch?: boolean;
  pageSize?: number;
  initialValue?: Option;
  initialValues?: Option[];
  /** Extra className for the trigger button. */
  triggerClassName?: string;
  /** When set (single select), prepended to the chosen option label on the trigger (not on the empty / “all” row). */
  selectedLabelPrefix?: string;
  /** Text on the trigger when nothing is selected and `showAllOption` is not used. */
  emptyTriggerLabel?: string;
  /** Disable the select field. */
  disabled?: boolean;
}

type AsyncSelectFieldProps = BaseAsyncSelectFieldProps &
  (SingleSelectProps | MultiSelectProps);

const SCROLL_THRESHOLD = 50;

export function AsyncSelectField(props: AsyncSelectFieldProps) {
  const {
    label,
    hideLabel = false,
    fetchFunction,
    placeholder = "Search...",
    error,
    showSearch: showSearchProp,
    pageSize = 20,
    initialValue,
    initialValues,
    triggerClassName,
    disabled = false,
    selectedLabelPrefix,
    emptyTriggerLabel = "Select option",
  } = props;

  const multiple = props.multiple === true;
  const maxDisplay = multiple ? (props.maxDisplay ?? 3) : 0;
  const showAllOption = !multiple && props.showAllOption;
  const allOptionLabel = !multiple ? (props.allOptionLabel ?? "All") : "";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fetchFunctionRef = useRef(fetchFunction);
  const [cachedOptions, setCachedOptions] = useState<Option[]>([]);
  const lastLoadedKeyRef = useRef<string>("");
  const effectiveShowSearch = showSearchProp ?? true;

  useEffect(() => {
    if (initialValue) {
      setCachedOptions((prev) => {
        const exists = prev.some(
          (opt) => String(opt.value) === String(initialValue.value),
        );
        return exists ? prev : [...prev, initialValue];
      });
    }
    if (initialValues) {
      setCachedOptions((prev) => {
        const newOpts = initialValues.filter(
          (iv) => !prev.some((opt) => String(opt.value) === String(iv.value)),
        );
        return [...prev, ...newOpts];
      });
    }
  }, [initialValue, initialValues]);

  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setSearchTerm(query);
      setCurrentPage(1);
      setOptions([]);
      setHasMore(true);
      lastLoadedKeyRef.current = "";
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      const key = `${pageSize}|${searchTerm}`;
      if (lastLoadedKeyRef.current === key && options.length > 0 && currentPage === 1) {
        return;
      }

      setLoading(true);
      try {
        const result = await fetchFunctionRef.current(
          1,
          pageSize,
          searchTerm || undefined,
        );
        if (result) {
          lastLoadedKeyRef.current = key;
          setOptions(result.data);
          setCurrentPage(1);
          setHasMore(
            result.data.length > 0 && result.data.length < result.totalCount,
          );
          setCachedOptions((prev) => {
            const newOpts = result.data.filter(
              (d) => !prev.some((opt) => String(opt.value) === String(d.value)),
            );
            return [...prev, ...newOpts];
          });
        }
      } catch (error) {
        console.error("Failed to load options:", error);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, searchTerm, pageSize, options.length, currentPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await fetchFunctionRef.current(
        nextPage,
        pageSize,
        searchTerm || undefined,
      );
      if (result) {
        setOptions((prev) => {
          const merged = [...prev, ...result.data];
          const unique = Array.from(
            new Map(merged.map((opt) => [String(opt.value), opt])).values(),
          );
          return unique;
        });
        setCurrentPage(nextPage);
        setHasMore(result.data.length === pageSize && result.data.length > 0);
        setCachedOptions((prev) => {
          const newOpts = result.data.filter(
            (d) => !prev.some((opt) => String(opt.value) === String(d.value)),
          );
          return [...prev, ...newOpts];
        });
      }
    } catch (error) {
      console.error("Failed to load more options:", error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMore, loadingMore, pageSize, searchTerm]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      if (!target || loadingMore || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = target;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom <= SCROLL_THRESHOLD) {
        loadMore();
      }
    },
    [loadMore, loadingMore, hasMore],
  );

  const allOptions = useMemo(() => {
    const merged = [...options, ...cachedOptions];
    return Array.from(
      new Map(merged.map((opt) => [String(opt.value), opt])).values(),
    );
  }, [options, cachedOptions]);

  const selectedOption = useMemo(() => {
    if (multiple) return null;
    const value = props.value;
    if (value === "" && showAllOption) {
      return { value: "", label: allOptionLabel };
    }
    if (!value) return initialValue;
    return (
      allOptions.find((opt) => String(opt.value) === value) || initialValue
    );
  }, [
    multiple,
    props,
    showAllOption,
    allOptionLabel,
    allOptions,
    initialValue,
  ]);

  const selectedOptions = useMemo(() => {
    if (!multiple) return [];
    const values = props.value || [];
    return values
      .map((v) => allOptions.find((opt) => String(opt.value) === v))
      .filter((opt): opt is Option => opt !== undefined);
  }, [multiple, props, allOptions]);

  const filtered = useMemo(() => {
    let result = options;
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = options.filter((opt) =>
        opt.label.toLowerCase().includes(lowerQuery),
      );
    }

    if (showAllOption && !query && !multiple) {
      return [{ value: "", label: allOptionLabel }, ...result];
    }

    return result;
  }, [options, query, showAllOption, allOptionLabel, multiple]);

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const currentValues = props.value || [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      props.onValueChange(newValues);
    } else {
      const isAlreadySelected = props.value === optionValue;
      props.onValueChange(isAlreadySelected ? "" : optionValue);
      setQuery("");
      setOpen(false);
    }
  };

  const isSelected = (optionValue: string) => {
    if (multiple) {
      return (props.value || []).includes(optionValue);
    }
    return props.value === optionValue;
  };

  const renderTriggerContent = () => {
    if (multiple) {
      const values = props.value || [];
      if (values.length === 0) {
        return <span className="text-muted-foreground">Select options...</span>;
      }

      const displayOptions = selectedOptions.slice(0, maxDisplay);
      const remaining = values.length - maxDisplay;

      return (
        <div className="flex flex-wrap gap-1 items-center">
          {displayOptions.map((opt) => (
            <Badge
              key={opt.value}
              variant="default"
              className="flex items-center gap-1"
            >
              {opt.label}
            </Badge>
          ))}
          {remaining > 0 && (
            <Badge variant="default" className="text-xs">
              +{remaining} more
            </Badge>
          )}
        </div>
      );
    }

    return selectedOption
      ? (() => {
          const isEmptyChoice =
            showAllOption && String(selectedOption.value) === "";
          const base = selectedOption.label;
          if (
            !multiple &&
            selectedLabelPrefix &&
            !isEmptyChoice
          ) {
            return `${selectedLabelPrefix}${base}`;
          }
          return base;
        })()
      : emptyTriggerLabel;
  };

  return (
    <div className="flex flex-col gap-1">
      {!hideLabel && <Label>{label}</Label>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn(
              "justify-between overflow-hidden min-h-10 h-auto",
              multiple && "flex-wrap",
              error && "border-red-500!",
              disabled && "opacity-50 cursor-not-allowed",
              triggerClassName,
            )}
            size={"lg"}
          >
            {renderTriggerContent()}
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 ml-auto" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 w-[--radix-popover-trigger-width]"
          align="start"
        >
          <Command shouldFilter={false}>
            {effectiveShowSearch && (
              <CommandInput
                placeholder={placeholder}
                value={query}
                onValueChange={setQuery}
              />
            )}

            <div
              ref={scrollContainerRef}
              className="max-h-75 overflow-y-auto w-[280px]"
              onScroll={handleScroll}
            >
              <CommandList className="max-h-none overflow-visible">
                {loading && options.length === 0 ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading...
                    </span>
                  </div>
                ) : filtered.length === 0 ? (
                  <CommandEmpty>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Search className="h-4 w-4" />
                      <span>
                        {searchTerm ? "No results found." : "No options available."}
                      </span>
                    </div>
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filtered.map((opt) => (
                      <CommandItem
                        key={opt.value}
                        onSelect={() => handleSelect(String(opt.value))}
                      >
                        {opt.label}
                        {isSelected(String(opt.value)) && (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                    {loadingMore && (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          Loading more...
                        </span>
                      </div>
                    )}
                    {hasMore && !loadingMore && <div className="h-4 w-full" />}
                  </CommandGroup>
                )}
              </CommandList>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
