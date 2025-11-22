import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface QRDialogProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  missionId: number;
  missionTitle: string;
}

export function QRDialog({ open, onClose, eventId, missionId, missionTitle }: QRDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && missionId !== null) {
      fetchQRCode();
    }
  }, [open, missionId]);

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:4000/api/missions/${missionId}/qr?eventId=${eventId}`
      );

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();
      setQrCodeUrl(data.qrCodeDataUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mission QR Code</DialogTitle>
          <DialogDescription>{missionTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {qrCodeUrl && !loading && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCodeUrl} alt="Mission QR Code" className="w-64 h-64" />
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>For Demo:</strong> Since we don't have QR scanner integrated, click
                  "Claim Reward" on the mission card to simulate QR scanning and claim.
                </AlertDescription>
              </Alert>

              <div className="text-xs text-muted-foreground text-center">
                QR code valid for 1 hour
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
