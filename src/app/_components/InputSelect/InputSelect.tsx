"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import './InputSelect.css';

export interface SelectOption {
  label: string;
  value: string;
}

interface BaseProps {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
}

interface SingleProps extends BaseProps {
  multiple?: false;
  value: string | null;
  onChange: (value: string) => void;
}

interface MultiProps extends BaseProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

type InputSelectProps = SingleProps | MultiProps;

export default function InputSelect(props: InputSelectProps) {
  const { label, options, placeholder = 'Select...', multiple, value, onChange, required } = props;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  function isSelected(v: string) {
    return multiple ? (value as string[]).includes(v) : value === v;
  }

  function toggle(v: string) {
    if (multiple) {
      const cur = value as string[];
      const next = cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v];
      (onChange as (v: string[]) => void)(next);
    } else {
      (onChange as (v: string) => void)(v);
      setOpen(false);
    }
  }

  function displayText() {
    if (multiple) {
      const sel = value as string[];
      if (sel.length === 0) return placeholder;
      if (sel.length === 1) return options.find(o => o.value === sel[0])?.label ?? sel[0];
      return `${sel.length} selected`;
    }
    return options.find(o => o.value === value)?.label ?? placeholder;
  }

  const hasValue = multiple ? (value as string[]).length > 0 : !!value;

  return (
    <div className="input-select" ref={ref}>
      {label && (
        <label className="input-select__label">
          {label}{required && <span className="input-required-star">*</span>}
        </label>
      )}
      {required && (
        <input
          tabIndex={-1}
          required
          value={multiple ? (value as string[]).join(',') : (value ?? '')}
          onChange={() => {}}
          className="input-hidden-validator"
        />
      )}
      <button
        type="button"
        className={`input-select__trigger${open ? ' input-select__trigger--open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={`input-select__display${!hasValue ? ' input-select__display--placeholder' : ''}`}>
          {displayText()}
        </span>
        <ChevronDown size={15} className={`input-select__chevron${open ? ' input-select__chevron--open' : ''}`} />
      </button>

      {open && (
        <div className="input-select__dropdown">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`input-select__option${isSelected(opt.value) ? ' input-select__option--selected' : ''}`}
              onClick={() => toggle(opt.value)}
            >
              {multiple && (
                <span className={`input-select__check${isSelected(opt.value) ? ' input-select__check--active' : ''}`}>
                  {isSelected(opt.value) && <Check size={10} strokeWidth={3} />}
                </span>
              )}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
