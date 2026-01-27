import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data/js/tweets');
const OUTPUT_DIR = path.join(__dirname, '../public/data/tweets');
const USER_DETAILS_PATH = path.join(__dirname, '../../data/js/user_details.js');
const TWEET_INDEX_PATH = path.join(__dirname, '../../data/js/tweet_index.js');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Converting tweet data from JavaScript to JSON...\n');

// Read and convert user details
let userDetails = null;
if (fs.existsSync(USER_DETAILS_PATH)) {
  const userContent = fs.readFileSync(USER_DETAILS_PATH, 'utf-8');
  const userMatch = userContent.match(/var\s+user_details\s*=\s*(\{[\s\S]*?\});?\s*$/m);
  if (userMatch) {
    userDetails = JSON.parse(userMatch[1]);
    fs.writeFileSync(
      path.join(__dirname, '../public/data/user.json'),
      JSON.stringify(userDetails, null, 2)
    );
    console.log('✓ Converted user details');
  }
}

// Read tweet index to get list of files
let tweetIndex = [];
if (fs.existsSync(TWEET_INDEX_PATH)) {
  const indexContent = fs.readFileSync(TWEET_INDEX_PATH, 'utf-8');
  const indexMatch = indexContent.match(/var\s+tweet_index\s*=\s*(\[[\s\S]*?\]);?\s*$/m);
  if (indexMatch) {
    tweetIndex = JSON.parse(indexMatch[1]);
  }
}

// Convert each tweet file
let totalTweets = 0;
const convertedFiles = [];

for (const indexEntry of tweetIndex) {
  const filePath = path.join(__dirname, '../..', indexEntry.file_name);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ File not found: ${indexEntry.file_name}`);
    continue;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Execute the JavaScript to get the data
    // Create a mock Grailbird object to receive the data
    const Grailbird = { data: {} };

    // Use eval to execute the JavaScript (safe here as we control the source)
    eval(content);

    // Get the data from the Grailbird object
    const varName = `tweets_${indexEntry.year}_${String(indexEntry.month).padStart(2, '0')}`;
    const tweets = Grailbird.data[varName];

    if (!tweets || !Array.isArray(tweets)) {
      console.warn(`⚠ Could not extract data: ${indexEntry.file_name}`);
      continue;
    }
    totalTweets += tweets.length;

    // Write as JSON
    const outputFileName = `${indexEntry.year}_${String(indexEntry.month).padStart(2, '0')}.json`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);

    fs.writeFileSync(outputPath, JSON.stringify(tweets, null, 2));

    convertedFiles.push({
      year: indexEntry.year,
      month: indexEntry.month,
      fileName: outputFileName,
      tweetCount: tweets.length
    });

    console.log(`✓ ${outputFileName} (${tweets.length} tweets)`);
  } catch (error) {
    console.error(`✗ Error converting ${indexEntry.file_name}:`, error.message);
  }
}

// Create a new index file
const newIndex = {
  totalTweets,
  files: convertedFiles,
  user: userDetails,
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(__dirname, '../public/data/index.json'),
  JSON.stringify(newIndex, null, 2)
);

console.log(`\n✓ Conversion complete!`);
console.log(`  Total tweets: ${totalTweets}`);
console.log(`  Files converted: ${convertedFiles.length}`);
console.log(`  Output directory: ${OUTPUT_DIR}`);
