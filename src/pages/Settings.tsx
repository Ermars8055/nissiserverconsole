import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchApi } from '@/lib/api';
import { Copy, Check, Server, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SwarmTokens {
  worker: string | null;
  manager: string | null;
}

export default function Settings() {
  const [tokens, setTokens] = useState<SwarmTokens | null>(null);
  const [copiedWorker, setCopiedWorker] = useState(false);
  const [copiedManager, setCopiedManager] = useState(false);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const data = await fetchApi('/api/docker/swarm/tokens');
        setTokens(data);
      } catch (err) {
        console.error('Failed to load tokens', err);
      }
    };
    loadTokens();
  }, []);

  const copyToClipboard = (text: string, isManager: boolean) => {
    navigator.clipboard.writeText(text);
    if (isManager) {
      setCopiedManager(true);
      setTimeout(() => setCopiedManager(false), 2000);
    } else {
      setCopiedWorker(true);
      setTimeout(() => setCopiedWorker(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your server console preferences and cluster keys.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Network className="h-5 w-5"/> Swarm Cluster Management</CardTitle>
            <CardDescription>
              Use these cryptographic tokens to join new PCs to your Docker Swarm cluster. 
              Never share these tokens publicly!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-500" /> 
                  Add a Worker Node
                </h3>
                <p className="text-xs text-muted-foreground mb-2">Workers provide CPU and RAM to run your apps, but cannot manage the cluster.</p>
              </div>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={tokens?.worker || "Loading..."} 
                  className="font-mono text-xs bg-muted"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => tokens?.worker && copyToClipboard(tokens.worker, false)}
                  disabled={!tokens?.worker}
                >
                  {copiedWorker ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Server className="h-4 w-4 text-purple-500" /> 
                  Add a Manager Node
                </h3>
                <p className="text-xs text-muted-foreground mb-2">Managers provide High Availability and can orchestrate the entire Swarm.</p>
              </div>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={tokens?.manager || "Loading..."} 
                  className="font-mono text-xs bg-muted border-purple-500/30"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => tokens?.manager && copyToClipboard(tokens.manager, true)}
                  disabled={!tokens?.manager}
                >
                  {copiedManager ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Preferences</CardTitle>
            <CardDescription>Application settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b">
                <span>Theme</span>
                <Badge variant="outline">Dark Mode</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span>Console Version</span>
                <span className="text-muted-foreground">v1.2.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Temporary badge for the settings page
function Badge({ children, variant }: { children: React.ReactNode, variant?: string }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variant === 'outline' ? 'border-border text-foreground' : 'bg-primary text-primary-foreground'}`}>{children}</span>;
}
