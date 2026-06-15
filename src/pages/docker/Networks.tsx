import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Network, Trash2, Globe, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Networks() {
  const [networks, setNetworks] = useState<any[]>([]);

  const loadNetworks = async () => {
    try {
      const data = await fetchApi("/api/docker/networks");
      setNetworks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNetworks();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete network ${name}?`)) {
      try {
        await fetchApi(`/api/docker/networks/${id}`, { method: 'DELETE' });
        loadNetworks();
      } catch (err) {
        alert(`Failed to delete network ${name}. It might be in use.`);
      }
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Networks</h2>
          <p className="text-muted-foreground">Manage Swarm and local Docker networks.</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 overflow-auto p-0">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {networks.map((net) => (
                <TableRow key={net.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {net.scope === 'swarm' ? <Globe className="h-4 w-4 text-blue-500" /> : <Server className="h-4 w-4 text-muted-foreground" />}
                    {net.name}
                  </TableCell>
                  <TableCell>{net.driver}</TableCell>
                  <TableCell className="capitalize">{net.scope}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{net.id}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(net.id, net.name)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
