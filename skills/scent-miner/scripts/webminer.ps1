#!/usr/bin/env pwsh
<#
.SYNOPSIS
    WebMiner — extract structured data from local HTML files.

.DESCRIPTION
    Finds a Java 17+ installation and launches the WebMiner fat JAR
    with all required JVM module-opens flags.  Every argument is
    forwarded directly to WebMiner.main().

.PARAMETER JavaHome
    Explicit JAVA_HOME path.  If omitted the script auto-detects a
    Java 17+ installation.

.EXAMPLE
    # Full pipeline (encode → cluster → views)
    .\webminer.ps1 all C:\data\html-pages

.EXAMPLE
    # Full pipeline with options
    .\webminer.ps1 all C:\data\html-pages --k 12 --max-files 50

.EXAMPLE
    # Encode only
    .\webminer.ps1 encode C:\data\html-pages

.EXAMPLE
    # Cluster an existing CSV
    .\webminer.ps1 cluster C:\data\encoded.csv

.EXAMPLE
    # Build views from results
    .\webminer.ps1 views .\kmeans-result\p20260717054158

.EXAMPLE
    .\webminer.ps1 --help

.EXAMPLE
    .\webminer.ps1 -JavaHome "D:\jdk-17" all C:\data\html-pages
#>

$ErrorActionPreference = 'Stop'

# ------------------------------------------------------------------
# Parse -JavaHome out of the argument list
# ------------------------------------------------------------------
$JavaHome = ''
$RemainingArgs = @()

$i = 0
while ($i -lt $args.Count) {
    $arg = $args[$i]
    if ($arg -eq '-JavaHome') {
        $JavaHome = $args[$i + 1]
        $i += 2
    }
    else {
        $RemainingArgs += $arg
        $i++
    }
}

# ------------------------------------------------------------------
# Resolve the script directory
# ------------------------------------------------------------------
$ScriptDir = Split-Path $PSCommandPath -Parent

# ------------------------------------------------------------------
# Find Java 17+
# ------------------------------------------------------------------
function Find-Java17 {
    param([string] $ExplicitHome)

    if ($ExplicitHome) {
        $javaExe = Join-Path $ExplicitHome 'bin\java.exe'
        if (Test-Path $javaExe) { return $ExplicitHome }
        throw "JAVA_HOME not found at: $ExplicitHome"
    }

    # 1. JAVA_HOME env var
    $envJavaHome = $env:JAVA_HOME
    if ($envJavaHome) {
        $javaExe = Join-Path $envJavaHome 'bin\java.exe'
        if (Test-Path $javaExe) {
            $ver = & $javaExe -version 2>&1 | Select-Object -First 1
            if ($ver -match 'version "(\d+)' -and [int]$Matches[1] -ge 17) {
                return $envJavaHome
            }
        }
    }

    # 2. Common Windows install locations
    $candidates = @(
        'D:\Program Files\OpenLogic\jdk-17.0.14.7-hotspot',
        'C:\Program Files\OpenLogic\jdk-17.0.14.7-hotspot',
        'D:\Program Files\Java\jdk-17',
        'C:\Program Files\Java\jdk-17',
        'D:\Program Files\Eclipse Adoptium\jdk-17.0.14.7-hotspot',
        'C:\Program Files\Eclipse Adoptium\jdk-17.0.14.7-hotspot'
    )

    foreach ($candidate in $candidates) {
        $javaExe = Join-Path $candidate 'bin\java.exe'
        if (Test-Path $javaExe) { return $candidate }
    }

    # 3. `java` on PATH
    $pathJava = Get-Command java -ErrorAction SilentlyContinue
    if ($pathJava) {
        $ver = & java -version 2>&1 | Select-Object -First 1
        if ($ver -match 'version "(\d+)' -and [int]$Matches[1] -ge 17) {
            $javaBin = (Get-Command java).Source
            return (Split-Path (Split-Path $javaBin -Parent) -Parent)
        }
    }

    throw @"
No Java 17+ installation found.
Set JAVA_HOME or pass -JavaHome explicitly.

Download a JDK:
  https://adoptium.net/download/
  https://jdk.java.net/17/
  https://www.microsoft.com/openjdk
"@
}

# ------------------------------------------------------------------
# Find the WebMiner JAR (next to this script, or in the repo root)
# ------------------------------------------------------------------
function Find-WebMinerJar {
    # Walk up from the script directory so the JAR is found whether the
    # script runs from skills/scent-miner/scripts/ (published layout,
    # 3 levels up to lib/) or from a sibling directory.
    $dir = $ScriptDir
    while ($dir -and $dir.Length -gt 3) {
        # Check both lib/ (published layout) and root-level JAR
        $candidate = Join-Path $dir 'lib\scent-miner.jar'
        if (Test-Path $candidate) { return (Resolve-Path $candidate).Path }
        $candidate = Join-Path $dir 'scent-miner.jar'
        if (Test-Path $candidate) { return (Resolve-Path $candidate).Path }
        $parent = Split-Path $dir -Parent
        if ($parent -eq $dir) { break }
        $dir = $parent
    }

    throw @"
Cannot find scent-miner.jar.
Searched upward from: $ScriptDir

Download the latest release from:
  https://github.com/platonai/web-miner/releases
"@
}

# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------
$Java17Home = Find-Java17 -ExplicitHome $JavaHome
Write-Verbose "Java 17 home: $Java17Home"
$env:JAVA_HOME = $Java17Home

$JarPath = Find-WebMinerJar
Write-Verbose "WebMiner JAR: $JarPath"

# Required JVM module-opens for the stack
$ModuleOpts = @(
    '--add-opens=java.base/java.lang=ALL-UNNAMED',
    '--add-opens=java.base/java.lang.invoke=ALL-UNNAMED',
    '--add-opens=java.base/java.lang.reflect=ALL-UNNAMED',
    '--add-opens=java.base/java.io=ALL-UNNAMED',
    '--add-opens=java.base/java.net=ALL-UNNAMED',
    '--add-opens=java.base/java.nio=ALL-UNNAMED',
    '--add-opens=java.base/java.util=ALL-UNNAMED',
    '--add-opens=java.base/java.util.concurrent=ALL-UNNAMED',
    '--add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED',
    '--add-opens=java.base/sun.nio.ch=ALL-UNNAMED',
    '--add-opens=java.base/sun.nio.cs=ALL-UNNAMED',
    '--add-opens=java.base/sun.security.action=ALL-UNNAMED',
    '--add-opens=java.base/sun.util.calendar=ALL-UNNAMED',
    '--add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED'
)

$appName = if ($env:APP_NAME) { $env:APP_NAME } else { 'webminer' }

$javaArgs = @(
    "-Dapp.name=$appName"
) + $ModuleOpts + @(
    '-jar', $JarPath
) + $RemainingArgs

Write-Host '[WebMiner] Launching ...' -ForegroundColor DarkGray
$javaExe = Join-Path $Java17Home 'bin\java.exe'
& $javaExe @javaArgs
exit $LASTEXITCODE