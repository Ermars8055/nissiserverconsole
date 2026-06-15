import { useState, useEffect, useRef } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle, Info, AlertCircle, RefreshCw, TerminalSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Logs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);
  const [containerLogs, setContainerLogs] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  const loadAuditLogs = () => {
    fetchApi("/api/audit/").then(data => {
      const mapped = data.map((log: any) => ({
        id: log.id,
        timestamp: new Date(log.timestamp).toLocaleString(),
        level: log.action.includes("Error") || log.action.includes("Failed") ? "ERROR" : "INFO",
        source: log.user_email,
        message: log.target ? `${log.action} on ${log.target}` : log.action
      }));
      setLogs(mapped);
    }).catch(console.error);
  };

  const loadContainers = () => {
    fetchApi("/api/docker/containers").then(data => setContainers(data)).catch(console.error);
  };

  const loadContainerLogs = (id: string) => {
    fetchApi(`/api/docker/logs/${id}?tail=200`).then(data => {
      setContainerLogs(data.logs);
      setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }).catch(console.error);
  };

  useEffect(() => {
    loadAuditLogs();
    loadContainers();
  }, []);

  useEffect(() => {
    if (selectedContainer) {
      loadContainerLogs(selectedContainer);
      const interval = setInterval(() => loadContainerLogs(selectedContainer), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedContainer]);

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Logs</h2>
          <p className="text-muted-foreground">Monitor audit events and live container output.</p>
        </div>
      </div>

      <Tabs defaultValue="audit" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-[400px]">
          <TabsTrigger value="audit" className="flex-1">System Audit</TabsTrigger>
          <TabsTrigger value="docker" className="flex-1">Docker Containers</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="flex-1 flex-col min-h-0 mt-4 m-0 border-none outline-none data-[state=active]:flex">
          <Card className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b flex items-center gap-4 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search logs by message, source..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" onClick={loadAuditLogs}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <CardContent className="flex-1 overflow-auto p-0">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead className="w-[150px]">Source</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="font-mono text-sm">
                      <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          log.level === 'ERROR' ? 'border-destructive text-destructive' :
                          log.level === 'WARN' ? 'border-yellow-500 text-yellow-500' :
                          'border-green-500 text-green-500'
                        }>
                          {log.level === 'ERROR' && <AlertCircle className="mr-1 h-3 w-3" />}
                          {log.level === 'WARN' && <AlertTriangle className="mr-1 h-3 w-3" />}
                          {log.level === 'INFO' && <Info className="mr-1 h-3 w-3" />}
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.source}</TableCell>
                      <TableCell className={log.level === 'ERROR' ? 'text-destructive/80' : ''}>
                        {log.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docker" className="flex-1 min-h-0 mt-4 m-0 gap-4 outline-none border-none data-[state=active]:flex">
          <Card className="w-64 shrink-0 flex flex-col min-h-0">
            <div className="p-3 border-b font-semibold flex items-center justify-between">
              Active Containers
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={loadContainers}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            <CardContent className="p-2 flex-1 overflow-auto space-y-1">
              {containers.map(c => (
                <div 
                  key={c.id} 
                  className={`p-2 text-sm rounded-md cursor-pointer flex items-center gap-2 truncate ${selectedContainer === c.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                  onClick={() => setSelectedContainer(c.id)}
                >
                  <TerminalSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate">{c.name.replace(/^\//, '')}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card className="flex-1 flex flex-col min-h-0 bg-[#0C0C0C] border-[#333]">
            <CardContent className="flex-1 p-4 overflow-auto font-mono text-sm text-[#D4D4D4] whitespace-pre-wrap leading-relaxed">
              {selectedContainer ? (
                <>
                  {containerLogs || "Waiting for logs..."}
                  <div ref={logsEndRef} />
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Select a container to stream logs
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
