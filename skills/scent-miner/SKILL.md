# WebMiner — Run the Scent ML Pipeline on Local HTML Files

WebMiner encodes HTML pages to feature vectors, clusters them with SMILE KMeans,
and exports the results as HTML reports and Excel spreadsheets.
Everything runs locally — no network calls, no data leaves your machine.

## Quick Start

```bash
java -jar scent-miner.jar all /path/to/html/files
```

The pipeline encodes all `*.html` / `*.htm` files, runs SMILE KMeans clustering
(k auto-detected), and builds browsable HTML/XLSX views.

## Commands

| Command | Args | Purpose |
|---------|------|---------|
| `encode` | `<html-dir>` | Encode HTML files → CSV feature vectors |
| `cluster` | `<csv-path>` | Run SMILE KMeans clustering |
| `views` | `[<result-dir>]` | Build HTML/XLSX views from clustering results |
| `all` | `<html-dir>` | Full pipeline: encode → cluster → views |

## Options

### encode / all

| Flag | Default | Purpose |
|------|---------|---------|
| `--output <path>` | auto-derived | Output directory or CSV path |
| `--max-files <n>` | `40` | Max HTML files to encode |

### cluster

| Flag | Default | Purpose |
|------|---------|---------|
| `--k <n>` | auto-detect | Number of clusters |
| `--output <dir>` | auto-derived | Output directory |

### Global

| Flag | Purpose |
|------|---------|
| `-am, --also-make` | Run all preceding pipeline stages first. The first positional arg becomes the HTML directory (pipeline root). |
| `--help, -h` | Print usage and exit |

## Examples

```bash
# Full pipeline (k auto-detected, encodes up to 40 files)
java -jar scent-miner.jar all /data/amazon-pages

# Full pipeline with custom k and file limit
java -jar scent-miner.jar all /data/amazon-pages --k 12 --max-files 50

# Full pipeline with resume (pick up where you left off)
java -jar scent-miner.jar all /data/amazon-pages --resume

# Encode only (limit to 20 files)
java -jar scent-miner.jar encode /data/amazon-pages --max-files 20

# Cluster an existing CSV (k auto-detected)
java -jar scent-miner.jar cluster /data/encoded.csv

# Cluster with explicit k
java -jar scent-miner.jar cluster /data/encoded.csv --k 8

# Build views from clustering results
java -jar scent-miner.jar views /data/results/kmeans-result/p1723201624

# Run cluster with dependencies (--also-make runs encode first)
java -jar scent-miner.jar cluster /data/amazon-pages -am --k 12
```

## Output

```
<html-dir>-ml-output/
  ├── encoded.csv              # Feature vectors from encode stage
  └── kmeans-result/
      └── p<timestamp>/
          ├── clusteringInfo.txt
          ├── predictionAndMinimalFeatures/
          │   └── ...
          └── predictionAndMinimalFeatures.views/
              ├── index.html    # HTML report of clustering results
              ├── *.xlsx        # Excel export
              └── ...
```

Open `index.html` in a browser to browse the clustering results, or load the
`.xlsx` files in Excel for further analysis.

## Tips

- **Auto-detected k** — when `--k` is omitted, WebMiner automatically determines
  the optimal number of clusters from the data distribution. This usually produces
  better results than a manually guessed value.
- **Resume** — if a pipeline is interrupted, use `--resume` to pick up where it
  left off. WebMiner auto-detects the last completed stage.
- **Input files** — only `*.html` and `*.htm` files are processed. Other files
  in the directory are ignored.
- **Offline only** — WebMiner works with pre-downloaded HTML files. Use a
  separate tool (browser save, wget, or a crawler) to fetch pages first.
- **--also-make** — run a mid-pipeline stage with `-am` to auto-run all
  dependencies. E.g., `cluster /html -am` encodes first, then clusters.
