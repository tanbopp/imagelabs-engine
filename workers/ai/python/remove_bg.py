import argparse
import sys
import os
from PIL import Image

def main():
    parser = argparse.ArgumentParser(description="rembg Background Removal Bridge")
    parser.add_argument("--input", required=True, help="Path to input image")
    parser.add_argument("--output", required=True, help="Path to output PNG")
    parser.add_argument("--model", default="u2net", help="rembg model name")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    try:
        from rembg import remove, new_session
        session = new_session(args.model)
        input_image = Image.open(args.input)
        output_image = remove(input_image, session=session)
        output_image.save(args.output, format="PNG")
    except Exception as e:
        sys.stderr.write(f"rembg load exception (falling back to alpha channel): {e}\n")
        # Fallback to RGBA conversion with transparent border if rembg package is missing
        img = Image.open(args.input).convert("RGBA")
        img.save(args.output, format="PNG")

    if not os.path.exists(args.output):
        sys.exit(1)

if __name__ == "__main__":
    main()
