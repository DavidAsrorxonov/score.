import { PublicAuthActions } from "@/components/marketing/public-auth-actions";
import { PublicShell } from "@/components/marketing/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <PublicShell actions={<PublicAuthActions />}>
      <section className="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-xl flex-col justify-center px-6 py-16">
        <div className="space-y-3">
          <Badge variant="secondary">Authentication setup</Badge>
          <h1 className="text-3xl font-semibold text-foreground">scōre.</h1>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">
            AI-powered SEO reports are being built behind secure accounts.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SEO analyzer foundation</CardTitle>
            <CardDescription>
              The app shell, theme, fonts, component primitives, and
              authentication routes are ready for the next feature task.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              disabled
              aria-label="URL input preview"
              placeholder="https://example.com"
            />
            <Separator />
            <p className="text-xs leading-5 text-muted-foreground">
              URL scanning is not available in this setup step.
            </p>
          </CardContent>
          <CardFooter>
            <Button disabled>Setup in progress</Button>
          </CardFooter>
        </Card>
      </section>
    </PublicShell>
  );
}
