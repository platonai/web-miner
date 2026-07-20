# WebMiner — Extract Structured Data from Local HTML Files

WebMiner analyzes a directory of web pages, identifies recurring content patterns
and data tables, and exports the results as HTML reports and Excel spreadsheets.
Everything runs locally — no network calls, no data leaves your machine.

## Quick Start

```bash
java -jar scent-miner.jar --input /path/to/html/files
```

The miner scans all `*.html` / `*.htm` files in the input directory, extracts
structured tables, and writes the results to `<input-dir>-views/`.

## Options

| Flag | Default | Purpose |
|------|---------|---------|
| `--input, -i <path>` | *required* | Directory containing `*.html` / `*.htm` files |
| `--component-selector, -c <css>` | *(none)* | CSS selector for the main content area on each page |
| `--require-size <bytes>` | `500000` | Minimum page size in bytes (smaller pages are skipped) |
| `--limit, -l <N>` | `0` (no limit) | Load at most N pages from the input directory |
| `--no-trust-samples` | off | Validate and clean samples instead of trusting them |
| `--help, -h` | — | Print usage and exit |

## Examples

```bash
# Mine product pages from a local dump
java -jar scent-miner.jar --input /data/amazon-pages

# Custom CSS selector for a different site layout
java -jar scent-miner.jar \
    --input /data/ebay-pages \
    --component-selector "#mainContent"

# Limit to the first 50 pages for a quick test run
java -jar scent-miner.jar \
    --input /data/pages \
    --limit 50

# Validate samples (disable trust) for stricter extraction
java -jar scent-miner.jar \
    --input /data/pages \
    --no-trust-samples

# Skip small stub pages with a higher size threshold
java -jar scent-miner.jar \
    --input /data/pages \
    --require-size 1000000
```

## Output

```
<input-dir>-views/
  └── views/
      ├── index.html          # HTML report of extracted tables
      ├── *.xlsx              # Excel export of tabulated data
      └── ...
```

Open `index.html` in a browser to browse the extracted data, or load the
`.xlsx` files in Excel for further analysis.

## Tips

- **Page size matters** — WebMiner skips files smaller than `--require-size`
  (default 500 KB) to avoid processing error pages, redirects, or stubs. Adjust
  this threshold if your pages are unusually small or large.
- **Component selector** — use `--component-selector` to narrow the mining
  scope to the main content block on each page. For example, `#ppd` works for
  Amazon product pages. Point it at the DOM element that wraps the
  repeating content you want to extract (product details, search results, etc.).
- **Trust vs. validate** — by default WebMiner trusts that samples are
  well-formed and uses them directly. Pass `--no-trust-samples` to validate and
  clean every sample first, which produces higher-quality output at the cost of
  slower processing.
- **Input files** — only `*.html` and `*.htm` files are processed. Other files
  in the directory are ignored.
- **Offline only** — WebMiner works with pre-downloaded HTML files. Use a
  separate tool (browser save, wget, or a crawler) to fetch pages first.
