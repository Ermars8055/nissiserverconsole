import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Server, Activity, HardDrive, Cpu, AlertCircle, RefreshCw } from 'lucide-react';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';

interface HardwareStats {
  cpu_percent: number;
  mem_percent: number;
  disk_percent: number;
}

interface SwarmNode {
  id: string;
  hostname: string;
  role: string;
  availability: string;
  state: string;
  ip: string;
  engine: string;
  cpus: number;
  memory_bytes: number;
  hardware: HardwareStats;
}

interface SwarmService {
  id: string;
  name: string;
  image: string;
  mode: string;
  replicas: string | number;
  updated_at: string;
}

interface SwarmInfo {
  swarm_active: boolean;
  is_manager: boolean;
  node_id?: string;
  error?: string;
}

export default function SwarmDashboard() {
  const [info, setInfo] = useState<SwarmInfo | null>(null);
  const [nodes, setNodes] = useState<SwarmNode[]>([]);
  const [services, setServices] = useState<SwarmService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const infoRes = await fetchApi('/api/docker/swarm/info');
      setInfo(infoRes);

      if (infoRes.swarm_active && infoRes.is_manager) {
        const [nodesRes, servicesRes] = await Promise.all([
          fetchApi('/api/docker/swarm/nodes'),
          fetchApi('/api/docker/swarm/services')
        ]);
        setNodes(nodesRes);
        setServices(servicesRes);
      }
    } catch (error) {
      console.error('Failed to load swarm data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Live poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading Swarm Matrix...</div>;
  }

  if (!info?.swarm_active) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
        <AlertCircle className="h-16 w-16 text-yellow-500" />
        <h2 className="text-2xl font-bold">Docker Swarm Not Initialized</h2>
        <p className="text-muted-foreground">Run `docker swarm init` on this server to create a cluster.</p>
      </div>
    );
  }

  if (!info.is_manager) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
        <Server className="h-16 w-16 text-blue-500" />
        <h2 className="text-2xl font-bold">Worker Node</h2>
        <p className="text-muted-foreground">This server is a worker. Please access the Nissi Console from your Swarm Manager to view the full cluster.</p>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Swarm Cluster</h1>
          <p className="text-muted-foreground">Live visualization of your distributed datacenter.</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {nodes.map((node) => {
          const isAlive = node.state === 'ready';
          const cpu = node.hardware.cpu_percent;
          const mem = node.hardware.mem_percent;
          const disk = node.hardware.disk_percent;
          const hasMetrics = cpu > 0 || mem > 0 || disk > 0;

          return (
            <Card key={node.id} className={`overflow-hidden border-t-4 ${node.role === 'manager' ? 'border-t-blue-500' : 'border-t-green-500'}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{node.hostname}</CardTitle>
                    <CardDescription>{node.ip || 'Unknown IP'}</CardDescription>
                  </div>
                  <Badge variant={isAlive ? "default" : "destructive"} className={isAlive ? "bg-green-500 hover:bg-green-600" : ""}>
                    {node.state}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <Badge variant="outline">{node.role}</Badge>
                  <span className="text-muted-foreground">{node.cpus} CPUs • {formatBytes(node.memory_bytes)}</span>
                </div>

                {hasMetrics ? (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground"><Cpu className="h-3 w-3" /> CPU Load</span>
                        <span>{cpu.toFixed(1)}%</span>
                      </div>
                      <Progress value={cpu} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground"><Activity className="h-3 w-3" /> RAM Usage</span>
                        <span>{mem.toFixed(1)}%</span>
                      </div>
                      <Progress value={mem} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground"><HardDrive className="h-3 w-3" /> Storage</span>
                        <span>{disk.toFixed(1)}%</span>
                      </div>
                      <Progress value={disk} className="h-2" />
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t text-center text-sm text-muted-foreground italic py-6">
                    Waiting for Agent metrics...
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cluster Services</CardTitle>
          <CardDescription>Highly available applications deployed across the Swarm.</CardDescription>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No services deployed yet.</div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Service Name</th>
                    <th className="px-4 py-3 font-medium">Image</th>
                    <th className="px-4 py-3 font-medium">Mode</th>
                    <th className="px-4 py-3 font-medium">Replicas</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((svc) => (
                    <tr key={svc.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{svc.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{svc.image}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{svc.mode}</Badge>
                      </td>
                      <td className="px-4 py-3">{svc.replicas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
