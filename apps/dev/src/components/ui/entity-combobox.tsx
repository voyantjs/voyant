import { useQuery } from "@tanstack/react-query"
import * as React from "react"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { api } from "@/lib/api-client"

type ListResponse<T> = { data: T[]; total?: number; limit?: number; offset?: number }

type EntityComboboxProps<T extends { id: string }> = {
  value: string | null | undefined
  onChange: (id: string | null) => void
  endpoint: string
  queryKey: readonly unknown[]
  getLabel: (item: T) => string
  getSecondary?: (item: T) => string | undefined
  placeholder?: string
  emptyText?: string
  disabled?: boolean
}

/**
 * A searchable dropdown that fetches entities from a REST endpoint and lets
 * the user pick one by a human-readable label instead of pasting a raw ID.
 *
 * The endpoint is expected to return a ListResponse<T>. Items are fetched
 * once (up to limit=200) and filtered client-side.
 */
export function EntityCombobox<T extends { id: string }>({
  value,
  onChange,
  endpoint,
  queryKey,
  getLabel,
  getSecondary,
  placeholder = "Search…",
  emptyText = "No results.",
  disabled,
}: EntityComboboxProps<T>) {
  const { data, isPending } = useQuery({
    queryKey,
    queryFn: () => api.get<ListResponse<T>>(endpoint),
  })

  const items = React.useMemo(() => data?.data ?? [], [data])
  const itemIds = React.useMemo(() => items.map((item) => item.id), [items])
  const itemMap = React.useMemo(() => {
    const map = new Map<string, T>()
    for (const item of items) map.set(item.id, item)
    return map
  }, [items])

  const selectedLabel = React.useMemo(() => {
    if (!value) return ""
    const item = itemMap.get(value)
    return item ? getLabel(item) : ""
  }, [value, itemMap, getLabel])

  const [inputValue, setInputValue] = React.useState(selectedLabel)

  React.useEffect(() => {
    setInputValue(selectedLabel)
  }, [selectedLabel])

  return (
    <Combobox
      items={itemIds}
      value={value ?? null}
      inputValue={inputValue}
      autoHighlight
      disabled={disabled}
      itemToStringValue={(id) => {
        const item = itemMap.get(id as string)
        return item ? getLabel(item) : ""
      }}
      onInputValueChange={(next) => {
        setInputValue(next)
        if (!next) onChange(null)
      }}
      onValueChange={(next) => {
        const id = (next as string | null) ?? null
        onChange(id)
        if (id) {
          const item = itemMap.get(id)
          setInputValue(item ? getLabel(item) : "")
        } else {
          setInputValue("")
        }
      }}
    >
      <ComboboxInput placeholder={placeholder} showClear={!!value} />
      <ComboboxContent>
        <ComboboxEmpty>{isPending ? "Loading…" : emptyText}</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection>
            {(id) => {
              const item = itemMap.get(id as string)
              if (!item) return null
              const secondary = getSecondary?.(item)
              return (
                <ComboboxItem key={item.id} value={item.id}>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{getLabel(item)}</span>
                    {secondary && (
                      <span className="truncate text-xs text-muted-foreground">{secondary}</span>
                    )}
                  </div>
                </ComboboxItem>
              )
            }}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
