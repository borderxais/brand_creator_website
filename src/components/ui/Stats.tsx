interface StatsProps {
  followers: number;
  engagementRate: number;
}

export function Stats({ followers, engagementRate }: StatsProps) {
  return (
    <div className="flex space-x-6">
      <div>
        <p className="text-2xl font-bold text-gray-900">{followers.toLocaleString()}</p>
        <p className="text-sm text-gray-500">Followers</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{engagementRate.toFixed(2)}%</p>
        <p className="text-sm text-gray-500">Engagement Rate</p>
      </div>
    </div>
  );
}
