// LCS-based line diff for GitHub-style diff viewer.
// Returns a list of "hunks" — line-aligned old/new pairs with type:
//   - 'eq' : unchanged (same line in both)
//   - 'del' : in old only (removed)
//   - 'add' : in new only (added)

export type DiffLineType = "eq" | "del" | "add";

export interface DiffLine {
  type: DiffLineType;
  oldNo: number | null;
  newNo: number | null;
  text: string;
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

export interface DiffResult {
  lines: DiffLine[];
  stats: DiffStats;
}

function splitLines(text: string): string[] {
  if (!text) return [];
  return text.split(/\r?\n/);
}

/** Build LCS DP table */
function buildLcs(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  return dp;
}

export function diffLines(oldText: string, newText: string): DiffResult {
  const a = splitLines(oldText);
  const b = splitLines(newText);
  const dp = buildLcs(a, b);

  const lines: DiffLine[] = [];
  const stats: DiffStats = { added: 0, removed: 0, unchanged: 0 };

  let i = 0;
  let j = 0;
  let oldNo = 1;
  let newNo = 1;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lines.push({ type: "eq", oldNo, newNo, text: a[i] });
      stats.unchanged++;
      i++;
      j++;
      oldNo++;
      newNo++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      lines.push({ type: "del", oldNo, newNo: null, text: a[i] });
      stats.removed++;
      i++;
      oldNo++;
    } else {
      lines.push({ type: "add", oldNo: null, newNo, text: b[j] });
      stats.added++;
      j++;
      newNo++;
    }
  }
  while (i < a.length) {
    lines.push({ type: "del", oldNo, newNo: null, text: a[i] });
    stats.removed++;
    i++;
    oldNo++;
  }
  while (j < b.length) {
    lines.push({ type: "add", oldNo: null, newNo, text: b[j] });
    stats.added++;
    j++;
    newNo++;
  }

  return { lines, stats };
}

/**
 * Build "split" view rows — each row has aligned old and new sides.
 * For a `del`+`add` pair adjacent, render as a single row (modified line);
 * unchanged → both sides same; pure del → only left; pure add → only right.
 */
export interface SplitRow {
  left: { lineNo: number | null; text: string; type: "eq" | "del" | "empty" };
  right: { lineNo: number | null; text: string; type: "eq" | "add" | "empty" };
}

export function toSplitRows(diff: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let i = 0;
  while (i < diff.length) {
    const cur = diff[i];
    if (cur.type === "eq") {
      rows.push({
        left: { lineNo: cur.oldNo, text: cur.text, type: "eq" },
        right: { lineNo: cur.newNo, text: cur.text, type: "eq" },
      });
      i++;
      continue;
    }

    // Pair del with subsequent add to align on same row
    if (cur.type === "del") {
      const dels: DiffLine[] = [];
      while (i < diff.length && diff[i].type === "del") {
        dels.push(diff[i]);
        i++;
      }
      const adds: DiffLine[] = [];
      while (i < diff.length && diff[i].type === "add") {
        adds.push(diff[i]);
        i++;
      }
      const max = Math.max(dels.length, adds.length);
      for (let k = 0; k < max; k++) {
        const d = dels[k];
        const a = adds[k];
        rows.push({
          left: d
            ? { lineNo: d.oldNo, text: d.text, type: "del" }
            : { lineNo: null, text: "", type: "empty" },
          right: a
            ? { lineNo: a.newNo, text: a.text, type: "add" }
            : { lineNo: null, text: "", type: "empty" },
        });
      }
      continue;
    }

    // Pure add (no preceding del)
    if (cur.type === "add") {
      rows.push({
        left: { lineNo: null, text: "", type: "empty" },
        right: { lineNo: cur.newNo, text: cur.text, type: "add" },
      });
      i++;
    }
  }
  return rows;
}
