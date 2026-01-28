import { useEffect, useState } from 'react';
import { Moon, Sun, BarChart3, Grid, List, Loader2, X } from 'lucide-react';
import type { Tweet, UserDetails } from './types/tweet';
import {
  loadTweetsFromJSON,
  getAllTweets,
  isDataLoaded,
  getDataIndex,
} from './lib/db';
import { TweetCard } from './components/TweetCard';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { StatsDashboard } from './components/StatsDashboard';
import { EnhancedAnalytics } from './components/EnhancedAnalytics';
import { hasMedia, hasLinks, parseTwitterDate } from './lib/utils';

type Tab = 'tweets' | 'analytics' | 'media';

function App() {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [activeTab, setActiveTab] = useState<Tab>('tweets');
  const [allTweets, setAllTweets] = useState<Tweet[]>([]);
  const [displayedTweets, setDisplayedTweets] = useState<Tweet[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50); // Show 50 tweets at a time
  const [currentFilters, setCurrentFilters] = useState<{
    dateFrom?: string;
    dateTo?: string;
    hasMedia?: boolean;
    hasLinks?: boolean;
    mentionsOnly?: boolean;
  }>({});

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Helper function to update URL with current state
  const updateURL = (tab: Tab, query: string, filters: typeof currentFilters) => {
    const params = new URLSearchParams();

    // Add search query first
    if (query) {
      params.set('q', query);
      // When there's a query, don't set tab param (always shows tweets)
    } else if (tab !== 'tweets') {
      // Only set tab param if no query and not the default tab
      params.set('tab', tab);
    }

    // Add filters
    if (filters.dateFrom) {
      params.set('from', filters.dateFrom);
    }
    if (filters.dateTo) {
      params.set('to', filters.dateTo);
    }
    if (filters.hasMedia) {
      params.set('media', 'true');
    }
    if (filters.hasLinks) {
      params.set('links', 'true');
    }
    if (filters.mentionsOnly) {
      params.set('mentions', 'true');
    }

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.pushState({}, '', newUrl);
  };

  // Restore state from URL on mount
  useEffect(() => {
    if (loading || allTweets.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    const tab = params.get('tab') as Tab | null;

    const filters: typeof currentFilters = {};

    if (params.has('from')) filters.dateFrom = params.get('from')!;
    if (params.has('to')) filters.dateTo = params.get('to')!;
    if (params.get('media') === 'true') filters.hasMedia = true;
    if (params.get('links') === 'true') filters.hasLinks = true;
    if (params.get('mentions') === 'true') filters.mentionsOnly = true;

    const hasFilters = Object.keys(filters).length > 0;

    // If there's a query, ALWAYS show tweets tab (ignore tab param to prevent flashing)
    if (query) {
      setActiveTab('tweets');
      setCurrentFilters(filters);
      setCurrentQuery(query);
      handleSearch(query, filters, true); // skipUrlUpdate = true
    } else if (hasFilters) {
      // Filters but no query - show tweets with filters
      setActiveTab('tweets');
      setCurrentFilters(filters);
      setCurrentQuery('');
      handleApplyFilters(filters, true); // skipUrlUpdate = true
    } else if (tab && ['tweets', 'analytics', 'media'].includes(tab)) {
      // No query or filters - honor the tab parameter
      setActiveTab(tab);
    }
  }, [allTweets.length, loading]); // Run when tweets are loaded

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const query = params.get('q') || '';
      const tab = params.get('tab') as Tab | null;

      const filters: typeof currentFilters = {};

      if (params.has('from')) filters.dateFrom = params.get('from')!;
      if (params.has('to')) filters.dateTo = params.get('to')!;
      if (params.get('media') === 'true') filters.hasMedia = true;
      if (params.get('links') === 'true') filters.hasLinks = true;
      if (params.get('mentions') === 'true') filters.mentionsOnly = true;

      setCurrentQuery(query);
      setCurrentFilters(filters);

      // If there's a query, ALWAYS show tweets tab (ignore tab param)
      if (query) {
        setActiveTab('tweets');
        handleSearch(query, filters, true); // skipUrlUpdate = true
      } else if (Object.keys(filters).length > 0) {
        setActiveTab('tweets');
        handleApplyFilters(filters, true); // skipUrlUpdate = true
      } else if (tab && ['tweets', 'analytics', 'media'].includes(tab)) {
        // No query or filters - honor the tab parameter
        setActiveTab(tab);
        setDisplayedTweets(allTweets);
      } else {
        // Default to tweets
        setActiveTab('tweets');
        setDisplayedTweets(allTweets);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [allTweets]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingProgress('Checking database...');

        const loaded = await isDataLoaded();

        if (!loaded) {
          setLoadingProgress('Loading tweets (this may take a minute)...');
          await loadTweetsFromJSON();
        }

        setLoadingProgress('Retrieving tweets...');
        const tweets = await getAllTweets();

        // Load user details
        const index = await getDataIndex();
        if (index && index.user) {
          setUserDetails(index.user);
        }

        // Sort by date (newest first)
        tweets.sort(
          (a, b) =>
            parseTwitterDate(b.created_at).getTime() - parseTwitterDate(a.created_at).getTime()
        );

        setAllTweets(tweets);
        setDisplayedTweets(tweets);
      } catch (error) {
        console.error('Error loading tweets:', error);
        setLoadingProgress('Error loading tweets. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSearch = async (query: string, filters?: typeof currentFilters, skipUrlUpdate?: boolean) => {
    setCurrentQuery(query);
    setDisplayLimit(50); // Reset to showing first 50

    // Use provided filters or fall back to current state filters
    const filtersToApply = filters !== undefined ? filters : currentFilters;

    // Update URL unless we're restoring from URL
    if (!skipUrlUpdate) {
      updateURL(activeTab, query, filtersToApply);
    }

    // Search through allTweets in memory instead of querying database
    let results = allTweets;

    if (query) {
      const searchLower = query.toLowerCase();
      results = allTweets.filter((tweet) => {
        const text = (tweet.full_text || tweet.text || '').toLowerCase();
        const userName = tweet.user.screen_name.toLowerCase();
        const userFullName = tweet.user.name.toLowerCase();

        // Check if query matches text, username, or full name
        if (text.includes(searchLower)) return true;
        if (userName.includes(searchLower)) return true;
        if (userFullName.includes(searchLower)) return true;

        // Check hashtags
        if (tweet.entities.hashtags.some(h => h.text.toLowerCase().includes(searchLower.replace('#', '')))) {
          return true;
        }

        // Check mentions
        if (tweet.entities.user_mentions.some(m =>
          m.screen_name.toLowerCase().includes(searchLower.replace('@', ''))
        )) {
          return true;
        }

        return false;
      });
    }

    // Apply filters
    results = applyFilters(results, filtersToApply);

    // Sort by date
    results.sort(
      (a, b) =>
        parseTwitterDate(b.created_at).getTime() - parseTwitterDate(a.created_at).getTime()
    );

    setDisplayedTweets(results);
  };

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 50);
  };

  const handleHashtagClick = (hashtag: string) => {
    setActiveTab('tweets');
    // Clear filters when searching by hashtag
    const newFilters = {};
    setCurrentFilters(newFilters);
    setCurrentQuery(`#${hashtag}`);
    handleSearch(`#${hashtag}`, newFilters);
  };

  const handleMentionClick = (mention: string) => {
    setActiveTab('tweets');
    // Clear filters when searching by mention
    const newFilters = {};
    setCurrentFilters(newFilters);
    setCurrentQuery(`@${mention}`);
    handleSearch(`@${mention}`, newFilters);
  };

  const handleYearClick = (year: number) => {
    setActiveTab('tweets');
    // Clear search query when filtering by year
    setCurrentQuery('');
    const yearStart = new Date(year, 0, 1).toISOString().split('T')[0];
    const yearEnd = new Date(year, 11, 31).toISOString().split('T')[0];
    setCurrentFilters({ dateFrom: yearStart, dateTo: yearEnd });
    handleApplyFilters({ dateFrom: yearStart, dateTo: yearEnd });
  };

  const handleSourceClick = (source: string) => {
    setActiveTab('tweets');
    setCurrentFilters({});
    setCurrentQuery(source);
    handleSearch(source, {});
  };

  const handleDomainClick = (domain: string) => {
    setActiveTab('tweets');
    setCurrentFilters({});
    setCurrentQuery(domain);
    handleSearch(domain, {});
  };

  const handleTweetClick = (tweetId: string) => {
    setActiveTab('tweets');
    // Update URL with tweet ID
    const params = new URLSearchParams(window.location.search);
    params.set('tweet', tweetId);
    window.history.pushState({}, '', `?${params.toString()}`);

    // Scroll to tweet
    setTimeout(() => {
      const element = document.getElementById(`tweet-${tweetId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        }, 3000);
      }
    }, 100);
  };

  const applyFilters = (
    tweets: Tweet[],
    filters: typeof currentFilters
  ): Tweet[] => {
    let filtered = tweets;

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(
        (tweet) => parseTwitterDate(tweet.created_at) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (tweet) => parseTwitterDate(tweet.created_at) <= toDate
      );
    }

    if (filters.hasMedia) {
      filtered = filtered.filter((tweet) => hasMedia(tweet));
    }

    if (filters.hasLinks) {
      filtered = filtered.filter((tweet) => hasLinks(tweet));
    }

    if (filters.mentionsOnly) {
      filtered = filtered.filter(
        (tweet) => tweet.entities.user_mentions.length > 0
      );
    }

    return filtered;
  };

  const handleApplyFilters = (filters: typeof currentFilters, skipUrlUpdate?: boolean) => {
    setCurrentFilters(filters);

    // Update URL unless we're restoring from URL
    if (!skipUrlUpdate) {
      updateURL(activeTab, currentQuery, filters);
    }

    let results = applyFilters(allTweets, filters);

    results.sort(
      (a, b) =>
        parseTwitterDate(b.created_at).getTime() - parseTwitterDate(a.created_at).getTime()
    );

    setDisplayedTweets(results);
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    setDisplayedTweets(allTweets);
  };

  const mediaTweets = allTweets.filter((tweet) => hasMedia(tweet));

  // Only show full-page loading screen on initial data load (when no tweets loaded yet)
  if (loading && allTweets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{loadingProgress}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {userDetails ? `${userDetails.full_name}'s Tweet Archive` : 'Tweet Archive'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userDetails && `@${userDetails.screen_name} • `}
                {allTweets.length.toLocaleString()} tweets
                {userDetails && ` • Joined ${parseTwitterDate(userDetails.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setActiveTab('tweets');
                updateURL('tweets', currentQuery, currentFilters);
              }}
              className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'tweets'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              All Tweets
            </button>
            <button
              onClick={() => {
                setActiveTab('analytics');
                setCurrentQuery('');
                setCurrentFilters({});
                updateURL('analytics', '', {});
              }}
              className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => {
                setActiveTab('media');
                setCurrentQuery('');
                setCurrentFilters({});
                updateURL('media', '', {});
              }}
              className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'media'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              Media ({mediaTweets.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'tweets' && (
          <>
            <div className="mb-6">
              <SearchBar
                onSearch={handleSearch}
                onFilterToggle={() => setShowFilters(!showFilters)}
                showFilters={showFilters}
                resultCount={displayedTweets.length}
                currentQuery={currentQuery}
              />

              {/* Active Filters Display */}
              {(currentQuery || Object.keys(currentFilters).length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>

                  {currentQuery && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                      <span>Search: "{currentQuery}"</span>
                      <button
                        onClick={() => {
                          setCurrentQuery('');
                          handleSearch('');
                        }}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {currentFilters.dateFrom && currentFilters.dateTo && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                      <span>Date: {new Date(currentFilters.dateFrom).toLocaleDateString()} - {new Date(currentFilters.dateTo).toLocaleDateString()}</span>
                      <button
                        onClick={() => {
                          const newFilters = { ...currentFilters };
                          delete newFilters.dateFrom;
                          delete newFilters.dateTo;
                          setCurrentFilters(newFilters);
                          handleApplyFilters(newFilters);
                        }}
                        className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {currentFilters.hasMedia && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                      <span>With media</span>
                      <button
                        onClick={() => {
                          const newFilters = { ...currentFilters };
                          delete newFilters.hasMedia;
                          setCurrentFilters(newFilters);
                          handleApplyFilters(newFilters);
                        }}
                        className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {currentFilters.hasLinks && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
                      <span>With links</span>
                      <button
                        onClick={() => {
                          const newFilters = { ...currentFilters };
                          delete newFilters.hasLinks;
                          setCurrentFilters(newFilters);
                          handleApplyFilters(newFilters);
                        }}
                        className="hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {currentFilters.mentionsOnly && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm">
                      <span>Mentions only</span>
                      <button
                        onClick={() => {
                          const newFilters = { ...currentFilters };
                          delete newFilters.mentionsOnly;
                          setCurrentFilters(newFilters);
                          handleApplyFilters(newFilters);
                        }}
                        className="hover:bg-pink-200 dark:hover:bg-pink-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {(currentQuery || Object.keys(currentFilters).length > 0) && (
                    <button
                      onClick={() => {
                        setCurrentQuery('');
                        setCurrentFilters({});
                        handleSearch('');
                      }}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <div className="space-y-4">
                  {displayedTweets.slice(0, displayLimit).map((tweet) => (
                    <TweetCard key={tweet.id_str} tweet={tweet} />
                  ))}
                  {displayedTweets.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">
                        No tweets found matching your criteria.
                      </p>
                    </div>
                  )}
                  {displayedTweets.length > displayLimit && (
                    <div className="text-center py-8">
                      <button
                        onClick={handleLoadMore}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        Load More ({displayedTweets.length - displayLimit} remaining)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {showFilters && (
                <div className="lg:col-span-1">
                  <div className="sticky top-24">
                    <FilterPanel
                      onApplyFilters={handleApplyFilters}
                      onClearFilters={handleClearFilters}
                      tweets={allTweets}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <StatsDashboard
              tweets={allTweets}
              onHashtagClick={handleHashtagClick}
              onMentionClick={handleMentionClick}
              onYearClick={handleYearClick}
            />
            <EnhancedAnalytics
              tweets={allTweets}
              onSourceClick={handleSourceClick}
              onDomainClick={handleDomainClick}
              onTweetClick={handleTweetClick}
            />
          </div>
        )}

        {activeTab === 'media' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Media Gallery
            </h2>
            <div className="space-y-4">
              {mediaTweets.slice(0, displayLimit).map((tweet) => (
                <TweetCard key={tweet.id_str} tweet={tweet} />
              ))}
              {mediaTweets.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No tweets with media found.
                  </p>
                </div>
              )}
              {mediaTweets.length > displayLimit && (
                <div className="text-center py-8">
                  <button
                    onClick={handleLoadMore}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Load More ({mediaTweets.length - displayLimit} remaining)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
