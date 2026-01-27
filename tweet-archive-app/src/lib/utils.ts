import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { Tweet } from '../types/tweet';

// Parse Twitter's date format: "Mon Apr 25 15:25:57 +0000 2022"
// Safari is strict about date formats, so we need to convert to ISO format
function parseTwitterDate(dateString: string): Date {
  // Try ISO format first (for compatibility)
  try {
    const isoDate = parseISO(dateString);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
  } catch (e) {
    // Fall through to Twitter format
  }

  // Parse Twitter format - Safari-compatible approach
  // Format: "Mon Apr 25 15:25:57 +0000 2022"
  // Convert to ISO: "2022-04-25T15:25:57.000Z"
  const parts = dateString.split(' ');
  if (parts.length >= 6) {
    const months: { [key: string]: string } = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };

    const month = months[parts[1]];
    const day = parts[2].padStart(2, '0');
    const time = parts[3];
    const year = parts[5];

    if (month && time && year) {
      const isoString = `${year}-${month}-${day}T${time}.000Z`;
      return new Date(isoString);
    }
  }

  // Fallback
  return new Date(dateString);
}

export function formatTweetDate(dateString: string): string {
  const date = parseTwitterDate(dateString);
  return format(date, 'MMM d, yyyy • h:mm a');
}

export function formatRelativeDate(dateString: string): string {
  const date = parseTwitterDate(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function extractHashtags(tweet: Tweet): string[] {
  return tweet.entities.hashtags.map((tag) => tag.text);
}

export function extractMentions(tweet: Tweet): string[] {
  return tweet.entities.user_mentions.map((mention) => mention.screen_name);
}

export function extractLinks(tweet: Tweet): string[] {
  return tweet.entities.urls
    .map((url) => url.expanded_url || url.url)
    .filter(Boolean) as string[];
}

export function hasMedia(tweet: Tweet): boolean {
  return (tweet.entities.media?.length ?? 0) > 0;
}

export function hasLinks(tweet: Tweet): boolean {
  return tweet.entities.urls.length > 0;
}

export function getMediaUrls(tweet: Tweet): string[] {
  return tweet.entities.media?.map((media) => media.media_url_https) ?? [];
}

export function isReply(tweet: Tweet): boolean {
  return !!tweet.in_reply_to_status_id_str;
}

export function isRetweet(tweet: Tweet): boolean {
  const text = tweet.full_text || tweet.text || '';
  return text.startsWith('RT @');
}

// Parse the tweet text and make URLs, mentions, and hashtags clickable
export function enrichTweetText(tweet: Tweet): string {
  let text = tweet.full_text || tweet.text || '';

  // Replace URLs
  tweet.entities.urls.forEach((url) => {
    const displayUrl = url.display_url || url.url;
    const expandedUrl = url.expanded_url || url.url;
    text = text.replace(
      url.url,
      `<a href="${expandedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${displayUrl}</a>`
    );
  });

  // Replace mentions
  tweet.entities.user_mentions.forEach((mention) => {
    const mentionText = `@${mention.screen_name}`;
    text = text.replace(
      new RegExp(`@${mention.screen_name}\\b`, 'g'),
      `<a href="https://twitter.com/${mention.screen_name}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${mentionText}</a>`
    );
  });

  // Replace hashtags
  tweet.entities.hashtags.forEach((hashtag) => {
    const hashtagText = `#${hashtag.text}`;
    text = text.replace(
      new RegExp(`#${hashtag.text}\\b`, 'g'),
      `<a href="https://twitter.com/hashtag/${hashtag.text}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${hashtagText}</a>`
    );
  });

  return text;
}

// Group tweets by year-month
export function groupTweetsByMonth(tweets: Tweet[]): Map<string, Tweet[]> {
  const grouped = new Map<string, Tweet[]>();

  tweets.forEach((tweet) => {
    const date = parseTwitterDate(tweet.created_at);
    const key = format(date, 'yyyy-MM');

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)!.push(tweet);
  });

  return grouped;
}

// Get tweet statistics
export function getTweetStats(tweets: Tweet[]) {
  const totalTweets = tweets.length;
  const tweetsWithMedia = tweets.filter(hasMedia).length;
  const tweetsWithLinks = tweets.filter(hasLinks).length;
  const replies = tweets.filter(isReply).length;
  const retweets = tweets.filter(isRetweet).length;

  const allHashtags = tweets.flatMap(extractHashtags);
  const hashtagCounts = allHashtags.reduce(
    (acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topHashtags = Object.entries(hashtagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));

  const allMentions = tweets.flatMap(extractMentions);
  const mentionCounts = allMentions.reduce(
    (acc, mention) => {
      acc[mention] = (acc[mention] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topMentions = Object.entries(mentionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([mention, count]) => ({ mention, count }));

  // Group by year for timeline
  const tweetsByYear = tweets.reduce(
    (acc, tweet) => {
      const year = parseTwitterDate(tweet.created_at).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  return {
    totalTweets,
    tweetsWithMedia,
    tweetsWithLinks,
    replies,
    retweets,
    original: totalTweets - replies - retweets,
    topHashtags,
    topMentions,
    tweetsByYear: Object.entries(tweetsByYear)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year),
  };
}
