import React, { useState, useEffect } from 'react';
import { Database, Play, AlertCircle, Terminal, Table as TableIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from '@/lib/api';

interface QueryResult {
  columns: string[];
  rows: any[];
  message?: string;
}

const DatabaseAdmin: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [rawSql, setRawSql] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const data = await fetchApi('/api/database/tables');
      setTables(data.tables);
    } catch (err: any) {
      setError(err.message || "Failed to fetch tables");
    }
  };

  const loadTableData = async (tableName: string) => {
    setLoading(true);
    setError(null);
    setSelectedTable(tableName);
    try {
      const data = await fetchApi(`/api/database/table/${tableName}`);
      setQueryResult({
        columns: data.columns,
        rows: data.rows,
        message: `Loaded ${data.rows.length} rows from ${tableName}`
      });
      setRawSql(`SELECT * FROM ${tableName} LIMIT 100;`);
    } catch (err: any) {
      setError(err.message || "Failed to load table data");
      setQueryResult(null);
    } finally {
      setLoading(false);
    }
  };

  const executeSql = async () => {
    if (!rawSql.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi('/api/database/query', {
        method: 'POST',
        body: JSON.stringify({ query: rawSql })
      });
      setQueryResult(data);
    } catch (err: any) {
      setError(err.message || "SQL Execution Error");
      setQueryResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar: Tables List */}
      <Card className="w-1/4 h-full border-zinc-800 bg-black/40 backdrop-blur-xl">
        <CardHeader className="pb-3 border-b border-zinc-800">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Database className="w-4 h-4 text-emerald-500" />
            public tables
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-2 flex flex-col gap-1">
              {tables.map(table => (
                <Button
                  key={table}
                  variant={selectedTable === table ? "secondary" : "ghost"}
                  className="w-full justify-start text-xs font-mono"
                  onClick={() => loadTableData(table)}
                >
                  <TableIcon className="w-3 h-3 mr-2 opacity-50" />
                  {table}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Area: SQL Terminal & Data Viewer */}
      <div className="flex-1 flex flex-col gap-4 h-full">
        <Card className="border-zinc-800 bg-black/40 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  SQL Terminal
                </CardTitle>
                <CardDescription>Execute raw PostgreSQL queries directly against server_admin_db.</CardDescription>
              </div>
              <Button onClick={executeSql} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                <Play className="w-4 h-4 mr-2" />
                Execute
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              className="font-mono text-sm bg-zinc-950/50 border-zinc-800 text-indigo-300 min-h-[120px] focus-visible:ring-indigo-500/50"
              placeholder="SELECT * FROM users;"
              value={rawSql}
              onChange={(e) => setRawSql(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  executeSql();
                }
              }}
            />
            {error && (
              <Alert variant="destructive" className="mt-4 bg-red-950/50 border-red-900">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>SQL Error</AlertTitle>
                <AlertDescription className="font-mono text-xs">{error}</AlertDescription>
              </Alert>
            )}
            {queryResult?.message && !error && (
              <Alert className="mt-4 bg-emerald-950/20 border-emerald-900 text-emerald-400">
                <AlertDescription className="text-xs font-mono">{queryResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1 border-zinc-800 bg-black/40 backdrop-blur-xl overflow-hidden flex flex-col">
          <CardHeader className="py-3 border-b border-zinc-800">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Result Data
              {queryResult && (
                <Badge variant="outline" className="text-xs bg-black/50">
                  {queryResult.rows.length} rows
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            {!queryResult && !loading && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm flex-col gap-2 opacity-50">
                <Database className="w-8 h-8" />
                <p>Run a query to see results</p>
              </div>
            )}
            
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            )}

            {queryResult && queryResult.columns.length > 0 && !loading && (
              <Table>
                <TableHeader className="bg-zinc-950/80 sticky top-0 z-10 backdrop-blur">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    {queryResult.columns.map(col => (
                      <TableHead key={col} className="font-mono text-xs text-indigo-400 whitespace-nowrap">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResult.rows.map((row, i) => (
                    <TableRow key={i} className="border-zinc-800/50 hover:bg-zinc-800/30">
                      {queryResult.columns.map(col => (
                        <TableCell key={col} className="font-mono text-xs whitespace-nowrap max-w-[300px] truncate" title={String(row[col])}>
                          {String(row[col])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseAdmin;
