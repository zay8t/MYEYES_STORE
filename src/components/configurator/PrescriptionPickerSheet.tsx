'use client';

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PrescriptionPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  unit?: string;
}

export function PrescriptionPickerSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  options,
  value,
  onChange,
  unit,
}: PrescriptionPickerSheetProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Check if options have negative/plano/positive categories (for SPH and CYL)
  const hasSignCategories = useMemo(() => {
    const hasNeg = options.some((o) => o.startsWith('-'));
    const hasPos = options.some((o) => o.startsWith('+'));
    const hasPlano = options.some((o) => o === '0.00' || o === 'PL' || o === 'None');
    return (hasNeg && hasPos) || (hasNeg && hasPlano);
  }, [options]);

  // Find index of category starts
  const categoryIndices = useMemo(() => {
    if (!hasSignCategories) return null;
    const negIdx = options.findIndex((o) => o.startsWith('-'));
    const planoIdx = options.findIndex((o) => o === '0.00' || o === 'PL' || o === 'None');
    const posIdx = options.findIndex((o) => o.startsWith('+'));
    return { neg: negIdx, plano: planoIdx, pos: posIdx };
  }, [options, hasSignCategories]);

  // Jump to specific sign category
  const scrollToCategory = useCallback(
    (cat: 'neg' | 'plano' | 'pos') => {
      if (!categoryIndices || !listRef.current) return;
      const targetIdx = categoryIndices[cat];
      if (targetIdx < 0) return;
      const targetEl = listRef.current.children[targetIdx] as HTMLElement | undefined;
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [categoryIndices]
  );

  // Auto-scroll to selected value on open
  useEffect(() => {
    if (isOpen && activeItemRef.current && listRef.current) {
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({
          behavior: 'auto',
          block: 'center',
        });
      }, 50);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-sheet-title"
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 p-5 z-10 flex flex-col max-h-[85vh] sm:max-h-[75vh] animate-in slide-in-from-bottom duration-200 overscroll-contain"
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h3
              id="picker-sheet-title"
              className="text-base sm:text-lg font-bold text-slate-900 leading-tight"
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Jump Pills (Negative / Plano / Positive) */}
        {hasSignCategories && categoryIndices && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl my-3 shrink-0">
            {categoryIndices.neg >= 0 && (
              <button
                type="button"
                onClick={() => scrollToCategory('neg')}
                className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-white hover:text-amber-700 hover:shadow-xs transition-all cursor-pointer text-center"
              >
                Negative (-)
              </button>
            )}
            {categoryIndices.plano >= 0 && (
              <button
                type="button"
                onClick={() => scrollToCategory('plano')}
                className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-white hover:text-amber-700 hover:shadow-xs transition-all cursor-pointer text-center"
              >
                Plano (0.00)
              </button>
            )}
            {categoryIndices.pos >= 0 && (
              <button
                type="button"
                onClick={() => scrollToCategory('pos')}
                className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-white hover:text-amber-700 hover:shadow-xs transition-all cursor-pointer text-center"
              >
                Positive (+)
              </button>
            )}
          </div>
        )}

        {/* Options List */}
        <div
          ref={listRef}
          className="flex-1 max-h-[55vh] overflow-y-auto overscroll-contain divide-y divide-slate-100 rounded-xl border border-slate-100 mt-1"
        >
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <button
                key={opt}
                ref={isSelected ? activeItemRef : undefined}
                type="button"
                onClick={() => {
                  onChange(opt);
                  onClose();
                }}
                className={cn(
                  'w-full min-h-[50px] py-3.5 px-4 flex items-center justify-between text-base font-semibold transition-colors cursor-pointer text-left',
                  isSelected
                    ? 'bg-amber-50 text-amber-600 font-bold border-l-4 border-amber-500 pl-3'
                    : 'text-slate-700 hover:bg-amber-50/50 active:bg-amber-100/70'
                )}
              >
                <span className="font-mono text-base tracking-tight">
                  {opt}
                  {unit ? ` ${unit}` : ''}
                </span>
                {isSelected && (
                  <Check className="w-5 h-5 text-amber-600 shrink-0 stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Done Action Button */}
        <div className="pt-3 mt-1 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer active:scale-[0.99]"
          >
            Confirm Value
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrescriptionPickerSheet;
