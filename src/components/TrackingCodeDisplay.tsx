import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Package, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TrackingCodeDisplayProps {
  orderId: string;
  onTrackingCodeGenerated?: (trackingCode: string) => void;
}

const TrackingCodeDisplay: React.FC<TrackingCodeDisplayProps> = ({
  orderId,
  onTrackingCodeGenerated
}) => {
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTrackingCode();
  }, [orderId]);

  const fetchTrackingCode = async () => {
    try {
      // Get delivery order with tracking updates
      const { data: deliveryOrder, error } = await supabase
        .from('delivery_orders')
        .select('tracking_updates')
        .eq('order_id', orderId)
        .single();

      if (error) {
        // If table doesn't exist or no delivery order found, that's okay
        console.log('No delivery order found or table not accessible:', error.message);
        setTrackingCode(null);
        return;
      }

      // Extract tracking code from tracking updates
      const trackingUpdates = deliveryOrder?.tracking_updates || [];
      const fikishaUpdate = trackingUpdates.find((update: any) => 
        update.type === 'sent_to_fikisha' && update.fikisha_tracking_code
      );

      if (fikishaUpdate?.fikisha_tracking_code) {
        setTrackingCode(fikishaUpdate.fikisha_tracking_code);
        onTrackingCodeGenerated?.(fikishaUpdate.fikisha_tracking_code);
      }
    } catch (error) {
      console.error('Error fetching tracking code:', error);
      setTrackingCode(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (trackingCode) {
      try {
        await navigator.clipboard.writeText(trackingCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy tracking code:', error);
      }
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Loading tracking code...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trackingCode) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Tracking code will be available once delivery is assigned</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="w-5 h-5 text-green-600" />
          Delivery Tracking Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-green-300">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Your tracking code is:</p>
            <div className="flex items-center justify-center gap-2 mb-3">
              <code className="text-2xl font-mono font-bold text-green-700 bg-green-100 px-4 py-2 rounded">
                {trackingCode}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-green-600">Copied to clipboard!</p>
            )}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Important Instructions:</p>
              <ul className="text-amber-700 mt-1 space-y-1">
                <li>• Keep this code safe and don't share it with anyone</li>
                <li>• Only give this code to the delivery person when they arrive</li>
                <li>• The delivery person will ask for this code to complete delivery</li>
                <li>• This code verifies that you are the correct recipient</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>Track your delivery on the Fikisha website using this code</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackingCodeDisplay;
