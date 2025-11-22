import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar, Coins, Trophy } from 'lucide-react';

export interface Attestation {
  eventId: string;
  eventName: string;
  missionId: number;
  missionTitle: string;
  completedAt: number;
  rewardAmount: number;
}

interface PassportCardProps {
  passportId: string;
  attestations: Attestation[];
  totalRewards: number;
}

export function PassportCard({ passportId, attestations, totalRewards }: PassportCardProps) {
  return (
    <Card className="border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              My Passport
            </CardTitle>
            <CardDescription className="mt-1 font-mono text-xs">
              {passportId.slice(0, 20)}...{passportId.slice(-10)}
            </CardDescription>
          </div>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
            Soulbound
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-400">{attestations.length}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Award className="h-3 w-3" />
              Attestations
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-400">{totalRewards.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Coins className="h-3 w-3" />
              Total SUI
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold text-purple-400">
              {new Set(attestations.map((a) => a.eventId)).size}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Events
            </div>
          </div>
        </div>

        {attestations.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent Achievements</div>
            <div className="space-y-2">
              {attestations.slice(0, 3).map((att, idx) => (
                <div
                  key={`${att.eventId}-${att.missionId}`}
                  className="flex items-start justify-between gap-2 p-2 rounded-lg bg-background/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{att.missionTitle}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {att.eventName}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-400 border-green-500/50">
                    +{att.rewardAmount} SUI
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
