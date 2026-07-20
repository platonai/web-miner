# WebMiner

Extract structured data from local HTML files. WebMiner analyzes a directory of
web pages, identifies recurring patterns and data tables, and exports the
results as HTML reports and Excel spreadsheets.

## Quick Start

```bash
# Run with a directory of HTML files
java -jar scent-miner.jar --input /path/to/html/files
```

The miner scans all `*.html` / `*.htm` files in the input directory, extracts
structured tables, and writes the results to `<input-dir>-views/`.

## Usage

```
WebMiner --input <html-dir> [options]
```

### Options

| Flag | Default | Purpose |
|------|---------|---------|
| `--input, -i <path>` | *required* | Directory containing `*.html` / `*.htm` files |
| `--component-selector, -c <css>` | `#ppd` | CSS selector for the main content area on each page |
| `--require-size <bytes>` | `500000` | Minimum page size in bytes (smaller pages are skipped) |
| `--no-trust-samples` | off | Validate and clean samples instead of trusting them |
| `--help, -h` | — | Print usage |

### Examples

```bash
# Mine product pages from a local dump
java -jar scent-miner.jar --input /data/amazon-pages

# Custom CSS selector for a different site layout
java -jar scent-miner.jar \
    --input /data/ebay-pages \
    --component-selector "#mainContent"

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

## How It Works

WebMiner loads each HTML file, parses its structure and visual layout, detects
recurring content patterns across the document collection, and extracts
structured data tables from those patterns. The entire process runs locally —
no data leaves your machine.
