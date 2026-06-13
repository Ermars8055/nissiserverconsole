import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";
import { Activity, HardDrive, Server, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [cpuHistory, setCpuHistory] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const data = await fetchApi("/api/system/overview");
      setMetrics(data);
      
      const auditData = await fetchApi("/api/audit/?limit=5");
      const mappedAudit = auditData.map((log: any) => ({
        id: log.id,
        timestamp: new Date(log.timestamp).toLocaleString(),
        level: log.action.includes("Error") || log.action.includes("Failed") ? "ERROR" : "INFO",
        message: log.target ? `${log.action} on ${log.target}` : log.action
      }));
      setRecentActivity(mappedAudit);

      // Update CPU history for the chart
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      setCpuHistory(prev => {
        const newHistory = [...prev, { time: timeStr, usage: data.cpu.usage_percent }];
        if (newHistory.length > 20) {
          return newHistory.slice(newHistory.length - 20);
        }
        return newHistory;
      });
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your server metrics and status.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.cpu.usage_percent}%</div>
            <p className="text-xs text-muted-foreground">{metrics?.cpu.total_cores} Cores</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.memory.used} / {metrics?.memory.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.memory.percentage}% utilized
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage (Root)</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.disk?.used || "N/A"} / {metrics?.disk?.total || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.disk?.percentage || 0}% utilized
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Currently logged in</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>CPU Activity</CardTitle>
            <CardDescription>Live resource utilization.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cpuHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Line type="monotone" dataKey="usage" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Server specifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">OS</span>
                  <span className="font-medium">{metrics?.system.os} {metrics?.system.release}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Hostname</span>
                  <span className="font-medium">{metrics?.system.node}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Architecture</span>
                  <span className="font-medium">{metrics?.system.machine}</span>
               </div>
               <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Boot Time</span>
                  <span className="font-medium">{metrics?.system.boot_time}</span>
               </div>
               <div className="mt-8">
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Recent Audit Log</h4>
                  <div className="space-y-4">
                    {recentActivity.map((item: any) => (
                      <div key={item.id} className="flex items-center">
                        <div className={`mt-0.5 h-2 w-2 rounded-full ${
                          item.level === 'ERROR' ? 'bg-destructive' :
                          item.level === 'INFO' ? 'bg-green-500' :
                          item.level === 'WARN' ? 'bg-yellow-500' : 'bg-primary'
                        }`} />
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{item.message}</p>
                          <p className="text-[10px] text-muted-foreground">{item.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
