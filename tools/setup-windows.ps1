$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)

    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Program failed with exit code $LASTEXITCODE."
    }
}

function Update-InstallPath {
    $env:Path = @(
        [Environment]::GetEnvironmentVariable('Path', 'Machine')
        [Environment]::GetEnvironmentVariable('Path', 'User')
        $env:Path
    ) -join ';'
}

function Install-Tool {
    param([string]$Package)

    if (-not (Get-Command winget.exe -ErrorAction SilentlyContinue)) {
        throw 'Install or update App Installer from Microsoft Store to get winget, then rerun setup.'
    }
    Invoke-Checked winget.exe @('install', '--id', $Package, '--exact', '--source', 'winget',
        '--accept-package-agreements', '--accept-source-agreements', '--disable-interactivity')
    Update-InstallPath
}

Update-InstallPath
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    Install-Tool 'OpenJS.NodeJS.22'
}
cmd.exe /d /c 'py.exe -3.12 --version >NUL 2>&1'
if ($LASTEXITCODE -ne 0) {
    Install-Tool 'Python.Python.3.12'
}
if (-not (Get-Command ffmpeg.exe -ErrorAction SilentlyContinue) -or
    -not (Get-Command ffprobe.exe -ErrorAction SilentlyContinue)) {
    Install-Tool 'Gyan.FFmpeg'
}

Get-Command ffmpeg.exe, ffprobe.exe | Out-Null
Invoke-Checked npm.cmd @('--prefix', 'remotion', 'ci')
Invoke-Checked py.exe @('-3.12', '-m', 'pip', 'install', '-r', 'requirements-voice.txt')
if (-not (Test-Path -LiteralPath 'projects/first-film')) {
    Invoke-Checked py.exe @('-3.12', 'tools/create_project.py', '--format', 'video',
        '--template', 'whiteboard', '--slug', 'first-film', '--duration', '10')
}
Invoke-Checked npm.cmd @('--prefix', 'remotion', 'run', 'gen')

if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
Write-Host 'Setup complete. Open .env and set GEMINI_API_KEY to your own Gemini API key.'
