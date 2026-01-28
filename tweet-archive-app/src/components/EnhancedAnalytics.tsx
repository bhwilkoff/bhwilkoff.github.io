import { Smartphone, Clock, TrendingUp, Link2, MessageCircle } from 'lucide-react';
import type { Tweet } from '../types/tweet';
import {
  parseSource,
  getTweetHour,
  getEngagement,
  extractDomain,
  hasLinks,
  parseTwitterDate,
  isReply,
} from '../lib/utils';

interface EnhancedAnalyticsProps {
  tweets: Tweet[];
}

export function EnhancedAnalytics({ tweets }: EnhancedAnalyticsProps) {
  // Device/Source Analysis
  const sourceData = tweets.reduce((acc, tweet) => {
    const source = parseSource(tweet.source);
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSources = Object.entries(sourceData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([source, count]) => ({ source, count, percentage: (count / tweets.length * 100).toFixed(1) }));

  // Time of Day Analysis
  const hourData = tweets.reduce((acc, tweet) => {
    const hour = getTweetHour(tweet);
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const hourLabels = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am',
                      '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'];

  const maxHourCount = Math.max(...Object.values(hourData));
  const topHours = Object.entries(hourData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([hour, count]) => ({ hour: hourLabels[parseInt(hour)], count }));

  // Top Shared Domains
  const domainData = tweets
    .filter(hasLinks)
    .flatMap(tweet => tweet.entities.urls.map(url => url.expanded_url || url.url))
    .reduce((acc, url) => {
      const domain = extractDomain(url);
      if (domain !== 'invalid-url' && domain !== 'twitter.com' && domain !== 't.co') {
        acc[domain] = (acc[domain] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

  const topDomains = Object.entries(domainData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([domain, count]) => ({ domain, count }));

  // Most Engaged Tweets
  const tweetsWithEngagement = tweets
    .filter(tweet => getEngagement(tweet) > 0)
    .sort((a, b) => getEngagement(b) - getEngagement(a))
    .slice(0, 10);

  // Conversation Analysis
  const replyData = tweets.filter(isReply);
  const replyToUsers = replyData.reduce((acc, tweet) => {
    const username = tweet.in_reply_to_screen_name;
    if (username) {
      acc[username] = (acc[username] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topReplyTargets = Object.entries(replyToUsers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([username, count]) => ({ username, count }));

  // Tweet Frequency by Day of Week
  const dayData = tweets.reduce((acc, tweet) => {
    const day = parseTwitterDate(tweet.created_at).getDay();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const maxDayCount = Math.max(...Object.values(dayData));

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Enhanced Analytics
      </h2>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Device/Source Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Devices & Apps
            </h3>
          </div>
          <div className="space-y-3">
            {topSources.map(({ source, count, percentage }) => (
              <div key={source}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {source}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{percentage}%</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time of Day Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Activity by Hour
            </h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-12 gap-1">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-full bg-purple-500 rounded-t transition-all"
                    style={{
                      height: `${((hourData[i] || 0) / maxHourCount) * 100}px`,
                      minHeight: '2px',
                    }}
                    title={`${hourLabels[i]}: ${hourData[i] || 0} tweets`}
                  />
                  {i % 3 === 0 && (
                    <span className="text-[8px] text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                      {i}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Most Active Times:</h4>
            {topHours.map(({ hour, count }) => (
              <div key={hour} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{hour}</span>
                <span className="font-medium text-gray-900 dark:text-white">{count} tweets</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Shared Domains */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Shared Domains
            </h3>
          </div>
          <div className="space-y-2">
            {topDomains.length > 0 ? (
              topDomains.map(({ domain, count }) => (
                <div key={domain} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                    {domain}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white ml-2">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No external links found</p>
            )}
          </div>
        </div>

        {/* Conversation Partners */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Most Replied To
            </h3>
          </div>
          <div className="space-y-2">
            {topReplyTargets.length > 0 ? (
              topReplyTargets.map(({ username, count }) => (
                <div key={username} className="flex justify-between items-center">
                  <span className="text-sm text-blue-500 dark:text-blue-400">
                    @{username}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {count} replies
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No replies found</p>
            )}
          </div>
        </div>
      </div>

      {/* Day of Week */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Activity by Day of Week
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {dayLabels.map((day, index) => (
            <div key={day} className="flex flex-col items-center">
              <div className="text-xs text-gray-500 mb-2">{day.slice(0, 3)}</div>
              <div
                className="w-full bg-blue-500 rounded transition-all"
                style={{
                  height: `${((dayData[index] || 0) / maxDayCount) * 120}px`,
                  minHeight: '4px',
                }}
                title={`${day}: ${dayData[index] || 0} tweets`}
              />
              <div className="text-sm font-medium text-gray-900 dark:text-white mt-2">
                {(dayData[index] || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most Engaged Tweets */}
      {tweetsWithEngagement.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Most Engaged Tweets
            </h3>
          </div>
          <div className="space-y-4">
            {tweetsWithEngagement.map((tweet) => (
              <div key={tweet.id_str} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 mb-2 line-clamp-3">
                  {tweet.full_text || tweet.text}
                </p>
                <div className="flex gap-4 text-xs text-gray-500">
                  {tweet.retweet_count! > 0 && (
                    <span>{tweet.retweet_count} retweets</span>
                  )}
                  {tweet.favorite_count! > 0 && (
                    <span>{tweet.favorite_count} likes</span>
                  )}
                  <span className="font-medium text-blue-500">
                    {getEngagement(tweet)} total
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
