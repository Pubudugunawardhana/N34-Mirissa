'use client';

import { useEffect, useRef, useState } from 'react';

type Option = { value: string; label: string };

type SelectMenuProps = {
  id: string;
  name: string;
  label: string;
  options: Option[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  // "form" matches the labelled inputs used in forms; the default suits search bars.
  variant?: 'bar' | 'form';
};

// Styled replacement for a native <select>. The chosen value is submitted through a hidden input.
export default function SelectMenu({ id, name, label, options, defaultValue, onChange, variant = 'bar' }: SelectMenuProps) {
  const [value, setValue] = useState(defaultValue ?? options[0].value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function openMenu() {
    setHighlighted(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    setValue(options[index].value);
    onChange?.(options[index].value);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlighted((current) => Math.min(current + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlighted((current) => Math.max(current - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setHighlighted(0);
        break;
      case 'End':
        event.preventDefault();
        setHighlighted(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(highlighted);
        break;
      case 'Escape':
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={
          variant === 'form'
            ? 'block text-sm font-medium text-slate-700 mb-1.5'
            : 'block text-xs font-semibold text-slate-500 uppercase tracking-[0.15em] mb-2.5'
        }
      >
        {label}
      </label>
      <input type="hidden" name={name} value={value} />

      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={open ? `${id}-option-${highlighted}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`w-full flex items-center justify-between gap-2 border text-slate-800 px-4 text-left outline-none transition-all ${
          variant === 'form' ? 'h-[46px] rounded-lg text-sm' : 'h-14 rounded-xl'
        } ${
          open
            ? 'bg-white border-ocean-400 ring-2 ring-ocean-400/30'
            : `${variant === 'form' ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200'} hover:border-slate-300 focus-visible:border-ocean-400 focus-visible:ring-2 focus-visible:ring-ocean-400/30`
        }`}
      >
        <span className="truncate">{options[selectedIndex].label}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-ocean-600' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl shadow-ocean-900/15"
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setHighlighted(index)}
                onClick={() => choose(index)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  index === highlighted ? 'bg-ocean-50 text-ocean-800' : 'text-slate-700'
                } ${isSelected ? 'font-semibold' : ''}`}
              >
                {option.label}
                {isSelected && (
                  <svg className="h-4 w-4 text-ocean-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
