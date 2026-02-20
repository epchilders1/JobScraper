"use client";
import './InputNumber.css';

interface InputNumberProps {
  label?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  required?: boolean;
}

export default function InputNumber({ label, value, onChange, placeholder, prefix, suffix, min, max, required }: InputNumberProps) {
  return (
    <div className="input-number">
      {label && (
        <label className="input-number__label">
          {label}{required && <span className="input-required-star">*</span>}
        </label>
      )}
      <div className="input-number__field">
        {prefix && <span className="input-number__affix">{prefix}</span>}
        <input
          type="number"
          className="input-number__input"
          value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
          placeholder={placeholder}
          min={min}
          max={max}
          required={required}
        />
        {suffix && <span className="input-number__affix input-number__affix--suffix">{suffix}</span>}
      </div>
    </div>
  );
}
