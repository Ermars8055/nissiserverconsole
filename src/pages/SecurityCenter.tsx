import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity, Lock, Fingerprint, TerminalSquare, AlertTriangle, Crosshair } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function SecurityCenter() {
  const [status, setStatus] = useState<any>(null);
  const [traffic, setTraffic] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [sshLogs, setSshLogs] = useState<any[]>([]);
  const [hashInput, setHashInput] = useState("");
  const [hashOutput, setHashOutput] = useState("");
  const [isHashing, setIsHashing] = useState(false);
  const [blockInput, setBlockInput] = useState("");

  const loadData = async () => {
    try {
      const statRes = await fetchApi("/api/firewall/status");
      setStatus(statRes);
      
      const trafRes = await fetchApi("/api/firewall/traffic");
      setTraffic(trafRes.traffic || []);
      
      const nodeRes = await fetchApi("/api/firewall/nodes");
      setNodes(nodeRes.nodes || []);
      
      const blkRes = await fetchApi("/api/firewall/blocked");
      setBlocked(blkRes.blocked_ips);
      
      const metRes = await fetchApi("/api/firewall/metrics");
      setMetrics(prev => [...prev.slice(-19), metRes]);
      
      const sshRes = await fetchApi("/api/firewall/ssh-logs");
      setSshLogs(sshRes.logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleHash = async () => {
    if (!hashInput) return;
    setIsHashing(true);
    try {
      const res = await fetchApi("/api/firewall/hash", {
        method: "POST",
        body: JSON.stringify({ text: hashInput })
      });
      setHashOutput(res.hash);
    } catch (e) {
      alert("Hashing failed");
    }
    setIsHashing(false);
  };

  const handleBlock = async () => {
    if (!blockInput) return;
    try {
      await fetchApi("/api/firewall/block", {
        method: "POST",
        body: JSON.stringify({ ip: blockInput })
      });
      setBlockInput("");
      loadData();
    } catch (e) {
      alert("Failed to block IP");
    }
  };

  const handleUnblock = async (ip: string) => {
    try {
      await fetchApi("/api/firewall/unblock", {
        method: "POST",
        body: JSON.stringify({ ip })
      });
      loadData();
    } catch (e) {
      alert("Failed to unblock IP");
    }
  };

  const handleBlockSpecific = async (ip: string) => {
    try {
      await fetchApi("/api/firewall/block", {
        method: "POST",
        body: JSON.stringify({ ip })
      });
      loadData();
    } catch (e) {
      alert("Failed to block IP");
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-auto">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-red-500">
            <Shield className="h-8 w-8" /> Advanced Firewall
          </h1>
          <p className="text-muted-foreground">Datacenter Security and Threat Management powered by CE-256.</p>
        </div>
        {status && (
          <Badge variant="outline" className="text-lg py-1 px-4 border-red-500 text-red-500 bg-red-500/10 gap-2">
            <Activity className="h-4 w-4 animate-pulse" /> Engine Active
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CE-256 Crypto Lab */}
        <Card className="lg:col-span-3 border-purple-500/30 bg-gradient-to-br from-card to-purple-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-500">
              <Fingerprint className="h-5 w-5" /> Proprietary CE-256 Cryptography Lab
            </CardTitle>
            <CardDescription>
              Test the Collatz-based 256-bit cryptographic hashing algorithm live.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input 
                placeholder="Enter text to hash (e.g. 'hello')" 
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                className="font-mono"
              />
              <Button onClick={handleHash} disabled={isHashing} className="bg-purple-600 hover:bg-purple-700">
                Generate Hash
              </Button>
            </div>
            {hashOutput && (
              <div className="p-4 rounded-md bg-black/40 border border-purple-500/30 flex flex-col items-center justify-center space-y-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Generated CE-256 Hash (64 Hex Characters)</span>
                <span className="font-mono text-purple-400 font-bold tracking-widest break-all text-center text-lg shadow-purple-500 drop-shadow-md">
                  {hashOutput}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Threat Management */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-500" /> Blocked IPs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="IP Address..." 
                  value={blockInput}
                  onChange={(e) => setBlockInput(e.target.value)}
                />
                <Button variant="destructive" onClick={handleBlock}>Block</Button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-auto">
                {blocked.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">No IPs blocked.</div>
                ) : (
                  blocked.map(ip => (
                    <div key={ip} className="flex items-center justify-between p-2 bg-muted/50 rounded-md border border-border">
                      <span className="font-mono text-sm">{ip}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleUnblock(ip)} className="h-7 text-xs">Unblock</Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-500">
                <Shield className="h-5 w-5" /> Trusted Cluster Nodes
              </CardTitle>
              <CardDescription>Known Swarm IPs bypassing restrictions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[150px] overflow-auto">
                {nodes.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">No Swarm nodes detected.</div>
                ) : (
                  nodes.map(n => (
                    <div key={n.ip} className="flex items-center justify-between p-2 bg-blue-500/10 rounded-md border border-blue-500/20">
                      <div>
                        <div className="font-mono text-sm font-bold">{n.ip}</div>
                        <div className="text-xs text-muted-foreground">{n.hostname} ({n.role})</div>
                      </div>
                      <Badge className="bg-blue-500 hover:bg-blue-600">TRUSTED</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Traffic */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TerminalSquare className="h-5 w-5 text-green-500" /> Live Network Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Live Metrics Graph */}
            <div className="h-48 w-full bg-black/20 rounded-md border p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
                  <XAxis dataKey="timestamp" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="active_connections" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="rounded-md border h-[350px] overflow-auto bg-black/20">
              <Table>
                <TableHeader className="sticky top-0 bg-card/95 backdrop-blur z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Source IP</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {traffic.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{t.timestamp}</TableCell>
                      <TableCell className="font-mono text-sm">{t.source_ip}</TableCell>
                      <TableCell className="text-sm">{t.target}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={t.action === "BLOCKED" ? "destructive" : "default"} className={`w-fit ${t.action === "ALLOWED" ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" : ""}`}>
                            {t.action}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{t.status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {traffic.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Listening for traffic...</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* SSH Audit Logs */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <AlertTriangle className="h-5 w-5" /> SSH Audit Logs (Failed Attempts)
            </CardTitle>
            <CardDescription>Monitor brute-force SSH attacks and instantly ban malicious IPs at the firewall level.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border h-[300px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card/95 backdrop-blur z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Node</TableHead>
                    <TableHead>Attacker IP</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sshLogs.map((log) => (
                    <TableRow key={log.id} className={blocked.includes(log.ip) ? "opacity-50" : ""}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.timestamp}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs bg-black/40">
                          {log.node || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-medium text-red-400">{log.ip}</TableCell>
                      <TableCell className="font-mono text-sm">{log.user}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={log.message}>{log.message}</TableCell>
                      <TableCell className="text-right">
                        {blocked.includes(log.ip) ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Button variant="destructive" size="sm" onClick={() => handleBlockSpecific(log.ip)} className="h-7 text-xs">
                            <Crosshair className="h-3 w-3 mr-1" /> Ban IP
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {sshLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No failed SSH attempts detected across the cluster.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
