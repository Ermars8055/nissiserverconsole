// Mock data for server metrics and dashboards

export const mockSystemMetrics = {
  cpu: {
    usage: 45,
    history: Array.from({ length: 20 }, (_, i) => ({
      time: `10:${i < 10 ? "0" + i : i}`,
      usage: Math.floor(Math.random() * 40) + 20,
    })),
  },
  memory: {
    total: 32, // GB
    used: 18.5,
    history: Array.from({ length: 20 }, (_, i) => ({
      time: `10:${i < 10 ? "0" + i : i}`,
      usage: Math.floor(Math.random() * 20) + 40,
    })),
  },
  disk: {
    total: 1000, // GB
    used: 450,
  },
  network: {
    upload: "12.4 MB/s",
    download: "45.2 MB/s",
  },
  uptime: "45 Days, 12 Hours",
  runningContainers: 14,
  activeUsers: 3,
};

export const mockActivityFeed = [
  { id: 1, action: "Container 'postgres-db' restarted", time: "10 mins ago", type: "warning" },
  { id: 2, action: "User 'admin' logged in", time: "25 mins ago", type: "info" },
  { id: 3, action: "System backup completed", time: "1 hour ago", type: "success" },
  { id: 4, action: "High CPU usage detected", time: "2 hours ago", type: "error" },
];

export const mockContainers = [
  {
    id: "cont-001",
    name: "nginx-proxy",
    image: "nginx:latest",
    status: "running",
    ports: "80:80, 443:443",
    cpu: "2.5%",
    memory: "150 MB",
  },
  {
    id: "cont-002",
    name: "postgres-db",
    image: "postgres:14",
    status: "running",
    ports: "5432:5432",
    cpu: "12.0%",
    memory: "1.2 GB",
  },
  {
    id: "cont-003",
    name: "redis-cache",
    image: "redis:alpine",
    status: "stopped",
    ports: "6379:6379",
    cpu: "0%",
    memory: "0 MB",
  },
  {
    id: "cont-004",
    name: "nextjs-frontend",
    image: "my-app:v2.1",
    status: "running",
    ports: "3000:3000",
    cpu: "5.4%",
    memory: "450 MB",
  },
];
