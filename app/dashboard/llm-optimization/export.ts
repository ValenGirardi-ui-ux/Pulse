import { severityOrder, type Report } from "./data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en", { dateStyle: "long", timeStyle: "short" });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineCode(value: string) {
  return escapeHtml(value).replace(/&lt;[^&]*?&gt;/g, (tag) => `<code>${tag}</code>`);
}

function tone(score: number) {
  if (score >= 85) return "#10b981";
  if (score >= 70) return "#f59e0b";
  return "#ef4444";
}

export function reportFileName(report: Report, extension: string) {
  const day = report.analyzedAt.slice(0, 10);
  return `pulse-llm-optimization-${report.host}-${day}.${extension}`;
}

export function toMarkdown(report: Report) {
  const lines = [
    `# LLM optimization report: ${report.host}`,
    "",
    `- URL: ${report.url}`,
    `- Analyzed: ${formatDate(report.analyzedAt)}`,
    `- Pages checked: ${report.pages}`,
    `- Score: **${report.score}/100**`,
    "",
    "## Scores by area",
    "",
    "| Area | Score | Findings |",
    "| --- | --- | --- |",
    ...report.areaScores.map(({ area, score, findings }) => `| ${area} | ${score} | ${findings} |`),
  ];

  for (const severity of severityOrder) {
    const items = report.findings.filter((finding) => finding.severity === severity);
    if (items.length === 0) continue;
    lines.push("", `## ${severity} (${items.length})`);
    for (const finding of items) {
      lines.push(
        "",
        `### ${finding.title}`,
        "",
        `**Area:** ${finding.area} · **Effort:** ${finding.effort} · **Pages:** ${finding.pages.join(", ")}`,
        "",
        `**Why it matters:** ${finding.why}`,
        "",
        `**What we found:** ${finding.found}`,
        "",
        "**How to fix:**",
        "",
        ...finding.fix.map((step, index) => `${index + 1}. ${step}`),
      );
      if (finding.code) {
        lines.push("", `${finding.code.label}:`, "", "```" + finding.code.lang, finding.code.snippet, "```");
      }
    }
  }

  lines.push("", "## Passed checks", "", ...report.passed.map(({ area, title }) => `- ✓ ${title} (${area})`));
  return lines.join("\n") + "\n";
}

export function toHtml(report: Report) {
  const severityColor = { Critical: "#ef4444", High: "#f97316", Warning: "#f59e0b", Minor: "#c9cedd" } as const;

  const areaRows = report.areaScores
    .map(
      ({ area, score, findings }) => `
      <div class="area">
        <div class="area-head"><span>${area}</span><b>${score}</b></div>
        <div class="bar"><span style="width:${score}%;background:${tone(score)}"></span></div>
        <small>${findings === 0 ? "No issues" : `${findings} ${findings === 1 ? "finding" : "findings"}`}</small>
      </div>`,
    )
    .join("");

  const groups = severityOrder
    .map((severity) => {
      const items = report.findings.filter((finding) => finding.severity === severity);
      if (items.length === 0) return "";
      return `
      <h2><span class="dot" style="background:${severityColor[severity]}"></span>${severity} <small>${items.length}</small></h2>
      ${items
        .map(
          (finding) => `
        <article>
          <h3>${escapeHtml(finding.title)}</h3>
          <p class="meta">${finding.area} · Effort: ${finding.effort} · ${finding.pages.map(escapeHtml).join(", ")}</p>
          <p><b>Why it matters.</b> ${inlineCode(finding.why)}</p>
          <p><b>What we found.</b> ${inlineCode(finding.found)}</p>
          <p><b>How to fix</b></p>
          <ol>${finding.fix.map((step) => `<li>${inlineCode(step)}</li>`).join("")}</ol>
          ${
            finding.code
              ? `<p class="code-label">${escapeHtml(finding.code.label)}</p><pre><code>${escapeHtml(finding.code.snippet)}</code></pre>`
              : ""
          }
        </article>`,
        )
        .join("")}`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>LLM optimization report · ${escapeHtml(report.host)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #f7f7fa; color: #0f1a2e; font: 14px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
  .page { max-width: 820px; margin: 0 auto; padding: 48px 24px; }
  .brand { color: #4c2882; font-weight: 600; letter-spacing: -0.01em; }
  header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-end; margin: 24px 0 32px; }
  h1 { font-size: 26px; margin: 0; letter-spacing: -0.02em; }
  .sub { color: #8a91a3; font-size: 13px; margin: 4px 0 0; }
  .score { text-align: right; }
  .score b { font-size: 44px; line-height: 1; }
  .score span { color: #8a91a3; }
  .areas { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; margin-bottom: 40px; }
  .area { background: #fff; border: 1px solid rgba(0,0,0,.07); border-radius: 14px; padding: 12px 14px; }
  .area-head { display: flex; justify-content: space-between; font-size: 13px; }
  .bar { height: 4px; background: #f1f2f6; border-radius: 4px; margin: 8px 0 6px; overflow: hidden; }
  .bar span { display: block; height: 100%; }
  .area small { color: #8a91a3; font-size: 11px; }
  h2 { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #5b6478; margin: 32px 0 10px; }
  h2 small { color: #9aa1b2; font-weight: 400; }
  .dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
  article { background: #fff; border: 1px solid rgba(0,0,0,.07); border-radius: 14px; padding: 18px 20px; margin-bottom: 10px; break-inside: avoid; }
  h3 { margin: 0; font-size: 15px; }
  .meta { color: #8a91a3; font-size: 12px; margin: 2px 0 12px; }
  article p { margin: 8px 0; color: #3c4558; }
  ol { margin: 4px 0 8px; padding-left: 20px; color: #3c4558; }
  code { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 12px; background: #f4f5f8; padding: 1px 4px; border-radius: 4px; }
  pre { background: #0f1a2e; color: #e6e8ef; padding: 14px 16px; border-radius: 10px; overflow-x: auto; }
  pre code { background: none; padding: 0; color: inherit; }
  .code-label { font-size: 12px; color: #5b6478 !important; margin-top: 12px !important; }
  .passed { list-style: none; padding: 0; margin: 0; }
  .passed li { color: #5b6478; padding: 4px 0; }
  .passed li::before { content: "✓"; color: #10b981; margin-right: 10px; }
  footer { margin-top: 48px; color: #9aa1b2; font-size: 12px; }
  @media print { body { background: #fff; } .page { padding: 0; } }
</style>
</head>
<body>
<div class="page">
  <div class="brand">Pulse</div>
  <header>
    <div>
      <h1>LLM optimization report</h1>
      <p class="sub">${escapeHtml(report.url)} · ${formatDate(report.analyzedAt)} · ${report.pages} pages checked</p>
    </div>
    <div class="score"><b style="color:${tone(report.score)}">${report.score}</b><span>/100</span></div>
  </header>
  <div class="areas">${areaRows}</div>
  ${groups}
  <h2><span class="dot" style="background:#10b981"></span>Passed checks <small>${report.passed.length}</small></h2>
  <ul class="passed">${report.passed.map(({ title }) => `<li>${escapeHtml(title)}</li>`).join("")}</ul>
  <footer>Generated by Pulse · ${formatDate(report.analyzedAt)}</footer>
</div>
</body>
</html>
`;
}

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printHtml(html: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
  frame.srcdoc = html;
  frame.onload = () => {
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  };
  document.body.append(frame);
}
