import { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, Globe, Twitter, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Tweet } from '../types/tweet';
import { TweetCard } from './TweetCard';
import { parseTwitterDate } from '../lib/utils';
import { worldEvents, getEventsInRange, getCategoryColor, type WorldEvent } from '../data/worldEvents';

interface TimelineProps {
  tweets: Tweet[];
  onTweetClick?: (tweetId: string) => void;
}

interface TimelineItem {
  type: 'tweet' | 'event';
  date: Date;
  data: Tweet | WorldEvent;
}

export function Timeline({ tweets, onTweetClick }: TimelineProps) {
  const [viewportStart, setViewportStart] = useState<Date>(new Date());
  const [viewportEnd, setViewportEnd] = useState<Date>(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = max zoom, 100 = min zoom
  const [scrollPosition, setScrollPosition] = useState(0);

  // Calculate date range of all tweets
  const dateRange = useMemo(() => {
    if (tweets.length === 0) return { start: new Date(), end: new Date() };

    const dates = tweets.map(t => parseTwitterDate(t.created_at).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    return { start: minDate, end: maxDate };
  }, [tweets]);

  // Calculate total days in timeline
  const totalDays = useMemo(() => {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / msPerDay);
  }, [dateRange]);

  // Calculate pixels per day based on zoom level
  // Zoom level 1 = 100px per day (max zoom - reduced for performance)
  // Zoom level 100 = 2px per day (min zoom)
  const pixelsPerDay = useMemo(() => {
    const maxPixels = 100; // Max zoom: 100px per day (reduced from 1000)
    const minPixels = 2;    // Min zoom: 2px per day

    // Exponential scale feels more natural
    const ratio = (zoomLevel - 1) / (100 - 1);
    return maxPixels * Math.pow(minPixels / maxPixels, ratio);
  }, [zoomLevel]);

  // Calculate total timeline width in pixels
  const timelineWidth = useMemo(() => {
    return totalDays * pixelsPerDay;
  }, [totalDays, pixelsPerDay]);

  // Initialize viewport to start of timeline (fully zoomed in)
  useEffect(() => {
    if (tweets.length > 0 && scrollContainerRef.current) {
      // Initialize viewport to show first week/days
      const msPerDay = 1000 * 60 * 60 * 24;
      const containerWidth = scrollContainerRef.current.clientWidth;
      const viewportDays = containerWidth / pixelsPerDay;
      const bufferDays = viewportDays * 2;

      const newStart = dateRange.start;
      const newEnd = new Date(dateRange.start.getTime() + (viewportDays + bufferDays) * msPerDay);

      setViewportStart(newStart);
      setViewportEnd(newEnd);

      // Start at the beginning, zoomed in
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = 0;
        }
      }, 100);
    }
  }, [tweets.length, dateRange.start, pixelsPerDay]);

  // Combine tweets and events into timeline items
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add tweets in viewport
    tweets.forEach(tweet => {
      const tweetDate = parseTwitterDate(tweet.created_at);
      if (tweetDate >= viewportStart && tweetDate <= viewportEnd) {
        items.push({
          type: 'tweet',
          date: tweetDate,
          data: tweet
        });
      }
    });

    // Add events in viewport
    const eventsInRange = getEventsInRange(viewportStart, viewportEnd);
    eventsInRange.forEach(event => {
      items.push({
        type: 'event',
        date: new Date(event.date),
        data: event
      });
    });

    // Sort by date (oldest first)
    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    return items;
  }, [tweets, viewportStart, viewportEnd]);

  // Get appropriate scale markers based on zoom level and pixel density
  const getScaleMarkers = useMemo(() => {
    const markers: Array<{ date: Date; label: string; type: 'major' | 'minor' }> = [];

    // Determine marker interval based on pixels per day
    let interval: 'hour' | 'day' | 'week' | 'month' | 'year';
    let step = 1;

    if (pixelsPerDay > 500) {
      // Super zoomed in - show hours
      interval = 'hour';
      step = 6; // Every 6 hours
    } else if (pixelsPerDay > 100) {
      // Very zoomed in - show every day
      interval = 'day';
      step = 1;
    } else if (pixelsPerDay > 20) {
      // Zoomed in - show weeks
      interval = 'week';
      step = 1;
    } else if (pixelsPerDay > 5) {
      // Medium zoom - show months
      interval = 'month';
      step = 1;
    } else {
      // Zoomed out - show years
      interval = 'year';
      step = 1;
    }

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    let currentDate = new Date(startDate);

    if (interval === 'year') {
      currentDate = new Date(currentDate.getFullYear(), 0, 1);
      while (currentDate <= endDate) {
        markers.push({
          date: new Date(currentDate),
          label: currentDate.getFullYear().toString(),
          type: 'major'
        });
        currentDate.setFullYear(currentDate.getFullYear() + step);
      }
    } else if (interval === 'month') {
      currentDate.setDate(1);
      while (currentDate <= endDate) {
        const isYearStart = currentDate.getMonth() === 0;
        markers.push({
          date: new Date(currentDate),
          label: currentDate.toLocaleDateString('en-US', {
            month: 'short',
            year: isYearStart ? 'numeric' : undefined
          }),
          type: isYearStart ? 'major' : 'minor'
        });
        currentDate.setMonth(currentDate.getMonth() + step);
      }
    } else if (interval === 'week') {
      // Align to start of week (Sunday)
      currentDate.setDate(currentDate.getDate() - currentDate.getDay());
      while (currentDate <= endDate) {
        const isMonthStart = currentDate.getDate() <= 7;
        markers.push({
          date: new Date(currentDate),
          label: currentDate.toLocaleDateString('en-US', {
            month: isMonthStart ? 'short' : undefined,
            day: 'numeric'
          }),
          type: isMonthStart ? 'major' : 'minor'
        });
        currentDate.setDate(currentDate.getDate() + 7 * step);
      }
    } else if (interval === 'day') {
      while (currentDate <= endDate) {
        const isMonthStart = currentDate.getDate() === 1;
        markers.push({
          date: new Date(currentDate),
          label: currentDate.toLocaleDateString('en-US', {
            month: isMonthStart ? 'short' : undefined,
            day: 'numeric'
          }),
          type: isMonthStart ? 'major' : 'minor'
        });
        currentDate.setDate(currentDate.getDate() + step);
      }
    } else if (interval === 'hour') {
      while (currentDate <= endDate) {
        const isMidnight = currentDate.getHours() === 0;
        markers.push({
          date: new Date(currentDate),
          label: currentDate.toLocaleTimeString('en-US', {
            month: isMidnight ? 'short' : undefined,
            day: isMidnight ? 'numeric' : undefined,
            hour: 'numeric',
            minute: '2-digit'
          }),
          type: isMidnight ? 'major' : 'minor'
        });
        currentDate.setHours(currentDate.getHours() + step);
      }
    }

    return markers;
  }, [pixelsPerDay, dateRange.start, dateRange.end]);

  // Calculate position on timeline in pixels
  const getPositionPixels = (date: Date): number => {
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysFromStart = (date.getTime() - dateRange.start.getTime()) / msPerDay;
    return daysFromStart * pixelsPerDay;
  };

  // Navigate timeline - move by a percentage of viewport width for faster navigation
  const navigate = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const containerWidth = scrollContainerRef.current.clientWidth;
    const scrollAmount = containerWidth * 0.75; // Scroll 75% of viewport width

    if (direction === 'left') {
      scrollContainerRef.current.scrollLeft -= scrollAmount;
    } else {
      scrollContainerRef.current.scrollLeft += scrollAmount;
    }
  };

  // Handle scroll to update viewport (debounced for performance)
  const handleScroll = useMemo(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return () => {
      if (!scrollContainerRef.current) return;

      // Clear previous timeout
      clearTimeout(timeoutId);

      // Debounce scroll updates
      timeoutId = setTimeout(() => {
        if (!scrollContainerRef.current) return;

        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const containerWidth = scrollContainerRef.current.clientWidth;

        // Calculate viewport dates based on scroll position
        // Add buffer zone (2x viewport width on each side) for smooth scrolling
        const msPerDay = 1000 * 60 * 60 * 24;
        const bufferDays = (containerWidth * 2) / pixelsPerDay;
        const startDays = Math.max(0, (scrollLeft / pixelsPerDay) - bufferDays);
        const endDays = ((scrollLeft + containerWidth) / pixelsPerDay) + bufferDays;

        const newStart = new Date(dateRange.start.getTime() + startDays * msPerDay);
        const newEnd = new Date(dateRange.start.getTime() + endDays * msPerDay);

        setViewportStart(newStart);
        setViewportEnd(newEnd);
        setScrollPosition(scrollLeft);
      }, 50); // 50ms debounce
    };
  }, [pixelsPerDay, dateRange.start]);

  // Zoom controls - zoom level from 1 (max zoom) to 100 (min zoom)
  const zoomIn = () => {
    if (zoomLevel > 1) {
      const newZoom = Math.max(1, zoomLevel * 0.7); // Zoom in by 30%

      // Keep the center point the same
      const center = new Date((viewportStart.getTime() + viewportEnd.getTime()) / 2);

      setZoomLevel(newZoom);

      // After zoom level changes, scroll to keep center in view
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const centerPixels = getPositionPixels(center);
          const containerWidth = scrollContainerRef.current.clientWidth;
          scrollContainerRef.current.scrollLeft = centerPixels - containerWidth / 2;
        }
      }, 0);
    }
  };

  const zoomOut = () => {
    if (zoomLevel < 100) {
      const newZoom = Math.min(100, zoomLevel / 0.7); // Zoom out by 30%

      // Keep the center point the same
      const center = new Date((viewportStart.getTime() + viewportEnd.getTime()) / 2);

      setZoomLevel(newZoom);

      // After zoom level changes, scroll to keep center in view
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const centerPixels = getPositionPixels(center);
          const containerWidth = scrollContainerRef.current.clientWidth;
          scrollContainerRef.current.scrollLeft = centerPixels - containerWidth / 2;
        }
      }, 0);
    }
  };

  if (tweets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No tweets to display in timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-500" />
              Interactive Timeline
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Scrub through your tweets with world events context
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {viewportStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' - '}
              {viewportEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Viewing {zoomLevel} days
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('left')}
            disabled={scrollPosition <= 0}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Navigate left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-2">
            <button
              onClick={zoomIn}
              disabled={zoomLevel <= 1}
              className="px-3 py-1 text-sm rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zoom In
            </button>
            <button
              onClick={zoomOut}
              disabled={zoomLevel >= 100}
              className="px-3 py-1 text-sm rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zoom Out
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Zoom: {Math.round((101 - zoomLevel))}% | {Math.round(pixelsPerDay)}px/day
            </div>
          </div>

          <button
            onClick={() => navigate('right')}
            disabled={scrollContainerRef.current ? scrollPosition >= (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth) : false}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Navigate right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span>Your Tweets</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Politics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Technology</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Culture</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Science</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Economics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Sports</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Disasters</span>
          </div>
        </div>

        {/* Main Zoomable Timeline */}
        <div className="mt-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Main Timeline - Use arrow buttons to navigate, or scroll/drag with mouse/trackpad
          </div>
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto overflow-y-hidden bg-gray-100 dark:bg-gray-900 rounded-lg p-6 cursor-grab active:cursor-grabbing"
            onScroll={handleScroll}
            style={{ height: '250px' }}
          >
            <div
              className="relative bg-gray-200 dark:bg-gray-800 rounded"
              style={{ width: `${timelineWidth}px`, height: '200px' }}
            >
              {/* Timeline track */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-700 transform -translate-y-1/2"></div>

              {/* Dynamic scale markers */}
              {getScaleMarkers.map((marker, idx) => {
                const position = getPositionPixels(marker.date);
                const isMajor = marker.type === 'major';

                return (
                  <div
                    key={`marker-${idx}`}
                    className="absolute top-0 bottom-0 flex flex-col items-center justify-center pointer-events-none"
                    style={{ left: `${position}px` }}
                  >
                    <div className={`w-px h-full ${isMajor ? 'bg-gray-400 dark:bg-gray-600' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                    <div className={`absolute top-2 text-xs ${isMajor ? 'font-semibold' : 'font-normal'} text-gray-600 dark:text-gray-400 whitespace-nowrap`}>
                      {marker.label}
                    </div>
                  </div>
                );
              })}

              {/* Event markers - Only render visible items in viewport */}
              {worldEvents.map((event, idx) => {
                const eventDate = new Date(event.date);
                // Only render events within viewport (with buffer for smooth scrolling)
                if (eventDate >= viewportStart && eventDate <= viewportEnd) {
                  const position = getPositionPixels(eventDate);
                  const color = getCategoryColor(event.category);
                  const colorClass = {
                    blue: 'bg-blue-500',
                    red: 'bg-red-500',
                    purple: 'bg-purple-500',
                    green: 'bg-green-500',
                    yellow: 'bg-yellow-500',
                    orange: 'bg-orange-500',
                    gray: 'bg-gray-500'
                  };

                  // Scale dot size based on zoom level
                  const dotSize = Math.min(Math.max(pixelsPerDay / 50, 4), 20);

                  return (
                    <div
                      key={`event-${idx}`}
                      className={`absolute top-1/2 rounded-full ${colorClass[color as keyof typeof colorClass]} transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-150 transition-transform shadow-lg`}
                      style={{
                        left: `${position}px`,
                        width: `${dotSize}px`,
                        height: `${dotSize}px`
                      }}
                      title={event.title}
                    ></div>
                  );
                }
                return null;
              })}

              {/* Tweet markers - Only render visible items in viewport */}
              {tweets.map((tweet) => {
                const tweetDate = parseTwitterDate(tweet.created_at);
                // Only render tweets within viewport (with buffer for smooth scrolling)
                if (tweetDate >= viewportStart && tweetDate <= viewportEnd) {
                  const position = getPositionPixels(tweetDate);

                  // Scale dot size based on zoom level (slightly smaller than events)
                  const dotSize = Math.min(Math.max(pixelsPerDay / 70, 3), 15);

                  return (
                    <div
                      key={`tweet-marker-${tweet.id_str}`}
                      className="absolute top-1/2 rounded-full bg-blue-400 transform -translate-x-1/2 -translate-y-1/2 shadow"
                      style={{
                        left: `${position}px`,
                        width: `${dotSize}px`,
                        height: `${dotSize}px`
                      }}
                      title="Tweet"
                    ></div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Content - Events and Tweets */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {timelineItems.filter(i => i.type === 'tweet').length} Tweets • {timelineItems.filter(i => i.type === 'event').length} Events
            </div>
          </div>
        </div>

        {timelineItems.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No tweets or events in this time period. Try adjusting the timeline view.
            </p>
          </div>
        )}

        {timelineItems.map((item, index) => {
          if (item.type === 'event') {
            const event = item.data as WorldEvent;
            const color = getCategoryColor(event.category);
            const colorClasses = {
              blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
              red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
              purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
              green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
              yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
              orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
              gray: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
            };

            const EventContent = (
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      {event.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    {event.wikipedia && (
                      <span className="text-xs text-blue-500 dark:text-blue-400">
                        → Wikipedia
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {event.description}
                  </p>
                </div>
              </div>
            );

            if (event.wikipedia) {
              return (
                <a
                  key={`item-${index}`}
                  href={event.wikipedia}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block rounded-lg border-l-4 p-4 ${colorClasses[color as keyof typeof colorClasses]} hover:shadow-md transition-shadow cursor-pointer`}
                >
                  {EventContent}
                </a>
              );
            }

            return (
              <div
                key={`item-${index}`}
                className={`rounded-lg border-l-4 p-4 ${colorClasses[color as keyof typeof colorClasses]}`}
              >
                {EventContent}
              </div>
            );
          } else {
            const tweet = item.data as Tweet;
            return (
              <div key={`item-${index}`} className="flex items-start gap-3">
                <Twitter className="w-5 h-5 mt-4 flex-shrink-0 text-blue-400" />
                <div className="flex-1">
                  <TweetCard tweet={tweet} onTweetClick={onTweetClick} />
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
