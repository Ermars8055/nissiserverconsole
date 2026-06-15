import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch, ExternalLink, ShieldCheck, HardDrive, Terminal } from "lucide-react";

export default function GitServer() {
  const giteaUrl = `http://${window.location.hostname}:3030`;

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-auto">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <GitBranch className="h-8 w-8 text-orange-500" />
            Source Code Vault
          </h1>
          <p className="text-muted-foreground">Your completely private, self-hosted Git server powered by Gitea.</p>
        </div>
        <Button onClick={() => window.open(giteaUrl, '_blank')} variant="default" className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
          <ExternalLink className="h-4 w-4" />
          Launch Git Console
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Features */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-6 w-6 text-orange-500 mt-1 shrink-0" />
                <div>
                  <h3 className="font-bold">Total Privacy</h3>
                  <p className="text-sm text-muted-foreground">Your source code never leaves your datacenter. No third-party servers, no Microsoft tracking.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <HardDrive className="h-6 w-6 text-orange-500 mt-1 shrink-0" />
                <div>
                  <h3 className="font-bold">NFS Vault Integration</h3>
                  <p className="text-sm text-muted-foreground">All Git data is hard-mounted to `/mnt/swarm_storage/gitea`. It is automatically included in your 1-click datacenter backups.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Terminal className="h-6 w-6 text-orange-500 mt-1 shrink-0" />
                <div>
                  <h3 className="font-bold">Full Git Support</h3>
                  <p className="text-sm text-muted-foreground">Supports standard Git commands via Web (Port 3030) or secure SSH (Port 222).</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Start */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Terminal className="h-5 w-5" /> Quick Start Guide
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-sm mb-2 text-muted-foreground uppercase tracking-wider">1. Initial Setup</h4>
                  <p className="text-sm mb-2">Click the "Launch Git Console" button above to access Gitea. Since this is the first boot, you will need to register the first admin account. Do not change the database settings (it uses built-in SQLite).</p>
                </div>

                <div>
                  <h4 className="font-bold text-sm mb-2 text-muted-foreground uppercase tracking-wider">2. Cloning a Repository</h4>
                  <p className="text-sm mb-2">Once you create a repo, clone it to your local machine using HTTP:</p>
                  <pre className="bg-muted p-3 rounded-md font-mono text-sm border border-border overflow-x-auto">
                    git clone http://{window.location.hostname}:3030/your_user/your_repo.git
                  </pre>
                </div>

                <div>
                  <h4 className="font-bold text-sm mb-2 text-muted-foreground uppercase tracking-wider">3. Pushing Existing Code</h4>
                  <p className="text-sm mb-2">To move an existing project from GitHub to your private vault:</p>
                  <pre className="bg-muted p-3 rounded-md font-mono text-sm border border-border overflow-x-auto whitespace-pre-wrap">
                    git remote add origin http://{window.location.hostname}:3030/your_user/your_repo.git{'\n'}
                    git push -u origin main
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-bold text-sm mb-2 text-muted-foreground uppercase tracking-wider">4. SSH Configuration</h4>
                  <p className="text-sm mb-2">If you prefer SSH, Gitea listens on Port 222. Add your public key in the Gitea UI and use:</p>
                  <pre className="bg-muted p-3 rounded-md font-mono text-sm border border-border overflow-x-auto">
                    git clone ssh://git@{window.location.hostname}:222/your_user/your_repo.git
                  </pre>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
