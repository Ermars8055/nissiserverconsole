import { useState, useEffect, useRef } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Settings, Play, Pause, X, Upload, File as FileIcon, Download, Trash2, Printer as PrinterIcon, RefreshCw } from "lucide-react";

export default function PrinterManagement() {
  const [printers, setPrinters] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [storedFiles, setStoredFiles] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddPrinterOpen, setIsAddPrinterOpen] = useState(false);
  const [detectedDevices, setDetectedDevices] = useState<any[]>([]);
  const [newPrinterName, setNewPrinterName] = useState("");
  const [newPrinterDriver, setNewPrinterDriver] = useState("everywhere");
  const [selectedDeviceUri, setSelectedDeviceUri] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const fetchStatus = () => {
    fetchApi("/api/printer/status").then(data => {
      const mapped = (data.printers || []).map((p: any, i: number) => ({
        id: i,
        name: p.info.split(' ')[1] || "Printer",
        ip: "USB/Local",
        status: p.info.includes("idle") ? "online" : "printing",
        toner: 100,
        queue: 0,
        raw: p.info
      }));
      setPrinters(mapped);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchStatus();

    fetchApi("/api/printer/queue").then(data => {
      const mapped = (data.jobs || []).map((j: string, i: number) => ({
        id: `job-${i}`,
        document: j,
        user: j.split(' ').length > 1 ? j.split(' ')[1] : "root",
        printer: "Unknown",
        status: "queued",
        pages: 1
      }));
      setJobs(mapped);
    }).catch(console.error);

    fetchFiles();
  }, []);

  const fetchFiles = () => {
    fetchApi("/api/storage/list").then(setStoredFiles).catch(console.error);
  };

  const scanDevices = async () => {
    setIsScanning(true);
    try {
      const data = await fetchApi("/api/printer/devices");
      setDetectedDevices(data.devices || []);
      if (data.devices && data.devices.length > 0) {
        setSelectedDeviceUri(data.devices[0].uri);
        setNewPrinterName(data.devices[0].name.replace(/[^a-zA-Z0-9_-]/g, ''));
      }
    } catch (err) {
      console.error("Failed to fetch devices:", err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isAddPrinterOpen) {
      scanDevices();
    }
  }, [isAddPrinterOpen]);

  const handleAddPrinter = async () => {
    try {
      await fetchApi("/api/printer/add", {
        method: "POST",
        body: JSON.stringify({ name: newPrinterName, uri: selectedDeviceUri, driver: newPrinterDriver })
      });
      setIsAddPrinterOpen(false);
      fetchStatus();
    } catch (err) {
      console.error(err);
      alert("Failed to add printer: " + err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/storage/upload", {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      fetchFiles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileAction = async (filename: string, action: 'print' | 'delete' | 'download') => {
    try {
      if (action === 'delete') {
        await fetchApi(`/api/storage/delete/${encodeURIComponent(filename)}`, { method: 'DELETE' });
        fetchFiles();
      } else if (action === 'print') {
        await fetchApi(`/api/printer/print?filename=${encodeURIComponent(filename)}`, { method: 'POST' });
        // Refresh queue
        fetchApi("/api/printer/queue").then(data => {
          const mapped = (data.jobs || []).map((j: string, i: number) => ({
            id: `job-${i}`,
            document: j,
            user: j.split(' ').length > 1 ? j.split(' ')[1] : "root",
            printer: "Unknown",
            status: "queued",
            pages: 1
          }));
          setJobs(mapped);
        }).catch(console.error);
      } else if (action === 'download') {
        window.open(`/api/files/download?path=${encodeURIComponent(filename)}`, '_blank');
      }
    } catch (err) {
      console.error(`Failed to ${action} file:`, err);
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Printer Management</h2>
          <p className="text-muted-foreground">Monitor and manage network printers and print queues.</p>
        </div>
        
        <Dialog open={isAddPrinterOpen} onOpenChange={setIsAddPrinterOpen}>
          <DialogTrigger asChild>
            <Button>
              <Printer className="mr-2 h-4 w-4" />
              Add Printer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Hardware Printer</DialogTitle>
              <DialogDescription>
                Scan for USB or network printers and register them with the server.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <Label>Detected Devices</Label>
                <Button variant="ghost" size="sm" onClick={scanDevices} disabled={isScanning}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                  Scan
                </Button>
              </div>
              
              <Select value={selectedDeviceUri} onValueChange={(val) => {
                setSelectedDeviceUri(val);
                const dev = detectedDevices.find(d => d.uri === val);
                if (dev) setNewPrinterName(dev.name.replace(/[^a-zA-Z0-9_-]/g, ''));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a connected printer..." />
                </SelectTrigger>
                <SelectContent>
                  {detectedDevices.length === 0 && <SelectItem value="none" disabled>No devices found</SelectItem>}
                  {detectedDevices.map((dev: any) => (
                    <SelectItem key={dev.uri} value={dev.uri}>
                      {dev.name} ({dev.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2 pt-2">
                <Label htmlFor="name">Printer Display Name</Label>
                <Input 
                  id="name" 
                  value={newPrinterName} 
                  onChange={(e) => setNewPrinterName(e.target.value)} 
                  placeholder="e.g. Office_HP_LaserJet" 
                />
              </div>
              <div className="space-y-2 pt-2">
                <Label htmlFor="driver">Driver / PPD String</Label>
                <Input 
                  id="driver" 
                  value={newPrinterDriver} 
                  onChange={(e) => setNewPrinterDriver(e.target.value)} 
                  placeholder="e.g. everywhere or foo2zjs:0/ppd/..." 
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddPrinterOpen(false)}>Cancel</Button>
              <Button onClick={handleAddPrinter} disabled={!selectedDeviceUri || !newPrinterName || !newPrinterDriver}>Install Printer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {printers.map((printer) => (
          <Card key={printer.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{printer.name}</CardTitle>
              <Printer className={`h-4 w-4 ${printer.status === 'offline' ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-bold">{printer.queue} <span className="text-sm font-normal text-muted-foreground">in queue</span></div>
                  <p className="text-xs text-muted-foreground mt-1">{printer.ip}</p>
                </div>
                <div className="text-right">
                  <Badge variant={printer.status === "online" ? "default" : printer.status === "printing" ? "secondary" : "destructive"}>
                    {printer.status}
                  </Badge>
                  <div className="mt-2 text-xs flex items-center justify-end gap-2">
                    Toner: 
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${printer.toner < 20 ? 'bg-destructive' : 'bg-primary'}`} 
                        style={{ width: `${printer.toner}%` }}
                      />
                    </div>
                    {printer.toner}%
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="w-full">Test Page</Button>
                <Button variant="outline" size="icon" className="shrink-0"><Settings className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Print Jobs</CardTitle>
          <CardDescription>Currently printing and queued jobs across all printers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Printer</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.document}</TableCell>
                  <TableCell>{job.user}</TableCell>
                  <TableCell>{job.printer}</TableCell>
                  <TableCell>{job.pages}</TableCell>
                  <TableCell>
                    <Badge variant={job.status === 'printing' ? 'default' : 'secondary'} className={job.status === 'printing' ? 'bg-blue-500/10 text-blue-500' : ''}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {job.status === 'printing' ? (
                      <Button variant="outline" size="icon" className="h-8 w-8"><Pause className="h-4 w-4" /></Button>
                    ) : (
                      <Button variant="outline" size="icon" className="h-8 w-8"><Play className="h-4 w-4" /></Button>
                    )}
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Stored Documents</CardTitle>
            <CardDescription>Upload files to your server and print them directly from here.</CardDescription>
          </div>
          <div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storedFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    No documents stored on the server.
                  </TableCell>
                </TableRow>
              ) : storedFiles.map((file) => (
                <TableRow key={file.name}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    {file.name}
                  </TableCell>
                  <TableCell>{(file.size / 1024).toFixed(1)} KB</TableCell>
                  <TableCell>{new Date(file.modified).toLocaleString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleFileAction(file.name, 'print')}>
                      <PrinterIcon className="mr-2 h-3 w-3" /> Print
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleFileAction(file.name, 'download')}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleFileAction(file.name, 'delete')}>
                      <Trash2 className="h-4 w-4" />
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
