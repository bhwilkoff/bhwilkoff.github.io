export interface TweetEntity {
  user_mentions: Array<{
    screen_name: string;
    name: string;
    id: number;
    id_str: string;
    indices: [number, number];
  }>;
  media?: Array<{
    id: number;
    id_str: string;
    indices: [number, number];
    media_url: string;
    media_url_https: string;
    url: string;
    display_url: string;
    expanded_url: string;
    type: string;
    sizes: {
      large: { w: number; h: number; resize: string };
      medium: { w: number; h: number; resize: string };
      small: { w: number; h: number; resize: string };
      thumb: { w: number; h: number; resize: string };
    };
  }>;
  hashtags: Array<{
    text: string;
    indices: [number, number];
  }>;
  urls: Array<{
    url: string;
    expanded_url: string | null;
    display_url: string | null;
    indices: [number, number];
  }>;
}

export interface Tweet {
  source: string;
  entities: TweetEntity;
  geo: Record<string, unknown>;
  id_str: string;
  text: string;
  id: number;
  created_at: string;
  user: {
    name: string;
    screen_name: string;
    protected: boolean;
    id_str: string;
    profile_image_url_https: string;
    id: number;
    verified: boolean;
  };
  in_reply_to_status_id?: number;
  in_reply_to_status_id_str?: string;
  in_reply_to_user_id?: number;
  in_reply_to_user_id_str?: string;
  in_reply_to_screen_name?: string;
  retweet_count?: number;
  favorite_count?: number;
  retweeted?: boolean;
  favorited?: boolean;
}

export interface TweetFileIndex {
  year: number;
  month: number;
  fileName: string;
  tweetCount: number;
}

export interface DataIndex {
  totalTweets: number;
  files: TweetFileIndex[];
  user: UserDetails | null;
  generatedAt: string;
}

export interface UserDetails {
  screen_name: string;
  location: string;
  full_name: string;
  bio: string;
  created_at: string;
}

export interface SearchFilters {
  query: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasMedia?: boolean;
  hasLinks?: boolean;
  mentionsOnly?: boolean;
}
