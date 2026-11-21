"""Bundle the exact Atlas reference visuals from the seven preserved prompts."""
from pathlib import Path
import argparse
import re

STYLES = (
    "flat-vector-science", "watercolor-wash", "shadow-puppet-theatre",
    "whiteboard-explainer", "psychedelic-poster", "tech-glow-explainer", "papercraft-models",
)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("templates", type=Path)
    args = parser.parse_args()
    entries = []
    for slug in STYLES:
        prompt = (args.templates / slug / "futurepedia-prompt.txt").read_text()
        blocks = re.findall(r"^```js\n([\s\S]*?)^```\s*$", prompt, re.M)
        if len(blocks) != 3 or "window.registerStyle" not in blocks[0] or "explainerDuration:" not in blocks[2]:
            raise ValueError(f"Unexpected prompt structure for {slug}")
        harness, _, example = blocks
        entries.append(
            f"{slug!r}: () => {{\nconst window = {{}};\n{harness}\n"
            f"const {{H, registerStyle, STYLES}} = window;\n{example}\n"
            "const [style] = STYLES;\nreturn style;\n}"
        )
    target = Path(__file__).with_name("reference.generated.js")
    target.write_text("export const references = {\n" + ",\n".join(entries) + "\n};\n")

if __name__ == "__main__":
    main()
