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
    Write-Host "Installing $Package with WinGet..."
    & winget.exe install --id $Package --exact --source winget --accept-package-agreements --accept-source-agreements --disable-interactivity
    # WinGet uses this code when an installed package has no applicable update.
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne -1978335189) {
        throw "WinGet failed to install $Package (exit code $LASTEXITCODE)."
    }
    Update-InstallPath
}

function Find-Npm {
    $npm = Get-Command npm.cmd -CommandType Application -ErrorAction SilentlyContinue
    if ($npm) {
        return $npm.Path
    }

    $nodeDirectory = Join-Path $env:ProgramFiles 'nodejs'
    $npmPath = Join-Path $nodeDirectory 'npm.cmd'
    if (Test-Path -LiteralPath $npmPath -PathType Leaf) {
        $env:Path = "$nodeDirectory;$env:Path"
        return $npmPath
    }
}

function Test-Python312 {
    param([string]$Program, [string[]]$Arguments)

    # An installed launcher may report a missing interpreter on stderr.
    $ErrorActionPreference = 'Continue'
    $version = & $Program @Arguments --version 2>$null
    return $LASTEXITCODE -eq 0 -and $version -match '^Python 3\.12\.'
}

function Find-Python312 {
    $launcher = Get-Command py.exe -CommandType Application -ErrorAction SilentlyContinue
    if ($launcher -and (Test-Python312 $launcher.Path @('-3.12'))) {
        return @{ Program = $launcher.Path; Arguments = @('-3.12') }
    }

    foreach ($registryRoot in 'HKCU:\Software', 'HKLM:\Software', 'HKLM:\Software\WOW6432Node') {
        $registration = Get-Item -LiteralPath "$registryRoot\Python\PythonCore\3.12\InstallPath" -ErrorAction SilentlyContinue
        if (-not $registration) {
            continue
        }
        $executable = $registration.GetValue('ExecutablePath')
        $installPath = $registration.GetValue('')
        if (-not $executable -and $installPath) {
            $executable = Join-Path $installPath 'python.exe'
        }
        if ($executable -and (Test-Path -LiteralPath $executable -PathType Leaf) -and
            (Test-Python312 $executable)) {
            return @{ Program = $executable; Arguments = @() }
        }
    }
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
$npm = Find-Npm
if (-not $npm) {
    Install-Tool 'OpenJS.NodeJS.22'
    $npm = Find-Npm
    if (-not $npm) {
        throw 'Node.js setup could not find npm.cmd. Repair the Node.js installation with npm enabled, then rerun Windows Install.cmd.'
    }
}
$python = Find-Python312
if (-not $python) {
    Install-Tool 'Python.Python.3.12'
    $python = Find-Python312
    if (-not $python) {
        throw 'Python 3.12 setup could not locate the interpreter. Repair Python 3.12, then rerun Windows Install.cmd.'
    }
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
Invoke-Checked $npm @('--prefix', 'remotion', 'ci')
Invoke-Checked $python.Program ($python.Arguments + @('-m', 'pip', 'install', '-r', 'requirements-voice.txt'))
if (-not (Test-Path -LiteralPath 'projects/first-film')) {
    Invoke-Checked $python.Program ($python.Arguments + @('tools/create_project.py', '--format', 'video',
        '--template', 'whiteboard', '--slug', 'first-film', '--duration', '10'))
}
Invoke-Checked $npm @('--prefix', 'remotion', 'run', 'gen')

if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
Write-Host 'Setup complete. Open .env and set GEMINI_API_KEY to your own Gemini API key.'
