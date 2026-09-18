import React from 'react';
import { Search, X } from 'lucide-react';

interface ResidentSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** How many residents the search is currently turning up. */
  matches: number;
  /** Overrides the default "Search a name to skip the room picker…". */
  placeholder?: string;
  className?: string;
}

/**
 * The name box that sits above a check's roster.
 *
 * It searches the whole dormitory, not the room on screen, so a dean who knows
 * a boy's name never has to work out which room he is in first. Typing takes
 * the room picker out of the way; clearing hands it back.
 */
export const ResidentSearch: React.FC<ResidentSearchProps> = ({
  value,
  onChange,
  matches,
  placeholder = 'Search a name to skip the room picker…',
  className = '',
}) => {
  const searching = value.trim().length > 0;

  return (
    <div className={className}>
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Search residents by name, room or email"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
        {searching && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 -translate-y-1/2 min-w-touch min-h-touch flex items-center justify-center text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {searching && (
        <p aria-live="polite" className="text-[11px] text-slate-400 mt-1.5">
          {matches === 0
            ? 'Nobody in the dormitory by that name.'
            : `${matches} resident${matches === 1 ? '' : 's'} across every room — clear the search to go back to one room.`}
        </p>
      )}
    </div>
  );
};
