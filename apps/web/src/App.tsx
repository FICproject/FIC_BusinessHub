import React from 'react';
import { Button, Card, Badge } from '@fic/ui';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <Card
        className="max-w-xl w-full shadow-lg border border-slate-200"
        title="FIC Business Hub"
        subtitle="One Platform. Unlimited Business Opportunities."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="success">System Ready</Badge>
            <span className="text-sm text-slate-500">Member Portal (Port 5173)</span>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed">
            Welcome to the FIC Business Hub member ecosystem. Connect, discover verified services, submit business ideas, explore funding readiness, and collaborate.
          </p>

          <div className="pt-4 flex gap-3">
            <Button variant="primary">Get Started</Button>
            <Button variant="outline">Browse Services</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default App;
