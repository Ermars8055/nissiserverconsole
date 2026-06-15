import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Download, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

interface DBContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  type: string;
  has_env: boolean;
}

export default function Databases() {
  const [databases, setDatabases] = useState<DBContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState<string | null>(null);

  const loadDatabases = async () => {
    try {
      const data = await fetchApi('/api/docker/databases');
      setDatabases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabases();
  }, []);

  const handleBackup = async (id: string) => {
    setBackingUp(id);
    try {
      const res = await fetchApi(`/api/docker/databases/${id}/backup`, {
        method: 'POST'
      });
      alert(res.message);
    } catch (e: any) {
      alert(`Backup failed: ${e.message}`);
    } finally {
      setBackingUp(null);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Database Control Center</h1>
          <p className="text-muted-foreground">Auto-detect running database containers and trigger 1-click NFS backups.</p>
        </div>
        <Button onClick={loadDatabases} variant="outline" className="gap-2">
          <Database className="h-4 w-4" />
          Scan for Databases
        </Button>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Scanning Swarm for Databases...</div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="w-[100px]">Engine</TableHead>
                  <TableHead>Container Name</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ready for Auto-Backup</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {databases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No Postgres or MySQL containers found running on the Swarm.
                    </TableCell>
                  </TableRow>
                ) : (
                  databases.map((db) => (
                    <TableRow key={db.id}>
                      <TableCell className="font-medium capitalize flex items-center gap-2 mt-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        {db.type}
                      </TableCell>
                      <TableCell>{db.name.replace(/^\//, '')}</TableCell>
                      <TableCell className="font-mono text-xs">{db.image}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          {db.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {db.has_env ? (
                          <span className="flex items-center text-green-500 text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Credentials Detected
                          </span>
                        ) : (
                          <span className="flex items-center text-red-500 text-sm">
                            <XCircle className="h-4 w-4 mr-1" />
                            Missing ENV Passwords
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleBackup(db.id)}
                          disabled={backingUp === db.id}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {backingUp === db.id ? "Dumping SQL..." : "Backup to NFS Vault"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
