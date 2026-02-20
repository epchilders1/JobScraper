"use client";
import { useState, useRef } from "react";
import type { KeyboardEvent } from "react";
import { X } from "lucide-react";
import './InputTags.css';

interface InputTagsProps {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  required?: boolean;
}

export default function InputTags({ label, value, onChange, placeholder, required }: InputTagsProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="input-tags">
      {label && (
        <label className="input-tags__label">
          {label}{required && <span className="input-required-star">*</span>}
        </label>
      )}
      {required && (
        <input
          tabIndex={-1}
          required
          value={value.join(',')}
          onChange={() => {}}
          className="input-hidden-validator"
        />
      )}
      <div className="input-tags__field" onClick={() => inputRef.current?.focus()}>
        {value.map(tag => (
          <span key={tag} className="input-tags__chip">
            {tag}
            <button
              type="button"
              className="input-tags__chip-remove"
              onClick={(e) => { e.stopPropagation(); onChange(value.filter(t => t !== tag)); }}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="input-tags__input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={value.length === 0 ? placeholder : ''}
        />
      </div>
      <p className="input-tags__hint">Enter or comma to add · Backspace to remove</p>
    </div>
  );
}
