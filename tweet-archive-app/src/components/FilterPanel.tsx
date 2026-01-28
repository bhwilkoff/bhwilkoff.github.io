import { Calendar, Image, Link as LinkIcon, AtSign, X } from 'lucide-react';
import { useState } from 'react';

interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  hasMedia?: boolean;
  hasLinks?: boolean;
  mentionsOnly?: boolean;
}

interface FilterPanelProps {
  onApplyFilters: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

export function FilterPanel({ onApplyFilters, onClearFilters }: FilterPanelProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hasMedia, setHasMedia] = useState(false);
  const [hasLinks, setHasLinks] = useState(false);
  const [mentionsOnly, setMentionsOnly] = useState(false);

  const handleApply = () => {
    onApplyFilters({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      hasMedia: hasMedia || undefined,
      hasLinks: hasLinks || undefined,
      mentionsOnly: mentionsOnly || undefined,
    });
  };

  const handleClear = () => {
    setDateFrom('');
    setDateTo('');
    setHasMedia(false);
    setHasLinks(false);
    setMentionsOnly(false);
    onClearFilters();
  };

  const setDateRange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const getCurrentYear = () => new Date().getFullYear();

  const quickRanges = [
    {
      label: 'This Month',
      getValue: () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          from: firstDay.toISOString().split('T')[0],
          to: lastDay.toISOString().split('T')[0],
        };
      },
    },
    {
      label: 'Last Month',
      getValue: () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          from: firstDay.toISOString().split('T')[0],
          to: lastDay.toISOString().split('T')[0],
        };
      },
    },
    {
      label: 'This Year',
      getValue: () => ({
        from: `${getCurrentYear()}-01-01`,
        to: `${getCurrentYear()}-12-31`,
      }),
    },
    {
      label: 'Last Year',
      getValue: () => ({
        from: `${getCurrentYear() - 1}-01-01`,
        to: `${getCurrentYear() - 1}-12-31`,
      }),
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filters
        </h3>
        <button
          onClick={handleClear}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Date Range */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Calendar className="w-4 h-4" />
          Date Range
        </label>

        {/* Quick Range Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {quickRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => {
                const { from, to } = range.getValue();
                setDateRange(from, to);
              }}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content Type Filters */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
          Content Type
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasMedia}
              onChange={(e) => setHasMedia(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
            <Image className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Has media (photos/videos)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasLinks}
              onChange={(e) => setHasLinks(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
            <LinkIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Contains links
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mentionsOnly}
              onChange={(e) => setMentionsOnly(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
            <AtSign className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Contains mentions
            </span>
          </label>
        </div>
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApply}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
      >
        Apply Filters
      </button>
    </div>
  );
}
