import { Heart, MessageCircle, Repeat2 } from 'lucide-react';
import type { Tweet } from '../types/tweet';
import { formatTweetDate, enrichTweetText, getMediaUrls } from '../lib/utils';

interface TweetCardProps {
  tweet: Tweet;
}

export function TweetCard({ tweet }: TweetCardProps) {
  const mediaUrls = getMediaUrls(tweet);

  // Fallback for profile image - older tweets might have broken URLs
  const profileImageUrl = tweet.user.profile_image_url_https ||
                          'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';

  return (
    <div
      id={`tweet-${tweet.id_str}`}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start mb-3">
        <div className="flex items-start gap-3 flex-1">
          <img
            src={profileImageUrl}
            alt={tweet.user.name}
            className="w-12 h-12 rounded-full"
            onError={(e) => {
              // Fallback to default avatar if image fails to load
              e.currentTarget.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 dark:text-white truncate">
                {tweet.user.name}
              </h3>
              {tweet.user.verified && (
                <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"
                  />
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{tweet.user.screen_name}
            </p>
          </div>
        </div>
      </div>

      {/* Tweet Text */}
      <div
        className="text-gray-900 dark:text-gray-100 mb-3 whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{ __html: enrichTweetText(tweet) }}
      />

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div
          className={`grid gap-2 mb-3 ${
            mediaUrls.length === 1
              ? 'grid-cols-1'
              : mediaUrls.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-2'
          }`}
        >
          {mediaUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Media ${index + 1}`}
              className="rounded-lg w-full h-auto object-contain max-h-[500px] bg-gray-100 dark:bg-gray-900"
              loading="lazy"
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
        <span>{formatTweetDate(tweet.created_at)}</span>

        <div className="flex items-center gap-4">
          {tweet.retweet_count !== undefined && tweet.retweet_count > 0 && (
            <div className="flex items-center gap-1">
              <Repeat2 className="w-4 h-4" />
              <span>{tweet.retweet_count}</span>
            </div>
          )}
          {tweet.favorite_count !== undefined && tweet.favorite_count > 0 && (
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{tweet.favorite_count}</span>
            </div>
          )}
          {tweet.in_reply_to_status_id_str && (
            <div className="flex items-center gap-1" title="Reply">
              <MessageCircle className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
