"use client";
import React, { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import './InputFiles.css';

interface InputFilesProps {
  id?: string;
  label?: string;
  placeHolder?: string;
  value: File | string | null;
  onChange: (value: File | string | null) => void;
  accept?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return Math.round(bytes / (1024 * 1024)) + ' MB';
}

export default function InputFiles({ id, label, placeHolder, value, onChange, accept }: InputFilesProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const isFile = value instanceof File;
  const hasValue = typeof value === 'string' || isFile;

  function isAcceptable(file: File): boolean {
    if (!accept) return true;
    const accepted = accept.split(',').map(t => t.trim().toLowerCase());
    const ft = file.type.toLowerCase();
    const fn = file.name.toLowerCase();
    return accepted.some(a => {
      if (a.startsWith('.')) return fn.endsWith(a);
      if (a.includes('/*')) return ft.startsWith(a.replace('*', ''));
      return ft === a;
    });
  }

  function getTypeDescription(): string {
    if (!accept) return 'any';
    const types = accept.split(',').map(t => t.trim().toLowerCase());
    if (types.includes('application/pdf') && types.some(t => t.includes('wordprocessing'))) return 'PDF and DOCX';
    if (types.includes('application/pdf')) return 'PDF';
    if (types.some(t => t.includes('wordprocessing'))) return 'DOCX';
    return types.map(t => (t.startsWith('.') ? t.slice(1) : t.split('/')[1] ?? t).toUpperCase()).join(', ');
  }

  function processFile(file: File) {
    if (!isAcceptable(file)) {
      setError(`Invalid file type. Only ${getTypeDescription()} files are allowed.`);
      setTimeout(() => setError(''), 5000);
      return;
    }
    setError('');
    onChange(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setTimeout(() => {
      processFile(file);
      setIsUploading(false);
    }, 300);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setTimeout(() => {
      processFile(file);
      setIsUploading(false);
    }, 300);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items.length > 0) setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (--dragCounter.current <= 0) setIsDragOver(false);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const dropZoneClass = `drop-zone group ${isDragOver ? 'drop-zone--drag-over bg-bg-elevated' : 'drop-zone--default bg-bg-subtle'} ${isUploading ? 'drop-zone--uploading' : ''}`;

  return (
    <div className="input-files-wrapper">
      <div
        className={dropZoneClass}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {label && (
          <div className="drop-zone__label-container">
            <span className="drop-zone__label">{label}</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          id={id}
          className="drop-zone__input"
          type="file"
          accept={accept}
          onChange={handleChange}
        />

        <div className="drop-zone__content">
          <div className={`drop-zone__icon bg-bg-elevated ${isDragOver || isUploading ? 'drop-zone__icon--active' : 'drop-zone__icon--default'}`}>
            {isUploading ? (
              <div className="drop-zone__spinner"><Upload size={24} /></div>
            ) : (
              <Upload size={24} />
            )}
          </div>

          <h3 className={`drop-zone__heading ${isDragOver ? 'drop-zone__heading--drag-over' : 'drop-zone__heading--default'}`}>
            {isDragOver ? 'Drop file here' : isUploading ? 'Processing...' : hasValue ? 'Replace file' : 'Upload file'}
          </h3>

          <p className={`drop-zone__subtext ${isDragOver ? 'drop-zone__subtext--drag-over' : 'drop-zone__subtext--default'}`}>
            {placeHolder}{accept && ` • ${getTypeDescription()} files only`}
          </p>
        </div>

        {hasValue && (
          <div className="single-file-container">
            <div className="file-item file-item--file">
              <div className="file-item__info">
                <span className="file-item__icon">📁</span>
                <div className="file-item__details">
                  <p className="file-item__name--single">
                    {isFile ? (value as File).name : (value as string)}
                  </p>
                  <p className="file-item__meta">
                    {isFile ? formatFileSize((value as File).size) : 'Saved'}
                  </p>
                </div>
              </div>
              <button onClick={handleRemove} className="file-item__remove-btn" type="button">
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="input-files-error">
          <p className="input-files-error__text">{error}</p>
        </div>
      )}
    </div>
  );
}
