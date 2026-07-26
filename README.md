# WebMiner

Extract structured data from local HTML files. WebMiner analyzes a directory of
web pages, identifies recurring patterns and data tables, and exports the
results as HTML reports and Excel spreadsheets.

**Everything runs locally — no network calls, no data leaves your machine.**

> **Latest release:** v0.0.5 | **Download:** [scent-miner.jar](https://github.com/platonai/web-miner/releases/latest/download/scent-miner.jar)

## Quick Start

1. Install **JDK 17+** from [Adoptium](https://adoptium.net/download/) or
   [Microsoft OpenJDK](https://www.microsoft.com/openjdk).

2. Download scent-miner.jar and webminer.ps1 from the
   [latest release](https://github.com/platonai/web-miner/releases/latest).

3. Run:

`powershell
.\webminer.ps1 all C:\path\to\html\files
`

Or directly with Java:

`ash
java -jar scent-miner.jar all /path/to/html/files
`

The miner scans all *.html / *.htm files, runs the full ML pipeline
(encode → cluster → views), and writes the results to <input-dir>-ml-output/.

## Usage

`
WebMiner <command> [args...] [options...]
`

### Commands

| Command | Usage | Purpose |
|---------|-------|---------|
| ll <dir> | Full pipeline | encode → cluster → views in one pass |
| ncode <dir> | Encode HTML → CSV | Extract feature vectors from HTML files |
| cluster <csv> | Run KMeans | Cluster encoded CSV (k auto-detected) |
| iews <dir> | Build views | HTML/XLSX views from clustering results |

### Common Options

| Flag | Default | Purpose |
|------|---------|---------|
| --k <n> | auto-detect | Number of clusters |
| --max-files <n> | 40 | Max HTML files to encode |
| --output <path> | auto | Override output directory |
| --resume [id] | — | Resume from last completed step |
| -am, --also-make | — | Run all dependent stages first |
| --help, -h | — | Print usage |

### Examples

`ash
# Full pipeline (auto-detect k)
java -jar scent-miner.jar all /data/amazon-pages

# Full pipeline with options
java -jar scent-miner.jar all /data/amazon-pages --k 12 --max-files 50

# Encode only
java -jar scent-miner.jar encode /data/pages

# Cluster an existing CSV
java -jar scent-miner.jar cluster /data/encoded.csv --k 8

# Resume a previous run
java -jar scent-miner.jar all /data/amazon-pages --resume
`

### PowerShell Launcher

The webminer.ps1 script auto-detects Java 17 and applies the required JVM
flags:

`powershell
.\webminer.ps1 all C:\data\html-pages
.\webminer.ps1 all C:\data\html-pages --k 12 --max-files 50
.\webminer.ps1 encode C:\data\html-pages
.\webminer.ps1 -JavaHome "D:\jdk-17" all C:\data\html-pages
`

## Output

`
<input-dir>-ml-output/
  └── kmeans-result/
      └── p<project-id>/
          ├── predictionAndMinimalFeatures/
          │   ├── index.html          # HTML report
          │   ├── *.xlsx              # Excel export
          │   └── ...
          └── predictionAndMinimalFeatures.views/
              ├── index.html          # Prompt views
              └── ...
`

Open index.html in a browser to browse extracted data, or load .xlsx files
in Excel for further analysis.

## Requirements

| Requirement | Version | Notes |
|---|---|---|
| JDK | 17+ | [Adoptium](https://adoptium.net/download/) recommended |
| OS | Windows x86_64 | Native libraries are Windows-only in this release |

## How It Works

WebMiner loads each HTML file, parses its structure and visual layout, detects
recurring content patterns across the document collection, and extracts
structured data tables from those patterns.

Built with:
- **Kotlin** 2.3.x / **Java** 17
- **ProGuard** 7.9 — bytecode obfuscation
- **Spring Boot** 4.1 — dependency injection
- **Apache Spark ML** — clustering & feature extraction
- **Pulsar DOM** — HTML parsing & visual analysis

## License

Proprietary. All rights reserved.