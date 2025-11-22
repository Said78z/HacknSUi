import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { MissionCard, type Mission } from '@/components/lemanflow/MissionCard';
import { PassportCard, type Attestation } from '@/components/lemanflow/PassportCard';
import { QRDialog } from '@/components/lemanflow/QRDialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';
import { Wallet, AlertCircle, Loader2, Info } from 'lucide-react';

const API_BASE = 'http://localhost:4000';
const DEFAULT_EVENT_ID = '0x1234567890abcdef'; // Mock event ID for demo

interface PassportData {
  hasPassport: boolean;
  passportId: string | null;
  attestations: Attestation[];
  totalRewards: number;
}

export function LemanFlowDashboard() {
  const account = useCurrentAccount();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [qrDialog, setQrDialog] = useState<{
    open: boolean;
    missionId: number;
    title: string;
  }>({ open: false, missionId: 0, title: '' });

  useEffect(() => {
    if (account) {
      loginWithWallet();
    }
  }, [account]);

  useEffect(() => {
    fetchData();
  }, []);

  const loginWithWallet = async () => {
    if (!account) return;

    try {
      const response = await fetch(`${API_BASE}/api/login/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ address: account.address }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      // Fetch passport after login
      fetchPassport();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMissions(), fetchPassport()]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMissions = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/missions?eventId=${DEFAULT_EVENT_ID}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch missions');
      }

      const data = await response.json();
      setMissions(data.missions || []);
    } catch (error) {
      console.error('Failed to fetch missions:', error);
      toast.error('Failed to load missions');
    }
  };

  const fetchPassport = async () => {
    if (!account) {
      setPassport(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/passport`, {
        credentials: 'include',
      });

      if (!response.ok) {
        setPassport({
          hasPassport: false,
          passportId: null,
          attestations: [],
          totalRewards: 0,
        });
        return;
      }

      const data = await response.json();
      setPassport(data);
    } catch (error) {
      console.error('Failed to fetch passport:', error);
      setPassport(null);
    }
  };

  const handleRegisterPassport = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/passport/register`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();
      toast.success('Passport registered successfully!');

      // Refresh passport
      await fetchPassport();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register passport');
    }
  };

  const handleViewQR = (missionId: number) => {
    const mission = missions.find((m) => m.missionId === missionId);
    if (mission) {
      setQrDialog({
        open: true,
        missionId,
        title: mission.title,
      });
    }
  };

  const handleClaim = async (missionId: number) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    setClaiming(missionId);

    try {
      // For demo: Generate QR token first
      const qrResponse = await fetch(
        `${API_BASE}/api/missions/${missionId}/qr?eventId=${DEFAULT_EVENT_ID}`
      );

      if (!qrResponse.ok) {
        throw new Error('Failed to generate QR token');
      }

      const qrData = await qrResponse.json();

      // Claim mission
      const response = await fetch(`${API_BASE}/api/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eventId: DEFAULT_EVENT_ID,
          missionId,
          qrToken: qrData.token,
          autoRegisterPassport: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Claim failed');
      }

      const result = await response.json();

      if (result.mock) {
        toast.success('Mission claimed! (Mock mode - no blockchain transaction)');
      } else {
        toast.success(`Mission claimed! TX: ${result.digest.slice(0, 10)}...`);
      }

      // Update mission status
      setMissions((prev) =>
        prev.map((m) => (m.missionId === missionId ? { ...m, completed: true } : m))
      );

      // Refresh passport
      await fetchPassport();
    } catch (error: any) {
      console.error('Claim error:', error);
      toast.error(error.message || 'Failed to claim mission');
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">LémanFlow Dashboard</h1>
        <p className="text-muted-foreground">
          Complete missions to earn SUI rewards. All transactions are gasless!
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Demo Mode:</strong> Backend is running in mock mode. Connect your wallet and
          click "Claim Reward" to simulate the gasless transaction flow.
        </AlertDescription>
      </Alert>

      {/* Wallet Connection */}
      {!account && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
          <Wallet className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-600 dark:text-yellow-400">
            Connect your wallet to view and claim missions
          </AlertDescription>
        </Alert>
      )}

      {/* Passport Section */}
      {account && passport && (
        <div className="space-y-4">
          {!passport.hasPassport ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>You don't have a passport yet. Register to start earning rewards!</span>
                <Button onClick={handleRegisterPassport} size="sm">
                  Register Passport
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <PassportCard
              passportId={passport.passportId!}
              attestations={passport.attestations}
              totalRewards={passport.totalRewards}
            />
          )}
        </div>
      )}

      {/* Missions Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Missions</h2>

        {missions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No missions available yet
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {missions.map((mission) => (
              <MissionCard
                key={mission.missionId}
                mission={mission}
                onClaim={handleClaim}
                onViewQR={handleViewQR}
                claiming={claiming === mission.missionId}
              />
            ))}
          </div>
        )}
      </div>

      {/* QR Dialog */}
      <QRDialog
        open={qrDialog.open}
        onClose={() => setQrDialog({ ...qrDialog, open: false })}
        eventId={DEFAULT_EVENT_ID}
        missionId={qrDialog.missionId}
        missionTitle={qrDialog.title}
      />
    </div>
  );
}
