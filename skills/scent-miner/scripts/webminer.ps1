#!/usr/bin/env pwsh
<#
.SYNOPSIS
    PowerShell wrapper for WebMiner — run the Scent ML pipeline on local HTML files.

.DESCRIPTION
    Auto-discovers the project root, resolves Java 17, and invokes WebMiner
    via Maven exec:java against the scent-miner module.

    All arguments are forwarded transparently to WebMiner.main().

    Subcommands:
      encode   <html-dir> [--output <path>] [--max-files <n>]
      cluster  <csv-path> [--k <n>] [--output <dir>]
      views    [<result-dir>]
      all      <html-dir> [--k <n>] [--output <dir>] [--max-files <n>]
               [--resume [<project-id>]]

.PARAMETER JavaHome
    Explicit JAVA_HOME path (e.g. "D:\Program Files\OpenLogic\jdk-17.0.14.7-hotspot").
    If omitted the script auto-detects a Java 17 installation.

.EXAMPLE
    .\bin\webminer.ps1 all C:\data\amazon-pages

.EXAMPLE
    .\bin\webminer.ps1 all C:\data\amazon-pages --k 12 --max-files 50

.EXAMPLE
    .\bin\webminer.ps1 all C:\data\amazon-pages --resume

.EXAMPLE
    .\bin\webminer.ps1 encode C:\data\amazon-pages --max-files 20

.EXAMPLE
    .\bin\webminer.ps1 cluster C:\data\encoded.csv --k 8

.EXAMPLE
    .\bin\webminer.ps1 views C:\data\results\p1723201624

.EXAMPLE
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
$env:MAVEN_OPTS = "-Dfile.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -Dsun.stderr.encoding=UTF-8 -Dapp.name=$appName $($ModuleOpts -join ' ')"

Write-Host '[WebMiner] Running via Maven exec:java (scent-miner)' -ForegroundColor DarkGray

$mvnArgs = @(
    '-q',
    'exec:java',
    '-pl', 'scent-miner',
    '-Dexec.mainClass=ai.platon.scent.miner.WebMiner'
)
if ($RemainingArgs.Count -gt 0) {
    # Expand ~ to the user's home directory (PowerShell doesn't do this for bare args)
    $ExpandedArgs = $RemainingArgs | ForEach-Object {
        if ($_ -match '^~[/\\]') {
            $_ -replace '^~', $HOME
        } else {
            $_
        }
    }
    $mvnArgs += '-Dexec.args=' + ($ExpandedArgs -join ' ')
}

# Ensure PowerShell decodes Java's UTF-8 output correctly
$prevOutputEncoding = [Console]::OutputEncoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
    & cmd /c $mvnw @mvnArgs
} finally {
    [Console]::OutputEncoding = $prevOutputEncoding
}
exit $LASTEXITCODE
