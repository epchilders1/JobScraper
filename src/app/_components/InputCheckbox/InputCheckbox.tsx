"use client";
import './InputCheckbox.css';

interface InputCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export default function InputCheckbox({ label, checked, onChange }: InputCheckboxProps) {
  return (
    <label className="input-checkbox">
      <input
        type="checkbox"
        className="input-checkbox__input"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="input-checkbox__box">
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="input-checkbox__label">{label}</span>
    </label>
  );
}
