"use client";

import { StatTile } from "@/components/shared/stat-tile";
import { useAdminLive } from "@/components/admin/admin-live";

/** Live counters for the admin dashboard. */
export function DashboardStats() {
  const { stats } = useAdminLive();

  if (!stats) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Couldn&apos;t load the stats. They&apos;ll appear when the live connection catches up.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile label="Teams" value={stats.teamCount} />
      <StatTile label="Players" value={stats.playerCount} />
      <StatTile label="Riddles" value={`${stats.configuredRiddles} / ${stats.totalRiddles}`} />
      <StatTile label="Scans" value={stats.scanCount} />
    </div>
  );
}
