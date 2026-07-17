'use client';

import React, { useState, useRef, useEffect } from 'react';

interface MonthYearPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const FULL_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function MonthYearPicker({ value, onChange, disabled }: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Extract selected year and month from value
  const [selectedYearStr, selectedMonthStr] = value.split('-');
  const selectedYear = parseInt(selectedYearStr, 10) || new Date().getFullYear();
  const selectedMonth = parseInt(selectedMonthStr, 10) || (new Date().getMonth() + 1);

  // State for the year being viewed in the popover
  const [viewYear, setViewYear] = useState(selectedYear);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      setViewYear(selectedYear);
    }
    setIsOpen(!isOpen);
  };

  const handlePrevYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewYear(prev => prev - 1);
  };

  const handleNextYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewYear(prev => prev + 1);
  };

  const handleSelectMonth = (monthIndex: number) => {
    const monthNum = monthIndex + 1;
    const newMonthStr = monthNum.toString().padStart(2, '0');
    const newValue = `${viewYear}-${newMonthStr}`;
    
    if (newValue !== value) {
      onChange(newValue);
    }
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const currentRealDate = new Date();
  const currentRealYear = currentRealDate.getFullYear();
  const currentRealMonth = currentRealDate.getMonth() + 1;

  const displayLabel = `${FULL_MONTHS[selectedMonth - 1]} ${selectedYear}`;

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Seleccionar periodo del resumen. Actual: ${displayLabel}`}
        className={`flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium transition-colors bg-white border rounded-xl 
          ${isOpen ? 'border-graphite-blue ring-1 ring-graphite-blue text-graphite-blue' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className="whitespace-nowrap">{displayLabel}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:right-0 z-50 mt-2 w-64 p-4 bg-white rounded-2xl shadow-lg border border-gray-100 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevYear}
              aria-label="Año anterior"
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-graphite-blue"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-base font-semibold text-graphite-blue" aria-live="polite">
              {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextYear}
              aria-label="Año siguiente"
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-graphite-blue"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((monthName, index) => {
              const monthNum = index + 1;
              const isSelected = selectedYear === viewYear && selectedMonth === monthNum;
              const isCurrent = currentRealYear === viewYear && currentRealMonth === monthNum;

              return (
                <button
                  key={monthName}
                  type="button"
                  onClick={() => handleSelectMonth(index)}
                  aria-label={`Seleccionar ${FULL_MONTHS[index]} de ${viewYear}`}
                  aria-pressed={isSelected}
                  className={`py-2 text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-graphite-blue
                    ${isSelected 
                      ? 'bg-graphite-blue text-white shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100'}
                    ${isCurrent && !isSelected ? 'ring-1 ring-inset ring-gray-300' : ''}
                  `}
                >
                  {monthName}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
