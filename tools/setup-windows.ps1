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

function Install-PortableFFmpeg {
    $installDirectory = Join-Path $env:LOCALAPPDATA 'VideoStudio/ffmpeg'
    $binDirectory = Join-Path $installDirectory 'bin'
    $ffmpeg = Join-Path $binDirectory 'ffmpeg.exe'
    $ffprobe = Join-Path $binDirectory 'ffprobe.exe'

    if (-not (Test-Path -LiteralPath $ffmpeg -PathType Leaf) -or
        -not (Test-Path -LiteralPath $ffprobe -PathType Leaf)) {
        $stagingDirectory = Join-Path (Split-Path -Parent $installDirectory) "ffmpeg-$([guid]::NewGuid())"
        [IO.Directory]::CreateDirectory($stagingDirectory) | Out-Null
        try {
            $ProgressPreference = 'SilentlyContinue'
            $downloadUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'
            $archive = Join-Path $stagingDirectory 'ffmpeg.zip'
            $checksum = Join-Path $stagingDirectory 'ffmpeg.sha256'
            Invoke-WebRequest -UseBasicParsing -Uri $downloadUrl -OutFile $archive
            Invoke-WebRequest -UseBasicParsing -Uri "$downloadUrl.sha256" -OutFile $checksum
            $expectedHash = (Get-Content -LiteralPath $checksum -Raw).Trim()
            if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $expectedHash) {
                throw 'The FFmpeg download failed its SHA-256 checksum check. Rerun Windows Install.cmd to retry.'
            }

            $extracted = Join-Path $stagingDirectory 'extracted'
            Expand-Archive -LiteralPath $archive -DestinationPath $extracted
            $release = Get-ChildItem -LiteralPath $extracted -Directory | Where-Object {
                (Test-Path -LiteralPath (Join-Path $_.FullName 'bin/ffmpeg.exe') -PathType Leaf) -and
                (Test-Path -LiteralPath (Join-Path $_.FullName 'bin/ffprobe.exe') -PathType Leaf)
            } | Select-Object -First 1
            if (-not $release) {
                throw 'The FFmpeg archive did not contain ffmpeg.exe and ffprobe.exe.'
            }

            try {
                [IO.Directory]::Move($release.FullName, $installDirectory)
            } catch [IO.IOException] {
                # A concurrent installer may already have published the complete directory.
                if (-not (Test-Path -LiteralPath $ffmpeg -PathType Leaf) -or
                    -not (Test-Path -LiteralPath $ffprobe -PathType Leaf)) {
                    throw
                }
            }
        } finally {
            Remove-Item -LiteralPath $stagingDirectory -Recurse -Force
        }
    }

    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if (($userPath -split ';') -notcontains $binDirectory) {
        $updatedPath = (@($userPath, $binDirectory) | Where-Object { $_ }) -join ';'
        [Environment]::SetEnvironmentVariable('Path', $updatedPath, 'User')
    }
    $env:Path = "$binDirectory;$env:Path"
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
    try {
        Install-Tool 'Gyan.FFmpeg'
        Get-Command ffmpeg.exe, ffprobe.exe | Out-Null
    } catch {
        Write-Warning "WinGet could not set up FFmpeg. $($_.Exception.Message)"
        Write-Host 'Installing FFmpeg in your user profile from gyan.dev...'
        Install-PortableFFmpeg
    }
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
