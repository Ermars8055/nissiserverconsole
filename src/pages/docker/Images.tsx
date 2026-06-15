import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Trash2, DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Images() {
  const [images, setImages] = useState<any[]>([]);
  const [pullImageName, setPullImageName] = useState("");
  const [pulling, setPulling] = useState(false);

  const loadImages = async () => {
    try {
      const data = await fetchApi("/api/docker/images");
      setImages(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handlePull = async () => {
    if (!pullImageName) return;
    setPulling(true);
    try {
      await fetchApi("/api/docker/images/pull", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_name: pullImageName })
      });
      setPullImageName("");
      loadImages();
    } catch (err) {
      alert(`Failed to pull image ${pullImageName}`);
    } finally {
      setPulling(false);
    }
  };

  const handleDelete = async (id: string, tags: string[]) => {
    const name = tags[0];
    if (confirm(`Are you sure you want to delete image ${name}?`)) {
      try {
        await fetchApi(`/api/docker/images/${id}`, { method: 'DELETE' });
        loadImages();
      } catch (err) {
        alert(`Failed to delete image ${name}. It might be in use by a container.`);
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Docker Images</h2>
          <p className="text-muted-foreground">Manage and pull container images on the Leader node.</p>
        </div>
        <div className="flex gap-2 w-[400px]">
          <Input 
            placeholder="e.g. nginx:latest" 
            value={pullImageName}
            onChange={(e) => setPullImageName(e.target.value)}
          />
          <Button onClick={handlePull} disabled={pulling || !pullImageName}>
            <DownloadCloud className="mr-2 h-4 w-4" />
            {pulling ? "Pulling..." : "Pull Image"}
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 overflow-auto p-0">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[300px]">Repository:Tag</TableHead>
                <TableHead>Image ID</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {images.map((img) => (
                <TableRow key={img.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    {img.tags.join(", ")}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{img.id}</TableCell>
                  <TableCell>{formatBytes(img.size)}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(img.created).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(img.id, img.tags)}>
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
