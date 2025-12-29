import { getLatestManifests } from "@/lib/selectors/systemHealth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function chipClass(kind: "FRESH" | "STALE" | "UNKNOWN") {
  if (kind === "FRESH") return "bg-emerald-50 text-emerald-700";
  if (kind === "STALE") return "bg-amber-50 text-amber-700";
  return "bg-muted text-muted-foreground";
}

export default async function SystemHealthPage() {
  const manifests = await getLatestManifests();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
        <p className="text-sm text-muted-foreground">
          Provenance + freshness visibility (deterministic, DB-backed).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Source Manifests (latest per domain)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Domain</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Freshness</th>
                  <th className="py-2 pr-4">Age (hrs)</th>
                  <th className="py-2 pr-4">As Of</th>
                  <th className="py-2 pr-4">Ingested</th>
                  <th className="py-2 pr-4">Rows</th>
                  <th className="py-2 pr-4">Source Ref</th>
                  <th className="py-2 pr-4">Message</th>
                </tr>
              </thead>
              <tbody>
                {manifests.length === 0 ? (
                  <tr>
                    <td className="py-3 text-muted-foreground" colSpan={9}>
                      No manifests found. Run <code>npm run db:seed</code>.
                    </td>
                  </tr>
                ) : (
                  manifests.map((m) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{m.domain}</td>
                      <td className="py-2 pr-4">{m.status}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${chipClass(
                            m.freshness
                          )}`}
                        >
                          {m.freshness}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        {m.ageHours === null ? "—" : m.ageHours.toFixed(1)}
                      </td>
                      <td className="py-2 pr-4">{formatDate(m.asOf)}</td>
                      <td className="py-2 pr-4">{formatDate(m.ingestedAt)}</td>
                      <td className="py-2 pr-4">{m.rowCount}</td>
                      <td className="py-2 pr-4">{m.sourceRef}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {m.message ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
