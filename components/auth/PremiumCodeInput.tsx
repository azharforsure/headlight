import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumCodeInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
}

const PremiumCodeInput: React.FC<PremiumCodeInputProps> = ({ length = 6, value, onChange, error }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Sync value to digits
  const internalDigits = value.split('').slice(0, length);
  const digits = [...internalDigits, ...Array(length - internalDigits.length).fill('')];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join('').slice(0, length));
      return;
    }

    const char = val.slice(-1); // Take only the last character
    const newDigits = [...digits];
    newDigits[index] = char;
    
    onChange(newDigits.join('').slice(0, length));

    // Auto-focus next box
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join('').slice(0, length));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
    inputRefs.current[index]?.select();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2.5 sm:gap-4" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <div key={i} className="relative flex-1">
          <input
            ref={(el) => { if (el) inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[i]}
            onFocus={() => handleFocus(i)}
            onBlur={() => setActiveIndex(-1)}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`
              w-full aspect-[4/5] bg-white/[0.02] border rounded-2xl
              text-center text-3xl sm:text-4xl font-semibold text-white
              transition-all duration-200 outline-none
              ${activeIndex === i 
                ? 'border-[#F5364E]/60 bg-white/[0.05] shadow-[0_0_30px_rgba(245,54,78,0.1)]' 
                : 'border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]'}
              ${error ? 'border-[#F5364E] bg-[#F5364E]/5' : ''}
            `}
          />
        </div>
      ))}
    </div>
  );
};

export default PremiumCodeInput;
