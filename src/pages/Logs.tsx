import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Logs() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockLogs = [
    { id: 1, timestamp: "2026-06-13 10:45:12", level: "ERROR", source: "postgres-db", message: "Connection timeout waiting for client" },
    { id: 2, timestamp: "2026-06-13 10:44:50", level: "WARN", source: "nginx-proxy", message: "High latency detected from backend server" },
    { id: 3, timestamp: "2026-06-13 10:42:11", level: "INFO", source: "system", message: "User 'admin' successfully authenticated via SSH" },
    { id: 4, timestamp: "2026-06-13 10:40:05", level: "INFO", source: "docker-daemon", message: "Container 'redis-cache' stopped successfully" },
    { id: 5, timestamp: "2026-06-13 10:35:22", level: "ERROR", source: "app-backend", message: "Failed to connect to redis cache on port 6379" },
    { id: 6, timestamp: "2026-06-13 10:30:00", level: "INFO", source: "cron", message: "Daily backup job completed in 45s" },
  ];

  const filteredLogs = mockLogs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Logs</h2>
          <p className="text-muted-foreground">Search and filter system and container logs.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="default">
            Live Tail
          </Button>
        </div>
      </div>

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
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
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
    </div>
  );
}
