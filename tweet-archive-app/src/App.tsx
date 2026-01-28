import { useEffect, useState } from 'react';
import { Moon, Sun, BarChart3, Grid, List, Loader2 } from 'lucide-react';
import type { Tweet, UserDetails } from './types/tweet';
import {
  loadTweetsFromJSON,
  searchTweets,
  getAllTweets,
  isDataLoaded,
  getDataIndex,
} from './lib/db';
import { TweetCard } from './components/TweetCard';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { StatsDashboard } from './components/StatsDashboard';
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
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

  const handleSearch = async (query: string) => {
    setLoading(true);
    setCurrentQuery(query);
    setDisplayLimit(50); // Reset to showing first 50
    try {
      let results = query ? await searchTweets(query) : allTweets;

      // Apply filters
      results = applyFilters(results, currentFilters);

      // Sort by date
      results.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setDisplayedTweets(results);
    } catch (error) {
      console.error('Error searching tweets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 50);
  };

  const handleHashtagClick = (hashtag: string) => {
    setActiveTab('tweets');
    handleSearch(`#${hashtag}`);
  };

  const handleMentionClick = (mention: string) => {
    setActiveTab('tweets');
    handleSearch(`@${mention}`);
  };

  const handleYearClick = (year: number) => {
    setActiveTab('tweets');
    const yearStart = new Date(year, 0, 1).toISOString().split('T')[0];
    const yearEnd = new Date(year, 11, 31).toISOString().split('T')[0];
    setCurrentFilters({ dateFrom: yearStart, dateTo: yearEnd });
    handleApplyFilters({ dateFrom: yearStart, dateTo: yearEnd });
  };

  const applyFilters = (
    tweets: Tweet[],
    filters: typeof currentFilters
  ): Tweet[] => {
    let filtered = tweets;

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(
        (tweet) => new Date(tweet.created_at) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (tweet) => new Date(tweet.created_at) <= toDate
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

  const handleApplyFilters = (filters: typeof currentFilters) => {
    setCurrentFilters(filters);
    let results = applyFilters(allTweets, filters);

    results.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setDisplayedTweets(results);
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    setDisplayedTweets(allTweets);
  };

  const mediaTweets = allTweets.filter((tweet) => hasMedia(tweet));

  if (loading) {
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
              onClick={() => setActiveTab('tweets')}
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
              onClick={() => setActiveTab('analytics')}
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
              onClick={() => setActiveTab('media')}
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
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <StatsDashboard
            tweets={allTweets}
            onHashtagClick={handleHashtagClick}
            onMentionClick={handleMentionClick}
            onYearClick={handleYearClick}
          />
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
