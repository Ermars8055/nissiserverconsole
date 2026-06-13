import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Square, RotateCw, Search, Box } from "lucide-react";

export default function DockerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [containers, setContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContainers = async () => {
    try {
      const data = await fetchApi("/api/docker/containers");
      setContainers(data);
    } catch (err) {
      console.error("Failed to fetch containers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  const handleAction = async (id: string, action: string) => {
    try {
      await fetchApi(`/api/docker/${action}/${id}`, { method: 'POST' });
      fetchContainers();
    } catch (err) {
      console.error(`Failed to ${action} container`, err);
    }
  };

  const filteredContainers = containers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.image.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Docker</h2>
          <p className="text-muted-foreground">Manage your containers and view their status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchContainers} disabled={loading}>
            <RotateCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Box className="mr-2 h-4 w-4" />
            Deploy Container
          </Button>
        </div>
      </div>

      <div className="flex items-center mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search containers..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ports</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Loading containers...</TableCell>
              </TableRow>
            ) : filteredContainers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No containers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredContainers.map((container) => (
                <TableRow key={container.id}>
                  <TableCell className="font-medium">
                    <Link to={`/containers/${container.id}`} className="hover:underline">
                      {container.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{container.image}</TableCell>
                  <TableCell>
                    <Badge variant={container.status === "running" ? "default" : "secondary"} className={
                      container.status === "running" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""
                    }>
                      {container.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate">
                    {Object.keys(container.ports).length > 0 ? JSON.stringify(container.ports) : "None"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {container.status !== "running" && (
                      <Button variant="outline" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600" onClick={() => handleAction(container.id, 'start')}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {container.status === "running" && (
                      <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleAction(container.id, 'stop')}>
                        <Square className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAction(container.id, 'restart')}>
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
