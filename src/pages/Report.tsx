import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Server, Network, Flame, ShieldAlert } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function Report() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await fetchApi('/api/system/report_data');
        setReportData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center text-muted-foreground">Gathering Datacenter Architecture Data...</div>;
  }

  if (!reportData) {
    return <div className="h-full flex items-center justify-center text-red-500">Failed to load report data.</div>;
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-auto">
      {/* Non-printable Header */}
      <div className="flex items-center justify-between shrink-0 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Global System Report</h1>
          <p className="text-muted-foreground">Comprehensive overview of your Datacenter's current state and configurations.</p>
        </div>
        <Button onClick={handlePrint} variant="default" className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      {/* Printable Report Content */}
      <div className="print:block print:text-black print:bg-white print:p-8 space-y-8 max-w-4xl mx-auto w-full">
        
        {/* Cover Section */}
        <div className="border-b pb-6 print:border-black/20">
          <div className="flex items-center gap-3 mb-2">
            <Server className="h-8 w-8 print:text-black text-primary" />
            <h1 className="text-4xl font-black tracking-tighter uppercase print:text-black">Nissi Server Console</h1>
          </div>
          <h2 className="text-xl text-muted-foreground print:text-gray-600">Datacenter Architecture Report</h2>
          <p className="text-sm mt-4 font-mono text-muted-foreground print:text-gray-500">Generated: {reportData.report_time}</p>
        </div>

        {/* Nodes Architecture */}
        <section>
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase tracking-wider print:text-black">
            <Network className="h-5 w-5" /> Swarm Topology
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportData.nodes.length === 0 && <p className="text-sm text-muted-foreground">No Swarm Nodes Detected.</p>}
            {reportData.nodes.map((n: any) => (
              <Card key={n.id} className="print:shadow-none print:border-black/20 border-[#333]">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{n.hostname}</h4>
                    <span className="text-xs font-mono px-2 py-1 bg-muted rounded-full print:border print:border-black/20">{n.role}</span>
                  </div>
                  <div className="space-y-1 text-sm font-mono text-muted-foreground print:text-gray-700">
                    <div>ID: {n.id.substring(0, 12)}</div>
                    <div>IP Address: {n.ip || 'Unknown'}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`h-2 w-2 rounded-full ${n.state === 'ready' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      {n.state}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* SOS Configuration */}
        <section>
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4 uppercase tracking-wider print:text-black">
            <Flame className="h-5 w-5 text-red-500 print:text-black" /> Thermal Watchdog Policy
          </h3>
          <Card className="print:shadow-none print:border-black/20 border-red-500/20">
            <CardContent className="p-4">
              {reportData.sos_config.enabled ? (
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex items-center gap-2 text-green-500 print:text-black font-bold">
                    <ShieldAlert className="h-4 w-4" />
                    WATCHDOG ARMED
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase">Target Email</span>
                      {reportData.sos_config.email}
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase">Critical Threshold</span>
                      <span className="text-red-500 font-bold print:text-black">{reportData.sos_config.threshold}°C</span>
                    </div>
                  </div>
                  <div className="pt-2 text-xs text-muted-foreground print:text-gray-500 border-t border-border print:border-black/10 mt-2">
                    * If any node exceeds the critical threshold, an emergency dispatch will be fired via Mailjet SMTP.
                  </div>
                </div>
              ) : (
                <div className="text-red-500 font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  WATCHDOG DISABLED - Datacenter is unprotected from thermal events.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}
