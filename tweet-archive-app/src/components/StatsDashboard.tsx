import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Hash, AtSign, TrendingUp, Image, Link as LinkIcon, MessageCircle } from 'lucide-react';
import type { Tweet } from '../types/tweet';
import { getTweetStats } from '../lib/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface StatsDashboardProps {
  tweets: Tweet[];
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (mention: string) => void;
  onYearClick?: (year: number) => void;
}

export function StatsDashboard({ tweets, onHashtagClick, onMentionClick, onYearClick }: StatsDashboardProps) {
  const stats = getTweetStats(tweets);

  const chartData = {
    labels: stats.tweetsByYear.map((d) => d.year.toString()),
    datasets: [
      {
        label: 'Tweets per Year',
        data: stats.tweetsByYear.map((d) => d.count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_event: any, elements: any[]) => {
      if (elements && elements.length > 0 && onYearClick) {
        try {
          const index = elements[0].index;
          const year = stats.tweetsByYear[index]?.year;
          if (year && !isNaN(year)) {
            onYearClick(year);
          }
        } catch (error) {
          console.error('Error handling chart click:', error);
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Tweet Activity Timeline (Click bars to filter by year)',
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          footer: () => 'Click to filter by this year',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      intersect: true,
    },
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Tweets"
          value={stats.totalTweets.toLocaleString()}
          color="blue"
        />
        <StatCard
          icon={<Image className="w-5 h-5" />}
          label="With Media"
          value={stats.tweetsWithMedia.toLocaleString()}
          color="purple"
        />
        <StatCard
          icon={<LinkIcon className="w-5 h-5" />}
          label="With Links"
          value={stats.tweetsWithLinks.toLocaleString()}
          color="green"
        />
        <StatCard
          icon={<MessageCircle className="w-5 h-5" />}
          label="Replies"
          value={stats.replies.toLocaleString()}
          color="yellow"
        />
        <StatCard
          icon={<MessageCircle className="w-5 h-5" />}
          label="Retweets"
          value={stats.retweets.toLocaleString()}
          color="pink"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Original"
          value={stats.original.toLocaleString()}
          color="indigo"
        />
      </div>

      {/* Timeline Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div style={{ height: '300px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Top Hashtags and Mentions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Hashtags */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Top Hashtags
          </h3>
          <div className="space-y-2">
            {stats.topHashtags.slice(0, 10).map((item) => (
              <button
                key={item.tag}
                onClick={() => onHashtagClick?.(item.tag)}
                className="w-full flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  #{item.tag}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.count}
                </span>
              </button>
            ))}
            {stats.topHashtags.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hashtags found
              </p>
            )}
          </div>
        </div>

        {/* Top Mentions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AtSign className="w-5 h-5" />
            Top Mentions
          </h3>
          <div className="space-y-2">
            {stats.topMentions.slice(0, 10).map((item) => (
              <button
                key={item.mention}
                onClick={() => onMentionClick?.(item.mention)}
                className="w-full flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  @{item.mention}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.count}
                </span>
              </button>
            ))}
            {stats.topMentions.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No mentions found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple:
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    yellow:
      'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    indigo:
      'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
