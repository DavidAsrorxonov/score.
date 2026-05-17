import {
  AlertTriangle,
  Copy,
  FileText,
  Gauge,
  Link2,
  Search,
  Share2,
} from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { PageContainer } from "@/components/app/page-container";
import { PageHeader } from "@/components/app/page-header";
import { DeveloperChecklist } from "@/components/reports/developer-checklist";
import { FindingCard } from "@/components/reports/finding-card";
import { FindingList } from "@/components/reports/finding-list";
import { RecommendationList } from "@/components/reports/recommendation-list";
import { ReportHeader } from "@/components/reports/report-header";
import { ReportSection } from "@/components/reports/report-section";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { MetricCard } from "@/components/shared/metric-card";
import { ScoreCard } from "@/components/shared/score-card";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { UsageMeter } from "@/components/shared/usage-meter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const longUrl =
  "https://example.com/products/enterprise-seo-audit-platform/technical-report?utm_source=preview&utm_campaign=design-system";

const findings = [
  {
    title: "Missing meta description",
    category: "Metadata",
    severity: "high" as const,
    affectedUrl: longUrl,
    description:
      "This page does not include a meta description for search result snippets.",
    evidence: '<meta name="description" content="">',
    recommendation:
      "Add a unique meta description between 120 and 160 characters.",
  },
  {
    title: "Viewport tag present",
    category: "Technical SEO",
    severity: "passed" as const,
    affectedUrl: "https://example.com",
    description: "The page includes a viewport tag for responsive rendering.",
  },
];

export default function UiPreviewPage() {
  return (
    <AppShell activeHref="/reports" userLabel="Design preview">
      <PageContainer className="space-y-8">
        <PageHeader
          eyebrow="Feature 02"
          title="UI design system"
          description="Static previews for reusable scōre. layout, state, score, usage, status, severity, and report components."
          actions={
            <>
              <Button variant="outline">
                <Copy aria-hidden="true" />
                Copy URL
              </Button>
              <Button>
                <Search aria-hidden="true" />
                Analyze a URL
              </Button>
            </>
          }
        />

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Inputs and actions</CardTitle>
              <CardDescription>
                Form controls are presentational in this preview.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="preview-url"
                  className="text-sm font-medium text-foreground"
                >
                  URL
                </label>
                <Input id="preview-url" value="https://example.com" readOnly />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="preview-select"
                  className="text-sm font-medium text-foreground"
                >
                  Report area
                </label>
                <Select defaultValue="metadata">
                  <SelectTrigger id="preview-select" className="w-full">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metadata">Metadata</SelectItem>
                    <SelectItem value="technical">Technical SEO</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="preview-notes"
                  className="text-sm font-medium text-foreground"
                >
                  Notes
                </label>
                <Textarea
                  id="preview-notes"
                  readOnly
                  value="Static preview copy for future report annotations."
                />
              </div>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Share report"
                    >
                      <Share2 aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share report</TooltipContent>
                </Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">More</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Export PDF</DropdownMenuItem>
                    <DropdownMenuItem>Copy share link</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Preview dialog</DialogTitle>
                      <DialogDescription>
                        Dialog styling uses shared tokens and does not perform
                        product actions.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter showCloseButton>
                      <Button>Confirm</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
              <CardDescription>Free-tier usage display.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <UsageMeter used={3} limit={5} />
              <UsageMeter used={5} limit={5} label="Limit state" />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ScoreCard label="Overall SEO" score={82} description="Mock score" />
          <ScoreCard label="Metadata" score={64} trend="-8 vs previous" />
          <MetricCard
            label="Issues found"
            value={12}
            description="Static report metric"
            icon={<AlertTriangle className="size-4" aria-hidden="true" />}
          />
          <MetricCard
            label="URLs analyzed"
            value="1"
            description="V1 single-page scope"
            icon={<Gauge className="size-4" aria-hidden="true" />}
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Badges and states</CardTitle>
            <CardDescription>
              Status and severity labels include text, not color alone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="queued" />
              <StatusBadge status="validating" />
              <StatusBadge status="fetching" />
              <StatusBadge status="analyzing" />
              <StatusBadge status="generating_report" />
              <StatusBadge status="generating_pdf" />
              <StatusBadge status="completed" />
              <StatusBadge status="failed" />
            </div>
            <div className="flex flex-wrap gap-2">
              <SeverityBadge severity="critical" />
              <SeverityBadge severity="high" />
              <SeverityBadge severity="medium" />
              <SeverityBadge severity="low" />
              <SeverityBadge severity="info" />
              <SeverityBadge severity="passed" />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="empty">
          <TabsList>
            <TabsTrigger value="empty">States</TabsTrigger>
            <TabsTrigger value="loading">Loading</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
          <TabsContent value="empty" className="space-y-4">
            <EmptyState
              title="No reports yet"
              description="Completed scans will appear here once scan creation exists."
              icon={<FileText className="size-4" aria-hidden="true" />}
              action={<Button variant="outline">Create first scan</Button>}
            />
            <ErrorState
              title="Report could not be loaded"
              description="This is a recoverable UI error preview."
              action={<Button variant="outline">Try again</Button>}
            />
          </TabsContent>
          <TabsContent value="loading">
            <LoadingState variant="report" />
          </TabsContent>
          <TabsContent value="table">
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="max-w-[18rem] break-all font-mono text-xs">
                      {longUrl}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status="completed" />
                    </TableCell>
                    <TableCell>82</TableCell>
                    <TableCell>12</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <ReportSection
          title="Report primitives"
          description="Static report header, findings, recommendations, and developer checklist."
        >
          <div className="space-y-6">
            <ReportHeader
              title="Example.com SEO report"
              analyzedUrl={longUrl}
              finalUrl="https://example.com/"
              scannedAt="Preview scan date"
              actions={
                <>
                  <Button variant="outline">
                    <Link2 aria-hidden="true" />
                    Share
                  </Button>
                  <Button variant="outline">Export PDF</Button>
                </>
              }
            />
            <FindingList findings={findings} />
            <FindingCard
              title="Long URL wrapping check"
              category="Technical evidence"
              severity="info"
              affectedUrl={longUrl}
              description="This component keeps long technical values inside the layout."
              evidence={longUrl}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <RecommendationList
                items={[
                  {
                    title: "Rewrite missing metadata",
                    description:
                      "Use concise page-specific descriptions that match search intent.",
                    priority: "High priority",
                  },
                  {
                    title: "Review heading structure",
                    description:
                      "Keep one clear H1 and use H2/H3 headings for section hierarchy.",
                    priority: "Medium",
                  },
                ]}
              />
              <DeveloperChecklist
                items={[
                  {
                    label: "Add a unique meta description",
                    description: "Place it in the document head.",
                  },
                  {
                    label: "Confirm canonical URL",
                    description: "Use the final preferred HTTPS URL.",
                    checked: true,
                  },
                ]}
              />
            </div>
            <Accordion type="single" collapsible>
              <AccordionItem value="details">
                <AccordionTrigger>Evidence details</AccordionTrigger>
                <AccordionContent>
                  <p className="break-all font-mono text-xs leading-5 text-muted-foreground">
                    {longUrl}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ReportSection>

        <section className="dark rounded-lg border border-border bg-background p-4 text-foreground">
          <ReportSection
            title="Dark mode token check"
            description="This nested preview applies the .dark class without a toggle."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <ScoreCard label="Dark score" score={76} />
              <MetricCard label="Dark metric" value="24 ms" />
              <Card>
                <CardHeader>
                  <CardTitle>Dark card</CardTitle>
                  <CardDescription>Theme variables drive colors.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <StatusBadge status="failed" />
                  <SeverityBadge severity="critical" />
                </CardContent>
              </Card>
            </div>
          </ReportSection>
        </section>
      </PageContainer>
    </AppShell>
  );
}
