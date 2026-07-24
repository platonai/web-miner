# WebMiner

Run the Scent ML pipeline on local HTML files — encode HTML to feature vectors,
cluster with KMeans, and build HTML/XLSX views of the results.

**Everything runs locally — no network calls, no data leaves your machine.**

> **Latest release:** v0.0.1 | **Download:** [scent-miner.jar](https://github.com/platonai/web-miner/releases/latest)

## Quick Start

1. Install **JDK 17+** from [Adoptium](https://adoptium.net/download/) or
   [Microsoft OpenJDK](https://www.microsoft.com/openjdk).

2. Download `scent-miner.jar` and `webminer.ps1` from the
   [latest release](https://github.com/platonai/web-miner/releases/latest).

3. Run:

```powershell
.\webminer.ps1 all C:\path\to\html\files
```

Or directly with Java:

```bash
java -jar scent-miner.jar all /path/to/html/files
```

The pipeline encodes the HTML files, runs SMILE KMeans clustering (k auto-detected),
and builds browsable HTML/XLSX views.

## Usage

```
WebMiner <command> [args...] [options...]
```

### Commands

| Command | Args | Purpose |
|---------|------|---------|
| `encode` | `<html-dir>` | Encode HTML files → CSV feature vectors |
| `cluster` | `<csv-path>` | Run SMILE KMeans clustering |
| `views` | `[<result-dir>]` | Build HTML/XLSX views from clustering results |
| `all` | `<html-dir>` | Full pipeline: encode → cluster → views |

### Options (command-specific)

**encode / all**

| Flag | Default | Purpose |
|------|---------|---------|
| `--output <path>` | auto-derived | Output directory or CSV path |
| `--max-files <n>` | `40` | Max HTML files to encode |

**cluster**

| Flag | Default | Purpose |
|------|---------|---------|
| `--k <n>` | auto-detect | Number of clusters |
| `--output <dir>` | auto-derived | Output directory |

### Global Options

| Flag | Purpose |
|------|---------|
| `-am, --also-make` | Run all preceding pipeline stages first. The first positional arg becomes the HTML directory (pipeline root). |
| `--help, -h` | Print usage |

### Examples

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

### PowerShell Launcher

The `webminer.ps1` script auto-detects Java 17 and applies the required JVM
flags:

```powershell
.\webminer.ps1 all C:\data\amazon-pages
.\webminer.ps1 all C:\data\amazon-pages --k 12 --max-files 50
.\webminer.ps1 encode C:\data\amazon-pages --max-files 20
.\webminer.ps1 cluster C:\data\encoded.csv --k 8
.\webminer.ps1 -JavaHome "D:\jdk-17" all C:\data\amazon-pages
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

## Requirements

| Requirement | Version | Notes |
|---|---|---|
| JDK | 17+ | [Adoptium](https://adoptium.net/download/) recommended |
| OS | Windows x86_64 | Native libraries are Windows-only in this release |

## How It Works

1. **Encode** — parses each HTML file, extracts text features from nodes
   within the first 2 viewport screens, and encodes them as n-gram feature
   vectors in CSV format.
2. **Cluster** — runs SMILE KMeans (in-process) on the feature vectors.
   K is auto-detected from the data distribution when not specified.
3. **Views** — builds HTML and XLSX views from the clustering results for
   human review and analysis.

Built with:
- **Kotlin** 2.3.x / **Java** 17
- **ProGuard** 7.9 — bytecode obfuscation
- **Spring Boot** 4.1 — dependency injection
- **SMILE** — in-process KMeans clustering
- **Pulsar DOM** — HTML parsing & visual analysis

## License

Proprietary. All rights reserved.
