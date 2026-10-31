import React from 'react';
import { Card, Badge, Button } from '@fic/ui';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100">
      <Card
        className="max-w-xl w-full bg-slate-800 border-slate-700 text-slate-100 shadow-2xl"
        title="FIC Business Hub — Operations & Admin Portal"
        subtitle="Verification, Configuration, Coordination & Governance"
      >
        <div className="space-y-4 text-slate-300 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="info">Admin Workspace</Badge>
            <span className="text-slate-400">Port 5174</span>
          </div>

          <p>
            Dedicated operational workspace for Super Admins, Administrators, and Verification Executives to review KYC, coordinate requests, build configurations, and manage platform audits.
          </p>

          <div className="pt-4 flex gap-3">
            <Button variant="primary">Access Console</Button>
            <Button variant="outline" className="text-slate-200 border-slate-600 hover:bg-slate-700">
              KYC Queue
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default App;
