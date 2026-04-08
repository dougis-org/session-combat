import React, { useId } from 'react';
import { VALID_ALIGNMENTS } from '@/lib/types';

interface AlignmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Show all official D&D 5e alignment values (including "Unaligned", "Any Alignment", etc.).
   * Defaults to false, which shows only the standard 9-alignment grid for player characters. */
  showExtendedAlignments?: boolean;
}

export function AlignmentSelect({
  value,
  onChange,
  disabled = false,
  showExtendedAlignments = false,
}: AlignmentSelectProps) {
  const alignments = showExtendedAlignments ? VALID_ALIGNMENTS : VALID_ALIGNMENTS.slice(0, 9);
  const selectId = useId();

  return (
    <>
      <label htmlFor={selectId} className="block mb-1 text-sm font-bold">
        Alignment
      </label>
      <select
        id={selectId}
        aria-label="Alignment"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-gray-700 rounded px-3 py-2 text-white"
      >
        <option value="">Select Alignment</option>
        {alignments.map((alignment) => (
          <option key={alignment} value={alignment}>
            {alignment}
          </option>
        ))}
      </select>
    </>
  );
}
