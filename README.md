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
| `all --resume` | `<html-dir>` | Resume the last pipeline from where it left off |

### Options (command-specific)

**encode / all**

| Flag | Default | Purpose |
|------|---------|---------|
| `--output <path>` | auto-derived | Output directory or CSV path |
| `--max-files <n>` | `40` | Max HTML files to encode |
| `--project-id <id>` | auto-generated | Project ID (`p` + timestamp) embedded in output paths |

**cluster**

| Flag | Default | Purpose |
|------|---------|---------|
| `--k <n>` | auto-detect | Number of clusters |
| `--output <dir>` | auto-derived | Output directory |

**all**

| Flag | Default | Purpose |
|------|---------|---------|
| `--resume [<project-id>]` | — | Resume from the last completed step. If no project ID is given, the latest project is auto-selected. |

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

# Full pipeline with a specific project ID
java -jar scent-miner.jar all /data/amazon-pages --project-id p20250101120000

# Full pipeline with resume (pick up where you left off)
java -jar scent-miner.jar all /data/amazon-pages --resume

# Resume a specific project
java -jar scent-miner.jar all /data/amazon-pages --resume p20260717054158

# Encode only (limit to 20 files)
java -jar scent-miner.jar encode /data/amazon-pages --max-files 20

# Encode with custom output and project ID
java -jar scent-miner.jar encode /data/amazon-pages --output ./my-dataset.csv --project-id pMyExperiment

# Cluster an existing CSV (k auto-detected)
java -jar scent-miner.jar cluster /data/encoded.csv

# Cluster with explicit k
java -jar scent-miner.jar cluster /data/encoded.csv --k 8

# Build views from clustering results
java -jar scent-miner.jar views /data/results/kmeans-result/p1723201624

# Build views for all projects (no argument)
java -jar scent-miner.jar views

# Run cluster with dependencies (--also-make runs encode first)
java -jar scent-miner.jar cluster /data/amazon-pages -am --k 12
```

### PowerShell Launcher

The `webminer.ps1` script auto-detects Java 17 and applies the required JVM
flags:

```powershell
.\webminer.ps1 all C:\data\amazon-pages
.\webminer.ps1 all C:\data\amazon-pages --k 12 --max-files 50
.\webminer.ps1 all C:\data\amazon-pages --resume
.\webminer.ps1 all C:\data\amazon-pages --resume p20260717054158
.\webminer.ps1 encode C:\data\amazon-pages --max-files 20
.\webminer.ps1 encode C:\data\amazon-pages --project-id pMyExperiment
.\webminer.ps1 cluster C:\data\encoded.csv --k 8
.\webminer.ps1 views C:\data\results\kmeans-result\p1723201624
.\webminer.ps1 -JavaHome "D:\jdk-17" all C:\data\amazon-pages
```

## Output

The pipeline writes to two locations:

**Canonical ML paths** (under `{proc_tmp}/ml/`) — used by downstream stages and the Scent
task scanner to discover results automatically:

```
{proc_tmp}/ml/
  ├── dataset/
  │   └── predict/
  │       └── p{projectId}/
  │           ├── dataset-p{projectId}.csv   # Encoded feature vectors
  │           └── html/                       # Copied HTML files
  └── tasks/
      └── unsupervised/
          └── result/
              └── p{projectId}/
                  ├── clusteringInfo.txt      # KMeans metadata
                  ├── predictionAndMinimalFeatures/
                  │   └── part-*.csv          # Clustered data
                  └── predictionAndMinimalFeatures.views/
                      ├── index.html          # HTML report
                      ├── p{projectId}.xlsx   # Excel export
                      └── prompts/            # LLM prompt views
```

**User-facing output** (`<html-dir>-ml-output/` by default, or `--output <dir>`):

```
<html-dir>-ml-output/
  └── kmeans-result/
      └── p{projectId}/                       # Copy of clustering results
          ├── clusteringInfo.txt
          └── predictionAndMinimalFeatures/
```

After a successful run, `printPipelineDone` prints the exact paths to all outputs.

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
