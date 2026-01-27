import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterToggle: () => void;
  showFilters: boolean;
  resultCount?: number;
  currentQuery?: string;
}

export function SearchBar({
  onSearch,
  onFilterToggle,
  showFilters,
  resultCount,
  currentQuery = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(currentQuery);

  // Update local state when parent changes query
  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tweets..."
            className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onFilterToggle}
          className={`px-4 py-3 rounded-lg border transition-colors ${
            showFilters
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          title="Toggle filters"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Search
        </button>
      </div>
      {resultCount !== undefined && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {resultCount} {resultCount === 1 ? 'tweet' : 'tweets'} found
        </p>
      )}
    </form>
  );
}
