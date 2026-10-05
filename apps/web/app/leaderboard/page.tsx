"use client";

import { useState } from "react";

type LeaderboardEntry = {
  teamId: string;
  code: string;
  name: string | null;
  score: number;
  goodIntervals: number;
  submissionCount: number;
  members: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  }[];
};

const dummyEvent = {
  id: "dummy-event",
  name: "DSC Hunt",
  status: "active",
};

const dummyTeam = {
  id: "team-alpha",
};

const dummyLeaderboard: LeaderboardEntry[] = [
  {
    teamId: "team-alpha",
    code: "ALPHA",
    name: "Team Alpha",
    score: 12.4,
    goodIntervals: 3,
    submissionCount: 9,
    members: [
      { id: "user-1", firstName: "Alex", lastName: "Chen" },
      { id: "user-2", firstName: "Sam", lastName: "Patel" },
    ],
  },
  {
    teamId: "team-bravo",
    code: "BRAVO",
    name: "Team Bravo",
    score: 18.7,
    goodIntervals: 2,
    submissionCount: 8,
    members: [
      { id: "user-3", firstName: "Jordan", lastName: "Lee" },
      { id: "user-4", firstName: "Taylor", lastName: "Kim" },
    ],
  },
  {
    teamId: "team-charlie",
    code: "CHARLIE",
    name: "Team Charlie",
    score: 27.2,
    goodIntervals: 1,
    submissionCount: 7,
    members: [
      { id: "user-5", firstName: "Chris", lastName: "Wong" },
    ],
  },
  {
    teamId: "team-delta",
    code: "DELTA",
    name: "Team Delta",
    score: 34.9,
    goodIntervals: 1,
    submissionCount: 6,
    members: [
      { id: "user-6", firstName: "Jamie", lastName: "Singh" },
    ],
  },
];

export default function LeaderboardPage() {
  const [leaderboard] = useState<LeaderboardEntry[]>(dummyLeaderboard);

  const event = dummyEvent;
  const team = dummyTeam;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <p className="text-xs tracking-widest text-portage-100 uppercase">
          {event.name}
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
          Leaderboard
        </h1>

        <p className="mt-2 text-sm text-portage-100">
          Lower score is better.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        <div className="grid grid-cols-[60px_1fr_1.5fr_100px] border-b border-white/10 px-5 py-3 text-xs font-medium tracking-wide text-portage-100 uppercase">
          <span>Rank</span>
          <span>Team</span>
          <span>Members</span>
          <span className="text-right">Score</span>
        </div>

        {leaderboard.map((entry, index) => (
          <div
            key={entry.teamId}
            className={`grid grid-cols-[60px_1fr_1.5fr_100px] items-center border-b border-white/5 px-5 py-4 text-sm last:border-b-0 ${
              entry.teamId === team.id ? "bg-white/10" : ""
            }`}
          >
            <span className="font-semibold text-white">
              {index + 1}
            </span>

            <div>
              <p className="font-medium text-white">
                {entry.name ?? entry.code}
              </p>

              <p className="text-xs text-portage-100">
                {entry.code}
              </p>
            </div>

            <div className="text-portage-100">
              {entry.members.map((member) => (
                <p key={member.id}>
                  {member.firstName} {member.lastName}
                </p>
              ))}
            </div>

            <span className="text-right font-semibold text-white">
              {entry.score}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
