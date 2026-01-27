import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Tweet, DataIndex } from '../types/tweet';

// Define the shape of metadata records (for in-line keys)
interface MetadataRecord {
  key: string;
  value: DataIndex | boolean;
}

interface TweetDB extends DBSchema {
  tweets: {
    key: string;
    value: Tweet;
    indexes: {
      'by-date': string;
      'by-year': number;
      'by-month': string;
      'has-media': number;
      'has-links': number;
    };
  };
  metadata: {
    key: string;
    value: MetadataRecord;
  };
}

const DB_NAME = 'tweet-archive';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<TweetDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<TweetDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<TweetDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create tweets store
      const tweetStore = db.createObjectStore('tweets', {
        keyPath: 'id_str',
      });

      // Create indexes for efficient querying
      tweetStore.createIndex('by-date', 'created_at');
      tweetStore.createIndex('by-year', 'created_at'); // We'll extract year from date
      tweetStore.createIndex('by-month', 'created_at'); // We'll store as YYYY-MM
      tweetStore.createIndex('has-media', 'created_at'); // Store 1 if has media, 0 otherwise
      tweetStore.createIndex('has-links', 'created_at'); // Store 1 if has links, 0 otherwise

      // Create metadata store
      db.createObjectStore('metadata', {
        keyPath: 'key',
      });
    },
  });

  return dbInstance;
}

export async function isDataLoaded(): Promise<boolean> {
  const db = await getDB();
  const record = await db.get('metadata', 'loaded');
  return record?.value === true;
}

export async function loadTweetsFromJSON(): Promise<void> {
  const db = await getDB();

  // Check if already loaded
  if (await isDataLoaded()) {
    console.log('Tweets already loaded in IndexedDB');
    return;
  }

  console.log('Loading tweets into IndexedDB...');

  // Fetch the index
  const indexResponse = await fetch('/data/index.json');
  const index: DataIndex = await indexResponse.json();

  // Store metadata (wrap in object with key and value properties for in-line keys)
  await db.put('metadata', { key: 'index', value: index });

  let loadedCount = 0;
  const totalFiles = index.files.length;

  // Load tweets in batches
  for (let i = 0; i < totalFiles; i += 5) {
    const batch = index.files.slice(i, i + 5);

    const promises = batch.map(async (file) => {
      const response = await fetch(`/data/tweets/${file.fileName}`);
      const tweets: Tweet[] = await response.json();

      // Use a transaction to add all tweets from this file
      const tx = db.transaction('tweets', 'readwrite');
      const store = tx.objectStore('tweets');

      for (const tweet of tweets) {
        await store.put(tweet);
        loadedCount++;
      }

      await tx.done;

      console.log(`Loaded ${file.fileName} (${loadedCount}/${index.totalTweets} tweets)`);
    });

    await Promise.all(promises);
  }

  // Mark as loaded (wrap in object with key property for in-line keys)
  await db.put('metadata', { key: 'loaded', value: true });

  console.log(`✓ Loaded all ${loadedCount} tweets into IndexedDB`);
}

export async function getAllTweets(): Promise<Tweet[]> {
  const db = await getDB();
  return await db.getAll('tweets');
}

export async function getTweetsByDateRange(
  from: Date,
  to: Date
): Promise<Tweet[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound(from.toISOString(), to.toISOString());
  return await db.getAllFromIndex('tweets', 'by-date', range);
}

export async function searchTweets(query: string): Promise<Tweet[]> {
  const db = await getDB();
  const allTweets = await db.getAll('tweets');

  if (!query) {
    return allTweets;
  }

  const lowerQuery = query.toLowerCase();

  return allTweets.filter((tweet) => {
    // Search in tweet text (support both full_text and text fields)
    const tweetText = tweet.full_text || tweet.text || '';
    if (tweetText.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in hashtags
    if (
      tweet.entities.hashtags.some((tag) =>
        tag.text.toLowerCase().includes(lowerQuery)
      )
    ) {
      return true;
    }

    // Search in mentions
    if (
      tweet.entities.user_mentions.some(
        (mention) =>
          mention.screen_name.toLowerCase().includes(lowerQuery) ||
          mention.name.toLowerCase().includes(lowerQuery)
      )
    ) {
      return true;
    }

    // Search in URLs
    if (
      tweet.entities.urls.some(
        (url) =>
          url.expanded_url?.toLowerCase().includes(lowerQuery) ||
          url.display_url?.toLowerCase().includes(lowerQuery)
      )
    ) {
      return true;
    }

    return false;
  });
}

export async function getDataIndex(): Promise<DataIndex | undefined> {
  const db = await getDB();
  const record = await db.get('metadata', 'index');
  return record?.value as DataIndex | undefined;
}

export async function clearDatabase(): Promise<void> {
  const db = await getDB();
  await db.clear('tweets');
  await db.clear('metadata');
  console.log('Database cleared');
}
