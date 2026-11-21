"""Extract the drawing helpers from the saved, unmodified Atlas prompts."""
import argparse
from pathlib import Path
import re

HELPERS = {
    "flat-vector-science": "sky finish text pill ball glow C",
    "watercolor-wash": "cachedExplainer wcText wcStroke exWash pencil",
    "shadow-puppet-theatre": "begin lamp end stage pup tag curtains cut dot INK",
    "whiteboard-explainer": "marker mText ghostBoard wobble seg FIBRES",
    "psychedelic-poster": "liquid finish txt wavy sunburst banner C",
    "tech-glow-explainer": "background bloom gtext connector card C",
    "papercraft-models": "renderScene makeCam place box tent pTag flat",
}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("templates", type=Path)
    args = parser.parse_args()
    destination = Path(__file__).with_name("reference.generated.js")
    pieces = []
    for slug, helpers in HELPERS.items():
        prompt = (args.templates / slug / "futurepedia-prompt.txt").read_text()
        blocks = re.findall(r"^```js\n([\s\S]*?)^```\s*$", prompt, re.M)
        if len(blocks) != 3 or 'window.registerStyle' not in blocks[0]:
            raise ValueError(f"Unexpected reference structure for {slug}")
        harness, _, style = blocks
        # Return the locally scoped drawing helpers before the reference registers its example.
        # The helper definitions stay byte-for-byte as published.
        registration = style.rfind("  registerStyle({")
        if registration < 0:
            raise ValueError(f"No style registration in {slug}")
        pieces.append(
            f"{slug!r}: () => {{\nconst window = {{}};\n{harness}\n"
            f"const {{H}} = window;\n{style[:registration]}\n"
            f"return {{H, {', '.join(helpers.split())}"
            + (", tip: () => TIP" if slug == "whiteboard-explainer" else "")
            + "};\n}\n}"
        )
    destination.write_text("export const makeReference = {\n" + ",\n".join(pieces) + "\n};\n")

if __name__ == "__main__":
    main()
