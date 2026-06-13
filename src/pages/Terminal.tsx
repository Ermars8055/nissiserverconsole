import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TerminalSquare, Plus, X, Server, Play } from "lucide-react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export default function Terminal() {
  const [activeTab, setActiveTab] = useState("session-1");
  const [sessions] = useState([
    { id: "session-1", name: "Main Server", active: true },
  ]);

  const savedConnections = [
    { id: 1, name: "Production DB", host: "10.0.0.45", user: "postgres" },
    { id: 2, name: "Web Server 01", host: "10.0.0.12", user: "ubuntu" },
  ];

  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    // Initialize xterm.js
    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#0C0C0C',
        foreground: '#D4D4D4',
      },
      fontFamily: 'monospace',
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    if (terminalRef.current) {
      term.open(terminalRef.current);
      fitAddon.fit();
    }

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/api/terminal/ws`);
    
    ws.onopen = () => {
      term.writeln("\x1b[32mConnected to ServerAdmin Terminal\x1b[0m");
      // Initial resize
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "output") {
        term.write(data.data);
      }
    };

    ws.onclose = () => {
      term.writeln("\r\n\x1b[31mDisconnected from server.\x1b[0m");
    };

    wsRef.current = ws;

    // Handle terminal input
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, []);

  return (
    <div className="h-full flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-64 shrink-0 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Terminal</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage remote sessions</p>
        </div>

        <Button className="w-full justify-start">
          <Plus className="mr-2 h-4 w-4" /> New Connection
        </Button>

        <div className="mt-4">
          <h3 className="text-sm font-medium mb-3">Saved Connections</h3>
          <div className="space-y-2">
            {savedConnections.map((conn) => (
              <Card key={conn.id} className="cursor-pointer hover:bg-accent transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm font-medium">{conn.name}</div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    {conn.user}@{conn.host}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="flex items-center border-b">
            <TabsList className="h-10 rounded-none border-b-0 bg-transparent p-0 flex-1 justify-start overflow-x-auto">
              {sessions.map((session) => (
                <TabsTrigger
                  key={session.id}
                  value={session.id}
                  className={`h-10 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none`}
                >
                  <TerminalSquare className="mr-2 h-4 w-4" />
                  {session.name}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-2 h-4 w-4 rounded-full opacity-50 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Close logic
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="session-1" className="flex-1 m-0 mt-4 outline-none overflow-hidden relative border rounded-md">
            {/* The xterm.js container */}
            <div ref={terminalRef} className="absolute inset-0 bg-[#0C0C0C] p-2" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
