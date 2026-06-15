import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchApi } from '@/lib/api';
import { File, Folder, Trash2, Upload, FileText, Image as ImageIcon, Video, Music, Archive, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileItem {
  name: string;
  size: number;
  modified: string;
  type: string;
}

export default function Storage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/storage/list');
      setFiles(data);
    } catch (err) {
      console.error('Failed to load files', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (['mp4', 'mkv', 'avi'].includes(ext || '')) return <Video className="h-5 w-5 text-purple-500" />;
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return <Music className="h-5 w-5 text-yellow-500" />;
    if (['zip', 'rar', 'tar', 'gz'].includes(ext || '')) return <Archive className="h-5 w-5 text-red-500" />;
    if (['txt', 'md', 'csv', 'json', 'xml'].includes(ext || '')) return <FileText className="h-5 w-5 text-green-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const handleDelete = async (filename: string) => {
    if (confirm(`Are you sure you want to delete ${filename}?`)) {
      try {
        await fetchApi(`/api/storage/delete/${encodeURIComponent(filename)}`, { method: 'DELETE' });
        loadFiles();
      } catch (err) {
        alert('Failed to delete file');
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/storage/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        loadFiles();
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Vault</h1>
          <p className="text-muted-foreground">Manage files shared across your Docker Swarm cluster.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={loadFiles}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <Button onClick={handleUploadClick} disabled={uploading}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Folder className="h-5 w-5 text-yellow-500"/> /mnt/swarm_storage</CardTitle>
          <CardDescription>All files stored here are instantly accessible by every node in your cluster.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading files...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-md">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Your vault is currently empty.</p>
              <p className="text-sm mt-1">Upload files to share them across the Swarm.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium">Last Modified</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.name} className="border-t hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium flex items-center gap-3">
                        {getFileIcon(file.name)}
                        {file.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatBytes(file.size)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(file.modified).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(file.name)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
