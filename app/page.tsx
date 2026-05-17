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
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl space-y-6">
        <div className="space-y-3">
          <Badge variant="secondary">Project setup</Badge>
          <h1 className="text-3xl font-semibold text-foreground">scōre.</h1>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">
            AI-powered SEO reports are being built.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SEO analyzer foundation</CardTitle>
            <CardDescription>
              The app shell, theme, fonts, and component primitives are ready
              for the next feature task.
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
    </main>
  );
}
