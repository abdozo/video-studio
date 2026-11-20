#!/usr/bin/env python3
"""Make deterministic non-musical noise-based foley locally, with provenance."""
import argparse
import hashlib
import json
import math
import random
import struct
import wave
from pathlib import Path


def synthesize(kind, output, seed=7):
    output = Path(output)
    if output.exists() or output.with_suffix('.provenance.json').exists():
        raise ValueError('Refusing to overwrite existing sound or provenance')
    if kind not in ('air-swish', 'paper-brush'):
        raise ValueError('Unsupported foley recipe')
    rate = 48000
    duration = .46 if kind == 'air-swish' else .38
    count = round(rate * duration)
    rng = random.Random(seed)
    low = 0
    previous = 0
    samples = []
    for i in range(count):
        t = i / (count - 1)
        noise = rng.uniform(-1, 1)
        low += (.08 if kind == 'air-swish' else .24) * (noise - low)
        high = low - previous
        previous = low
        envelope = math.sin(math.pi * t) ** 2
        if kind == 'paper-brush':
            envelope *= sum(math.exp(-((t - p) / .065) ** 2) for p in (.2, .45, .72))
        samples.append((low if kind == 'air-swish' else high) * envelope)
    peak = max(abs(x) for x in samples)
    pcm = b''.join(struct.pack('<h', round(x / peak * 32767 * .5)) for x in samples)
    output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output), 'wb') as wav:
        wav.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
        wav.writeframes(pcm)
    provenance = {'generator': 'tools/synthesize_foley.py', 'kind': kind, 'seed': seed,
                  'duration_s': duration, 'sample_rate': rate,
                  'license': 'MIT, same as repository LICENSE; synthesized locally without external samples',
                  'generator_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  'audio_sha256': hashlib.sha256(output.read_bytes()).hexdigest()}
    output.with_suffix('.provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
    return provenance


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--kind', choices=('air-swish', 'paper-brush'), required=True)
    ap.add_argument('--output', type=Path, required=True)
    ap.add_argument('--seed', type=int, default=7)
    args = ap.parse_args()
    try:
        print(json.dumps(synthesize(args.kind, args.output, args.seed), indent=2))
    except (ValueError, OSError) as exc:
        ap.exit(1, f'{exc}\n')


if __name__ == '__main__':
    main()
