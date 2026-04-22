"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import styles from './MultiSelect.module.css';

interface Option {
  id: string | number;
  name: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedIds = [],
  onChange,
  placeholder = "Select options...",
  label,
  icon,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    const newSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    onChange(newSelectedIds);
  };

  const removeOption = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(i => i !== id));
  };

  const toggleAll = () => {
    if (selectedIds.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(opt => String(opt.id)));
    }
  };

  const selectedOptions = options.filter(opt => selectedIds.includes(String(opt.id)));
  const isAllSelected = options.length > 0 && selectedIds.length === options.length;

  return (
    <div className={styles.container} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div 
        className={`${styles.selectBox} ${isOpen ? styles.isOpen : ''} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className={styles.iconWrapper}>
          {icon}
        </div>
        <div className={styles.valuesWrapper}>
          {selectedOptions.length > 0 ? (
            <div className={styles.tagsContainer}>
              {selectedOptions.map(opt => (
                <span key={opt.id} className={`${styles.tag} ${disabled ? styles.disabledTag : ''}`}>
                  {opt.name}
                  {!disabled && (
                    <button onClick={(e) => removeOption(String(opt.id), e)} className={styles.removeTag}>
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </div>
        <ChevronDown size={18} className={`${styles.chevron} ${isOpen ? styles.chevronUp : ''}`} />
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          {options.length === 0 ? (
            <div className={styles.noOptions}>No options available</div>
          ) : (
            <>
              <div className={styles.optionsList}>
                <div 
                  className={`${styles.option} ${styles.selectAllOption} ${isAllSelected ? styles.isSelected : ''}`}
                  onClick={toggleAll}
                >
                  <div className={styles.checkbox}>
                    {isAllSelected && <Check size={12} />}
                  </div>
                  <span>Select All</span>
                </div>
                <div className={styles.dropdownSeparator} />
                {options.map(opt => {
                  const isSelected = selectedIds.includes(String(opt.id));
                  return (
                    <div 
                      key={opt.id} 
                      className={`${styles.option} ${isSelected ? styles.isSelected : ''}`}
                      onClick={() => toggleOption(String(opt.id))}
                    >
                      <div className={styles.checkbox}>
                        {isSelected && <Check size={12} />}
                      </div>
                      <span>{opt.name}</span>
                    </div>
                  );
                })}
              </div>
              <div className={styles.confirmWrapper}>
                <button 
                  className={styles.confirmBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                >
                  Confirm Selection
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
