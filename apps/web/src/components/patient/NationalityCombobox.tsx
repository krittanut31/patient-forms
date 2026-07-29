"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { NATIONALITIES } from "@/lib/nationalities";
import { inputClass } from "./Field";

/** Kept in step with the `max-h-64` on the listbox below. */
const LIST_MAX_HEIGHT = 256;

type Props = {
  id: string;
  value: string;
  invalid: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
};

/**
 * A combobox rather than a long native select: the list is over a hundred
 * entries and a patient should be able to type three letters instead of
 * scrolling. Built by hand so the listbox carries real ARIA state — a native
 * `datalist` would be less code but gives no control over what a screen reader
 * announces, and no way to keep the active option visible while arrowing.
 */
export function NationalityCombobox({
  id,
  value,
  invalid,
  describedBy,
  onChange,
  onFocus,
  onBlur,
}: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return NATIONALITIES;
    return NATIONALITIES.filter((name) =>
      name.toLowerCase().includes(needle),
    );
  }, [query]);

  // Keep the highlighted option scrolled into view while arrowing through a
  // list this long, otherwise the highlight vanishes off the bottom.
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const close = (): void => {
    setOpen(false);
    setQuery("");
  };

  const commit = (name: string): void => {
    onChange(name);
    close();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => {
        const next = index + step;
        if (next < 0) return matches.length - 1;
        if (next >= matches.length) return 0;
        return next;
      });
      return;
    }

    if (event.key === "Enter" && open) {
      const picked = matches[activeIndex];
      if (picked) {
        event.preventDefault();
        commit(picked);
      }
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined
        }
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={inputClass}
        value={open ? query : value}
        placeholder={open ? value || "Start typing a nationality" : undefined}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={(event) => {
          setOpen(true);
          setQuery("");
          setActiveIndex(Math.max(0, NATIONALITIES.indexOf(value)));
          onFocus();

          // On a phone this field sits low enough that the list would open
          // behind the on-screen keyboard. Only scroll when it would not fit,
          // so the page does not jump for no reason on a desktop.
          const input = event.currentTarget;
          const room = window.innerHeight - input.getBoundingClientRect().bottom;
          if (room < LIST_MAX_HEIGHT) {
            input.scrollIntoView({ block: "center" });
          }
        }}
        onBlur={() => {
          close();
          onBlur();
        }}
        onKeyDown={handleKeyDown}
      />

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Nationality"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-panel border border-line bg-surface py-1 shadow-lg"
        >
          {matches.length === 0 && (
            <li className="px-3 py-2 text-base text-ink-muted">
              No nationality matches “{query}”
            </li>
          )}
          {matches.map((name, index) => (
            <li
              key={name}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={name === value}
              className={[
                "cursor-pointer px-3 py-2.5 text-md",
                index === activeIndex ? "bg-accent text-accent-ink" : "text-ink",
              ].join(" ")}
              // Pointer-down fires before blur, so the choice registers instead
              // of the field closing out from under the tap.
              onMouseDown={(event) => {
                event.preventDefault();
                commit(name);
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
