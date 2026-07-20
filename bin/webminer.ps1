#!/usr/bin/env pwsh
<#
.SYNOPSIS
    PowerShell wrapper for WebMiner — load local HTML and run the Scent ML mining pipeline.

.DESCRIPTION
    Auto-discovers the project root, resolves Java 17, and invokes WebMiner
    via Maven exec:java against the scent-engine module.

    All arguments are forwarded transparently to WebMiner.main().

.PARAMETER JavaHome
    Explicit JAVA_HOME path (e.g. "D:\Program Files\OpenLogic\jdk-17.0.14.7-hotspot").
    If omitted the script auto-detects a Java 17 installation.

.EXAMPLE
    .\bin\webminer.ps1 --input C:\data\html-pages
    .\bin\webminer.ps1 --input C:\data\html-pages --output .\my-views
    .\bin\webminer.ps1 --input C:\data\html-pages --out-link-selector "a[href~=/product/]" --top-links 50
    .\bin\webminer.ps1 --input C:\data\html-pages --refresh --no-trust-samples
    .\bin\webminer.ps1 --input C:\data\html-pages -c "#main-content"
    .\bin\webminer.ps1 --help
#>

$ErrorActionPreference = 'Stop'

# Parse our own flags out of $args so nothing pollutes the WebMiner arguments.
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
# Resolve project root (walk up from script directory)
# ------------------------------------------------------------------
function Find-ProjectRoot {
    $dir = $PSScriptRoot
    while ($dir -and $dir.Length -gt 3) {
        if ((Test-Path "$dir\mvnw.cmd") -or (Test-Path "$dir\mvnw")) {
            return (Resolve-Path $dir).Path
        }
        $dir = Split-Path $dir -Parent
    }
    # Fallback: assume script is in <root>/bin/
    $fallback = Resolve-Path "$PSScriptRoot\.." -ErrorAction SilentlyContinue
    if ($fallback) { return $fallback.Path }
    throw 'Cannot find project root (no mvnw.cmd/mvnw found in ancestor directories).'
}

# ------------------------------------------------------------------
# Find Java 17
# ------------------------------------------------------------------
function Find-Java17 {
    param([string] $ExplicitHome)

    if ($ExplicitHome) {
        $javaExe = Join-Path $ExplicitHome 'bin\java.exe'
        if (Test-Path $javaExe) { return $ExplicitHome }
        throw "JAVA_HOME not found at: $ExplicitHome"
    }

    # Check JAVA_HOME env var first
    $envJavaHome = $env:JAVA_HOME
    if ($envJavaHome) {
        $javaExe = Join-Path $envJavaHome 'bin\java.exe'
        if (Test-Path $javaExe) {
            $ver = & $javaExe -version 2>&1 | Select-Object -First 1
            if ($ver -match 'version "(\d+)') {
                if ([int]$Matches[1] -ge 17) { return $envJavaHome }
            }
        }
    }

    # Search common locations on Windows
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

    # As a last resort, try `java` on PATH
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
Checked:
  ${($candidates -join "`n  ")}
  JAVA_HOME=$envJavaHome
  PATH
"@
}

# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------
$ProjectRoot = Find-ProjectRoot
Write-Verbose "Project root: $ProjectRoot"

$Java17Home = Find-Java17 -ExplicitHome $JavaHome
Write-Verbose "Java 17 home: $Java17Home"

$env:JAVA_HOME = $Java17Home

# Module-opens required by the stack
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

$mvnw = Join-Path $ProjectRoot 'mvnw.cmd'
if (-not (Test-Path $mvnw)) {
    throw "Maven wrapper not found at: $mvnw"
}

# Pass app.name so pulsar-common resolves a consistent tmp prefix
$appName = if ($env:APP_NAME) { $env:APP_NAME } else { 'browser4' }
$env:MAVEN_OPTS = "-Dapp.name=$appName $($ModuleOpts -join ' ')"

Write-Host '[WebMiner] Running via Maven exec:java (scent-miner)' -ForegroundColor DarkGray

$mvnArgs = @(
    '-q',
    'exec:java',
    '-pl', 'scent-miner',
    '-Dexec.mainClass=ai.platon.scent.miner.WebMiner'
)
if ($RemainingArgs.Count -gt 0) {
    $mvnArgs += '-Dexec.args=' + ($RemainingArgs -join ' ')
}

& cmd /c $mvnw @mvnArgs
exit $LASTEXITCODE
