import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { SOP } from '@shared/schema';
import { SOPViewer } from '@/components/sop/sop-viewer';

interface MaterialSOPViewerProps {
  sopId: string;
}

export function MaterialSOPViewer({ sopId }: MaterialSOPViewerProps) {
  const { data: sop, isLoading, error } = useQuery<SOP>({
    queryKey: [`/api/sop/${sopId}`],
    enabled: !!sopId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !sop) {
    return (
      <div className="rounded-lg p-6 border border-destructive bg-destructive/10 text-center">
        <h3 className="text-lg font-semibold text-destructive mb-2">Failed to load SOP document</h3>
        <p className="text-muted-foreground">{error?.message || 'SOP document not found'}</p>
      </div>
    );
  }

  return <SOPViewer sopId={sopId} isAdmin={false} />;
}