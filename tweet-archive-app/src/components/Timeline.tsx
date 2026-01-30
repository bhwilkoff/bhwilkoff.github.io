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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(30); // days to show
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
  // More zoom = more pixels per day = wider timeline
  const pixelsPerDay = useMemo(() => {
    // At zoom level 7 (max zoom), use 150 pixels per day
    // At zoom level 365 (min zoom), use 3 pixels per day
    const maxZoom = 7;
    const minZoom = 365;
    const maxPixels = 150;
    const minPixels = 3;

    // Linear interpolation
    const zoomRatio = (zoomLevel - minZoom) / (maxZoom - minZoom);
    return minPixels + (maxPixels - minPixels) * (1 - zoomRatio);
  }, [zoomLevel]);

  // Calculate total timeline width in pixels
  const timelineWidth = useMemo(() => {
    return totalDays * pixelsPerDay;
  }, [totalDays, pixelsPerDay]);

  // Initialize viewport to most recent tweets
  useEffect(() => {
    if (tweets.length > 0 && scrollContainerRef.current) {
      // Scroll to the end (most recent)
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = timelineWidth;
        }
      }, 100);
    }
  }, [tweets.length, timelineWidth]);

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

  // Get appropriate scale markers based on zoom level
  const getScaleMarkers = useMemo(() => {
    const markers: Array<{ date: Date; label: string; type: 'major' | 'minor' }> = [];

    if (zoomLevel >= 365) {
      // Show years
      for (let year = dateRange.start.getFullYear(); year <= dateRange.end.getFullYear(); year++) {
        markers.push({
          date: new Date(year, 0, 1),
          label: year.toString(),
          type: 'major'
        });
      }
    } else if (zoomLevel >= 90) {
      // Show months
      const startDate = new Date(viewportStart);
      startDate.setDate(1);
      const endDate = new Date(viewportEnd);

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        markers.push({
          date: new Date(currentDate),
          label: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          type: currentDate.getMonth() === 0 ? 'major' : 'minor'
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    } else if (zoomLevel >= 30) {
      // Show weeks
      const startDate = new Date(viewportStart);
      const endDate = new Date(viewportEnd);

      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week

      let weekNum = 0;
      while (currentDate <= endDate) {
        const isMonthStart = currentDate.getDate() <= 7;
        markers.push({
          date: new Date(currentDate),
          label: isMonthStart
            ? currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : currentDate.toLocaleDateString('en-US', { day: 'numeric' }),
          type: isMonthStart ? 'major' : 'minor'
        });
        currentDate.setDate(currentDate.getDate() + 7);
        weekNum++;
      }
    } else {
      // Show days
      const startDate = new Date(viewportStart);
      const endDate = new Date(viewportEnd);

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const isMonthStart = currentDate.getDate() === 1;
        markers.push({
          date: new Date(currentDate),
          label: isMonthStart
            ? currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : currentDate.toLocaleDateString('en-US', { day: 'numeric' }),
          type: isMonthStart ? 'major' : 'minor'
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return markers;
  }, [zoomLevel, viewportStart, viewportEnd, dateRange.start, dateRange.end]);

  // Calculate position on timeline in pixels
  const getPositionPixels = (date: Date): number => {
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysFromStart = (date.getTime() - dateRange.start.getTime()) / msPerDay;
    return daysFromStart * pixelsPerDay;
  };

  // Calculate position percentage for viewport indicator on mini timeline
  const getPositionPercent = (date: Date): number => {
    const totalRange = dateRange.end.getTime() - dateRange.start.getTime();
    const position = date.getTime() - dateRange.start.getTime();
    return (position / totalRange) * 100;
  };

  // Navigate timeline
  const navigateByDays = (days: number) => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = days * pixelsPerDay;
    scrollContainerRef.current.scrollLeft += scrollAmount;
  };

  // Handle timeline scrubbing (on mini-timeline indicator)
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;

    const totalRange = dateRange.end.getTime() - dateRange.start.getTime();
    const clickDate = new Date(dateRange.start.getTime() + (totalRange * percent));

    // Scroll to center the clicked date
    const clickPixels = getPositionPixels(clickDate);
    const containerWidth = scrollContainerRef.current.clientWidth;
    scrollContainerRef.current.scrollLeft = clickPixels - containerWidth / 2;
  };

  // Handle mouse drag for scrubbing on mini-timeline
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;

    const deltaX = e.clientX - dragStart;
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Map delta on mini-timeline to scroll distance on main timeline
    const percentMove = deltaX / rect.width;
    const scrollDelta = percentMove * timelineWidth;

    scrollContainerRef.current.scrollLeft -= scrollDelta;
    setDragStart(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle scroll to update viewport
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const containerWidth = scrollContainerRef.current.clientWidth;

    // Calculate viewport dates based on scroll position
    const msPerDay = 1000 * 60 * 60 * 24;
    const startDays = scrollLeft / pixelsPerDay;
    const endDays = (scrollLeft + containerWidth) / pixelsPerDay;

    const newStart = new Date(dateRange.start.getTime() + startDays * msPerDay);
    const newEnd = new Date(dateRange.start.getTime() + endDays * msPerDay);

    setViewportStart(newStart);
    setViewportEnd(newEnd);
    setScrollPosition(scrollLeft);
  };

  // Zoom controls
  const zoomIn = () => {
    if (zoomLevel > 7) {
      const newZoom = Math.max(7, zoomLevel - 7);

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
    if (zoomLevel < 365) {
      const newZoom = Math.min(365, zoomLevel + 7);

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
            onClick={() => navigateByDays(-zoomLevel)}
            disabled={scrollPosition <= 0}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous period"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-2">
            <button
              onClick={zoomIn}
              disabled={zoomLevel <= 7}
              className="px-3 py-1 text-sm rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zoom In
            </button>
            <button
              onClick={zoomOut}
              disabled={zoomLevel >= 365}
              className="px-3 py-1 text-sm rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zoom Out
            </button>
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollLeft = timelineWidth;
                }
              }}
              className="px-3 py-1 text-sm rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
            >
              Jump to Latest
            </button>
          </div>

          <button
            onClick={() => navigateByDays(zoomLevel)}
            disabled={scrollContainerRef.current ? scrollPosition >= (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth) : false}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next period"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Timeline Bar */}
        <div
          ref={timelineRef}
          className="mt-6 bg-gray-100 dark:bg-gray-900 rounded-lg p-4 cursor-pointer select-none"
          onClick={handleTimelineClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">
            Click or drag to navigate timeline
          </div>
          <div className="relative h-16 bg-gray-200 dark:bg-gray-800 rounded">
            {/* Full timeline track */}
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-1 bg-gray-300 dark:bg-gray-700"></div>
            </div>

            {/* Viewport indicator */}
            <div
              className="absolute top-0 bottom-0 bg-blue-500/20 border-l-2 border-r-2 border-blue-500"
              style={{
                left: `${getPositionPercent(viewportStart)}%`,
                width: `${getPositionPercent(viewportEnd) - getPositionPercent(viewportStart)}%`
              }}
            ></div>

            {/* Dynamic scale markers */}
            {getScaleMarkers.map((marker, idx) => {
              const position = getPositionPercent(marker.date);
              const isMajor = marker.type === 'major';

              return (
                <div
                  key={`marker-${idx}`}
                  className="absolute top-0 bottom-0 flex flex-col items-center justify-center pointer-events-none"
                  style={{ left: `${position}%` }}
                >
                  <div className={`w-px h-full ${isMajor ? 'bg-gray-400 dark:bg-gray-600' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                  <div className={`absolute -bottom-5 text-xs ${isMajor ? 'font-semibold' : 'font-normal'} text-gray-600 dark:text-gray-400 whitespace-nowrap`}>
                    {marker.label}
                  </div>
                </div>
              );
            })}

            {/* Event markers on timeline */}
            {worldEvents.map((event, idx) => {
              const eventDate = new Date(event.date);
              if (eventDate >= dateRange.start && eventDate <= dateRange.end) {
                const position = getPositionPercent(eventDate);
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

                return (
                  <div
                    key={`event-${idx}`}
                    className={`absolute top-1 w-2 h-2 rounded-full ${colorClass[color as keyof typeof colorClass]} transform -translate-x-1/2`}
                    style={{ left: `${position}%` }}
                    title={event.title}
                  ></div>
                );
              }
              return null;
            })}

            {/* Tweet markers on timeline */}
            {tweets.map((tweet) => {
              const tweetDate = parseTwitterDate(tweet.created_at);
              if (tweetDate >= dateRange.start && tweetDate <= dateRange.end) {
                const position = getPositionPercent(tweetDate);

                return (
                  <div
                    key={`tweet-marker-${tweet.id_str}`}
                    className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-blue-400 transform -translate-x-1/2"
                    style={{ left: `${position}%` }}
                    title="Tweet"
                  ></div>
                );
              }
              return null;
            })}
          </div>
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

        {/* Scrollable Horizontal Timeline */}
        <div className="mt-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Horizontally scrollable timeline (scroll or drag to navigate)
          </div>
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto overflow-y-hidden bg-gray-100 dark:bg-gray-900 rounded-lg p-4"
            onScroll={handleScroll}
            style={{ height: '120px' }}
          >
            <div
              className="relative bg-gray-200 dark:bg-gray-800 rounded"
              style={{ width: `${timelineWidth}px`, height: '80px' }}
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

              {/* Event markers */}
              {worldEvents.map((event, idx) => {
                const eventDate = new Date(event.date);
                if (eventDate >= dateRange.start && eventDate <= dateRange.end) {
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

                  return (
                    <div
                      key={`event-${idx}`}
                      className={`absolute top-1/2 w-3 h-3 rounded-full ${colorClass[color as keyof typeof colorClass]} transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-150 transition-transform`}
                      style={{ left: `${position}px` }}
                      title={event.title}
                    ></div>
                  );
                }
                return null;
              })}

              {/* Tweet markers */}
              {tweets.map((tweet) => {
                const tweetDate = parseTwitterDate(tweet.created_at);
                if (tweetDate >= dateRange.start && tweetDate <= dateRange.end) {
                  const position = getPositionPixels(tweetDate);

                  return (
                    <div
                      key={`tweet-marker-${tweet.id_str}`}
                      className="absolute top-1/2 w-2 h-2 rounded-full bg-blue-400 transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${position}px` }}
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
