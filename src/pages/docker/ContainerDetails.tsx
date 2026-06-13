import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Square, RotateCw } from "lucide-react";

export default function ContainerDetails() {
  const { id } = useParams();
  const [container, setContainer] = useState<any>(null);
  const [logs, setLogs] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Find the specific container details by listing all (for simplicity, a specific detail endpoint could be added to backend)
      const list = await fetchApi("/api/docker/containers");
      const found = list.find((c: any) => c.id === id);
      setContainer(found);

      // Fetch logs
      const logData = await fetchApi(`/api/docker/logs/${id}?tail=50`);
      setLogs(logData.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAction = async (action: string) => {
    if (!id) return;
    try {
      await fetchApi(`/api/docker/${action}/${id}`, { method: 'POST' });
      fetchData(); // Refresh state after action
    } catch (err) {
      console.error(`Failed to ${action} container`, err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!container) return <div>Container not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/docker">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {container.name}
            <Badge variant={container.status === "running" ? "default" : "secondary"} className={
              container.status === "running" ? "bg-green-500/10 text-green-500" : ""
            }>
              {container.status}
            </Badge>
          </h2>
          <p className="text-muted-foreground font-mono text-sm mt-1">{container.image}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {container.status !== "running" && (
            <Button variant="outline" className="text-green-500 hover:text-green-600" onClick={() => handleAction('start')}>
              <Play className="mr-2 h-4 w-4" /> Start
            </Button>
          )}
          {container.status === "running" && (
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleAction('stop')}>
              <Square className="mr-2 h-4 w-4" /> Stop
            </Button>
          )}
          <Button variant="outline" onClick={() => handleAction('restart')}>
            <RotateCw className="mr-2 h-4 w-4" /> Restart
          </Button>
        </div>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[200px]">
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="env">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Container Logs</CardTitle>
                <CardDescription>Live log output from standard streams.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={fetchData}>
                Refresh Logs
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full rounded-md bg-[#0C0C0C] p-4 font-mono text-xs text-muted-foreground overflow-y-auto whitespace-pre-wrap">
                {logs || "No logs available."}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="env" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border p-4 space-y-2">
                <pre className="text-sm">
                  <code>{JSON.stringify(container.ports, null, 2)}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
