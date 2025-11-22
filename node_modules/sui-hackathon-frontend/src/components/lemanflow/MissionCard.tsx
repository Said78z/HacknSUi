import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Coins } from 'lucide-react';

export interface Mission {
  missionId: number;
  title: string;
  description: string;
  rewardAmount: number;
  active: boolean;
  completions: number;
  completed?: boolean;
}

interface MissionCardProps {
  mission: Mission;
  onClaim: (missionId: number) => void;
  onViewQR: (missionId: number) => void;
  claiming: boolean;
}

export function MissionCard({ mission, onClaim, onViewQR, claiming }: MissionCardProps) {
  const isCompleted = mission.completed || false;

  return (
    <Card className={isCompleted ? 'border-green-500/50 bg-green-500/5' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {mission.title}
              {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </CardTitle>
            <CardDescription className="mt-1">{mission.description}</CardDescription>
          </div>
          <Badge
            variant={isCompleted ? 'default' : 'secondary'}
            className={
              isCompleted
                ? 'bg-green-500/20 text-green-400 border-green-500/50'
                : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
            }
          >
            <Coins className="h-3 w-3 mr-1" />
            {mission.rewardAmount} SUI
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{mission.completions} completed</span>
          </div>
          {!mission.active && (
            <Badge variant="outline" className="text-orange-400 border-orange-500/50">
              Inactive
            </Badge>
          )}
        </div>
      </CardContent>

      {!isCompleted && mission.active && (
        <CardFooter className="gap-2">
          <Button
            onClick={() => onViewQR(mission.missionId)}
            variant="outline"
            className="flex-1"
          >
            View QR Code
          </Button>
          <Button
            onClick={() => onClaim(mission.missionId)}
            disabled={claiming}
            className="flex-1"
          >
            {claiming ? 'Claiming...' : 'Claim Reward'}
          </Button>
        </CardFooter>
      )}

      {isCompleted && (
        <CardFooter>
          <div className="w-full text-center text-sm text-green-400 font-medium">
            ✓ Mission Completed
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
