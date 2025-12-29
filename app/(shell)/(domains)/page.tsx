import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Personal Command Center — V1
          </h1>
          <p className="text-muted-foreground">
            Foundation is live. Next: shell layout + domain routes + DB-first schema.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              UI primitives installed (shadcn/ui). Ready for shell.
            </div>
            <Button>All good</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
