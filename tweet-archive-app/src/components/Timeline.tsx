import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Globe, TrendingUp } from 'lucide-react';
import type { Tweet } from '../types/tweet';
import { TweetCard } from './TweetCard';
import { parseTwitterDate } from '../lib/utils';
import { getEventsForMonth, getCategoryColor, type WorldEvent } from '../data/worldEvents';

interface TimelineProps {
  tweets: Tweet[];
  onTweetClick?: (tweetId: string) => void;
}

interface MonthData {
  year: number;
  month: number;
  tweets: Tweet[];
  events: WorldEvent[];
  label: string;
}

export function Timeline({ tweets, onTweetClick }: TimelineProps) {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [showEvents, setShowEvents] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Group tweets by month and include world events
  const monthlyData = useMemo(() => {
    const grouped = new Map<string, MonthData>();

    tweets.forEach((tweet) => {
      const date = parseTwitterDate(tweet.created_at);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!grouped.has(key)) {
        const monthDate = new Date(year, month, 1);
        grouped.set(key, {
          year,
          month,
          tweets: [],
          events: getEventsForMonth(year, month),
          label: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        });
      }

      grouped.get(key)!.tweets.push(tweet);
    });

    // Sort tweets within each month by date (newest first)
    grouped.forEach((data) => {
      data.tweets.sort(
        (a, b) =>
          parseTwitterDate(b.created_at).getTime() - parseTwitterDate(a.created_at).getTime()
      );
    });

    // Convert to array and sort by date (oldest first for timeline)
    return Array.from(grouped.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [tweets]);

  // Start at the most recent month
  useEffect(() => {
    if (monthlyData.length > 0) {
      setCurrentMonthIndex(monthlyData.length - 1);
    }
  }, [monthlyData.length]);

  const currentMonth = monthlyData[currentMonthIndex];

  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
      timelineRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex < monthlyData.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
      timelineRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToMonth = (index: number) => {
    setCurrentMonthIndex(index);
    timelineRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate total tweets up to this point
  const totalTweetsUpToNow = useMemo(() => {
    return monthlyData
      .slice(0, currentMonthIndex + 1)
      .reduce((sum, data) => sum + data.tweets.length, 0);
  }, [monthlyData, currentMonthIndex]);

  if (monthlyData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No tweets to display in timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-500" />
              Timeline
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Navigate through your tweeting history with world events context
            </p>
          </div>
          <button
            onClick={() => setShowEvents(!showEvents)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              showEvents
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Globe className="w-4 h-4" />
            {showEvents ? 'Hide' : 'Show'} World Events
          </button>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            disabled={currentMonthIndex === 0}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <select
              value={currentMonthIndex}
              onChange={(e) => handleJumpToMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthlyData.map((data, index) => (
                <option key={`${data.year}-${data.month}`} value={index}>
                  {data.label} ({data.tweets.length} tweets)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            disabled={currentMonthIndex === monthlyData.length - 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>
              Month {currentMonthIndex + 1} of {monthlyData.length}
            </span>
            <span>
              {totalTweetsUpToNow.toLocaleString()} of {tweets.length.toLocaleString()} tweets
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentMonthIndex + 1) / monthlyData.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Current month content */}
      {currentMonth && (
        <div ref={timelineRef} className="space-y-6">
          {/* World Events Section */}
          {showEvents && currentMonth.events.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  World Events in {currentMonth.label}
                </h3>
              </div>
              <div className="space-y-3">
                {currentMonth.events.map((event, index) => {
                  const color = getCategoryColor(event.category);
                  const colorClasses = {
                    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
                    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
                    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
                    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
                    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
                    gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700',
                  };

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium uppercase tracking-wide opacity-75">
                              {event.category}
                            </span>
                            <span className="text-xs opacity-50">
                              {new Date(event.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <h4 className="font-semibold mb-1">{event.title}</h4>
                          <p className="text-sm opacity-90">{event.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monthly Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Activity in {currentMonth.label}
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {currentMonth.tweets.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tweets</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {currentMonth.tweets.filter((t) => t.entities.media?.length).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">With Media</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {currentMonth.tweets.filter((t) => t.entities.urls.length).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">With Links</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {currentMonth.tweets.reduce(
                    (sum, t) => sum + (t.favorite_count || 0) + (t.retweet_count || 0),
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Engagement</div>
              </div>
            </div>
          </div>

          {/* Tweets */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tweets ({currentMonth.tweets.length})
            </h3>
            <div className="space-y-4">
              {currentMonth.tweets.map((tweet) => (
                <TweetCard key={tweet.id_str} tweet={tweet} onTweetClick={onTweetClick} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mini timeline navigation at bottom */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
          Quick Jump
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {monthlyData.map((data, index) => (
            <button
              key={`${data.year}-${data.month}`}
              onClick={() => handleJumpToMonth(index)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                index === currentMonthIndex
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={`${data.label} - ${data.tweets.length} tweets`}
            >
              {data.year}-{String(data.month + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
