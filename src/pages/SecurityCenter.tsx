import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity, Lock, AlertTriangle, Fingerprint, TerminalSquare } from "lucide-react";

export default function SecurityCenter() {
  const [status, setStatus] = useState<any>(null);
  const [traffic, setTraffic] = useState<any[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [hashInput, setHashInput] = useState("");
  const [hashOutput, setHashOutput] = useState("");
  const [isHashing, setIsHashing] = useState(false);
  const [blockInput, setBlockInput] = useState("");

  const loadData = async () => {
    try {
      const statRes = await fetchApi("/api/firewall/status");
      setStatus(statRes);
      
      const trafRes = await fetchApi("/api/firewall/traffic");
      setTraffic(trafRes.traffic);
      
      const blkRes = await fetchApi("/api/firewall/blocked");
      setBlocked(blkRes.blocked_ips);
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
        <Card className="lg:col-span-1">
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
            <div className="space-y-2 max-h-[300px] overflow-auto">
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

        {/* Live Traffic */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TerminalSquare className="h-5 w-5 text-green-500" /> Live Network Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                        <Badge variant={t.action === "BLOCKED" ? "destructive" : "default"} className={t.action === "ALLOWED" ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" : ""}>
                          {t.action}
                        </Badge>
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

      </div>
    </div>
  );
}
