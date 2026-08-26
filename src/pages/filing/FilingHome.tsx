import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { PageCard, Tag } from "@/components/reports/ReportPrimitives";
import { FilingYearSelect } from "@/components/filing/FilingYearSelect";
import { Button } from "@/components/ui/button";
import {
  Files, ClipboardList, ArrowRight, AlertTriangle, History, Archive,
  Trash2, Plus, CheckCircle2, Stamp,
} from "lucide-react";
import { defaultYear } from "@/lib/services/tax.service";
import {
  useAfsComponents, useFilingPack, useFilingHistory,
} from "@/hooks/filing/use-filing";
import { filingRepository } from "@/lib/repositories/filing.repository";
import { resolveClassification } from "@/lib/services/afs.service";
import { useOrgSettings } from "@/stores/org-settings.store";
import { formatDate } from "@/lib/utils/format";
import { toast } from "sonner";

export default function FilingHome() {
  const [year, setYear] = useState<number>(defaultYear());
  const citSetting = useOrgSettings((s) => s.taxConfig.citClassification);
  const classification = resolveClassification(year, citSetting);

  const { data: components } = useAfsComponents();
  const { data: pack } = useFilingPack(year);
  const { generated, archive } = useFilingHistory();
  const record = generated[year];
  const stale = record ? filingRepository.isStale(year) : false;

  return (
    <AppShell title="Filing & Documentation">
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Filing & Documentation
            </div>
            <h1 className="text-xl font-semibold mt-1">Filing Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Statutory accounts and the Rev360 filing pack — one fiscal year at a time.
            </p>
          </div>
          <FilingYearSelect value={year} onChange={setYear} />
        </header>

        {/* The two concepts, kept deliberately distinct */}
        <div className="cl-card border border-primary/30 bg-primary/5 p-4 text-[13px] text-foreground flex gap-3">
          <Stamp className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          <p>
            <span className="font-semibold">Two different things live here.</span>{" "}
            The <span className="font-semibold">Audited Financial Statement</span> is a statutory
            accounting artifact shaped by ICAN conventions — independent of any tax portal. The{" "}
            <span className="font-semibold">Rev360 Filing Pack</span> is a tax-season checklist of
            what the NRS Rev360 portal currently asks you to upload. They are generated, tracked and
            exported separately.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AFS panel */}
          <PageCard>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-primary/12 text-primary flex items-center justify-center">
                  <Files className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">
                    Audited Financial Statement
                  </h2>
                  <p className="text-[12px] text-muted-foreground">
                    Seven-part statutory account pack · FY {year}
                  </p>
                </div>
              </div>
              <Tag tone="primary">{classification} Company</Tag>
            </div>

            <ol className="space-y-1 mb-4">
              {(components ?? []).map((c) => (
                <li key={c.id} className="flex items-center gap-2.5 text-[13px] text-foreground">
                  <span className="mono text-[11px] text-muted-foreground w-4 text-right">{c.no}.</span>
                  <span className="flex-1 truncate">{c.title}</span>
                  {c.isNewComputation && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">new</span>
                  )}
                </li>
              ))}
            </ol>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
              <GenerationStatus year={year} />
              <Button asChild size="sm">
                <Link to="/filing/audited-statements">
                  Open AFS <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </PageCard>

          {/* Rev360 pack panel */}
          <PageCard>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-success/15 text-success flex items-center justify-center">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">Rev360 Filing Pack</h2>
                  <p className="text-[12px] text-muted-foreground">
                    NRS portal checklist · CIT annual filing · FY {year}
                  </p>
                </div>
              </div>
              <Tag tone="success">{pack?.readyCount ?? 0}/{pack?.items.length ?? 0} ready</Tag>
            </div>

            <ul className="space-y-1 mb-4">
              {(pack?.items ?? []).map((i) => (
                <li key={i.id} className="flex items-center gap-2.5 text-[13px] text-foreground">
                  {i.status === "ready" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                  )}
                  <span className="flex-1 truncate">{i.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {i.status === "ready" ? "ready" : i.status === "external" ? "external" : "n/a"}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
              <p className="text-[11px] text-muted-foreground">
                Rev360 has no API — you upload each document manually.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link to="/filing/filing-pack">
                  Open Filing Pack <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </PageCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generation history */}
          <PageCard
            title={
              <span className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" /> Generation History
              </span>
            }
          >
            {Object.keys(generated).length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No AFS has been generated yet. Open the Audited Financial Statement for a year and
                mark it as generated — historical copies remain retrievable without regenerating.
              </p>
            ) : (
              <div className="space-y-2">
                {Object.values(generated)
                  .sort((a, b) => b.year - a.year)
                  .map((r) => {
                    const rStale = filingRepository.isStale(r.year);
                    return (
                      <div
                        key={r.year}
                        className="flex items-center justify-between gap-3 text-[13px] border border-border rounded-lg px-3 py-2"
                      >
                        <span className="font-semibold">FY {r.year}</span>
                        <span className="text-muted-foreground text-[12px] flex-1">
                          v{r.version} · {formatDate(r.generatedAt)}
                        </span>
                        {rStale ? (
                          <Tag tone="warning">Data changed since</Tag>
                        ) : (
                          <Tag tone="success">Current</Tag>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </PageCard>

          {/* Optional personal archive */}
          <ArchiveCard year={year} archive={archive} />
        </div>
      </div>
    </AppShell>
  );
}

function GenerationStatus({ year }: { year: number }) {
  const { generated } = useFilingHistory();
  const record = generated[year];
  if (!record) {
    return <p className="text-[11px] text-muted-foreground">Not generated yet for FY {year}.</p>;
  }
  const stale = filingRepository.isStale(year);
  return (
    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
      {stale && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
      Generated {formatDate(record.generatedAt)} · v{record.version}
      {stale && <span className="text-warning font-medium">— underlying data changed</span>}
    </p>
  );
}

function ArchiveCard({
  year, archive,
}: { year: number; archive: ReturnType<typeof useFilingHistory>["archive"] }) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  const add = () => {
    if (!title.trim()) {
      toast.error("Give the archived copy a title first.");
      return;
    }
    filingRepository.addArchiveEntry(year, title.trim(), note.trim() || undefined);
    setTitle("");
    setNote("");
    toast.success("Archived copy recorded.");
  };

  return (
    <PageCard
      title={
        <span className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-muted-foreground" /> Personal Archive
          <Tag tone="muted">Optional</Tag>
        </span>
      }
    >
      <p className="text-[12px] text-muted-foreground mb-3">
        Record references to your signed AFS copies for personal recordkeeping only. Nothing in the
        filing flow depends on this — auditor sign-off happens outside Core Ledger.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`e.g. Signed AFS FY ${year} (A. Auditor & Co.)`}
          className="h-9 flex-1 min-w-[200px] rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="h-9 w-44 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      {archive.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">No archived copies recorded.</p>
      ) : (
        <div className="space-y-2">
          {archive.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 text-[13px] border border-border rounded-lg px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{e.title}</div>
                <div className="text-[11px] text-muted-foreground">
                  FY {e.year} · added {formatDate(e.addedAt)}{e.note ? ` · ${e.note}` : ""}
                </div>
              </div>
              <button
                onClick={() => filingRepository.removeArchiveEntry(e.id)}
                className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10"
                aria-label="Remove archive entry"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </PageCard>
  );
}
