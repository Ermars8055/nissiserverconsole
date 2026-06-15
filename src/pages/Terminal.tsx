import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TerminalSquare, Server, Play } from "lucide-react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { fetchApi } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "@xterm/xterm/css/xterm.css";

interface SwarmNode {
  id: string;
  hostname: string;
  role: string;
  ip: string;
}

export default function Terminal() {
  const [nodes, setNodes] = useState<SwarmNode[]>([]);
  const [activeSessionName, setActiveSessionName] = useState("Main Server");
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SwarmNode | null>(null);
  const [sshUser, setSshUser] = useState(localStorage.getItem('sshUsername') || "");
  
  const [connectionParams, setConnectionParams] = useState<{ip: string, user: string} | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    const loadNodes = async () => {
      try {
        const data = await fetchApi('/api/docker/swarm/nodes');
        setNodes(data);
      } catch (err) {
        console.error("Failed to load swarm nodes for terminal", err);
      }
    };
    loadNodes();
  }, []);

  useEffect(() => {
    // Cleanup previous terminal
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

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
      // Clear container
      terminalRef.current.innerHTML = "";
      term.open(terminalRef.current);
      fitAddon.fit();
    }

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = `${wsProtocol}//${window.location.host}/api/terminal/ws`;
    
    if (connectionParams) {
      wsUrl += `?target_ip=${encodeURIComponent(connectionParams.ip)}&ssh_user=${encodeURIComponent(connectionParams.user)}`;
    }

    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      term.writeln(`\x1b[32mConnected to ${activeSessionName}\x1b[0m`);
      if (connectionParams && connectionParams.ip !== '127.0.0.1') {
        term.writeln(`\x1b[36mInitializing native SSH tunnel to ${connectionParams.ip}...\x1b[0m`);
      }
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

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) wsRef.current.close();
      if (xtermRef.current) xtermRef.current.dispose();
    };
  }, [connectionParams, activeSessionName]); // Re-run when connection target changes

  const handleNodeClick = (node: SwarmNode) => {
    if (node.role === 'manager') {
      // Direct local connection for manager
      setActiveSessionName(node.hostname);
      setConnectionParams({ ip: '127.0.0.1', user: 'root' });
    } else {
      // Remote worker connection
      setSelectedNode(node);
      if (sshUser) {
        setActiveSessionName(node.hostname);
        setConnectionParams({ ip: node.ip, user: sshUser });
      } else {
        setConnectModalOpen(true);
      }
    }
  };

  const handleModalConnect = () => {
    if (selectedNode && sshUser) {
      localStorage.setItem('sshUsername', sshUser);
      setActiveSessionName(selectedNode.hostname);
      setConnectionParams({ ip: selectedNode.ip, user: sshUser });
      setConnectModalOpen(false);
    }
  };

  return (
    <div className="h-full flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-64 shrink-0 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Terminal</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage cluster nodes</p>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">Swarm Nodes</h3>
          <div className="space-y-2">
            {nodes.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2 text-center">Loading nodes...</div>
            ) : (
              nodes.map((node) => (
                <Card 
                  key={node.id} 
                  className={`cursor-pointer transition-colors ${activeSessionName === node.hostname ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
                  onClick={() => handleNodeClick(node)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className={`h-4 w-4 ${node.role === 'manager' ? 'text-blue-500' : 'text-green-500'}`} />
                        <div className="text-sm font-medium">{node.hostname}</div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-mono">
                      {node.role === 'manager' ? 'Local System' : `SSH via ${node.ip}`}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Tabs value="active" className="flex-1 flex flex-col">
          <div className="flex items-center border-b">
            <TabsList className="h-10 rounded-none border-b-0 bg-transparent p-0 flex-1 justify-start overflow-x-auto">
              <TabsTrigger
                value="active"
                className="h-10 rounded-none border-b-2 border-primary px-4 bg-transparent shadow-none"
              >
                <TerminalSquare className="mr-2 h-4 w-4" />
                {activeSessionName}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="flex-1 m-0 mt-4 outline-none overflow-hidden relative border rounded-md">
            <div ref={terminalRef} className="absolute inset-0 bg-[#0C0C0C] p-2" />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to {selectedNode?.hostname}</DialogTitle>
            <DialogDescription>
              Enter the SSH username for {selectedNode?.ip}. We will pass the connection straight to your browser.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={sshUser}
                onChange={(e) => setSshUser(e.target.value)}
                placeholder="ubuntu"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectModalOpen(false)}>Cancel</Button>
            <Button onClick={handleModalConnect} disabled={!sshUser}>Connect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
