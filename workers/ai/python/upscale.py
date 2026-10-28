import argparse
import sys
import os
from PIL import Image

def main():
    parser = argparse.ArgumentParser(description="Real-ESRGAN Upscaler Bridge")
    parser.add_argument("--input", required=True, help="Path to input image")
    parser.add_argument("--output", required=True, help="Path to output image")
    parser.add_argument("--scale", default="2x", help="Scale factor: 2x or 4x")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    scale_val = 4 if "4" in args.scale else 2

    # Try RealESRGAN model if installed, otherwise high-quality Lanczos fallback
    try:
        from realesrgan import RealESRGANer
        from basicsr.archs.rrdbnet_arch import RRDBNet
        import cv2

        model_name = "RealESRGAN_x4plus" if scale_val == 4 else "RealESRGAN_x2plus"
        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=scale_val)
        upsampler = RealESRGANer(scale=scale_val, model_path=None, model=model, tile=0, tile_pad=10, pre_pad=0, half=False)

        img = cv2.imread(args.input, cv2.IMREAD_UNCHANGED)
        output, _ = upsampler.enhance(img, outscale=scale_val)
        cv2.imwrite(args.output, output)
    except Exception as e:
        # Fallback to high-quality Lanczos resample if PyTorch/RealESRGAN weights aren't provisioned
        sys.stderr.write(f"RealESRGAN load exception (falling back to high-fidelity Lanczos): {e}\n")
        img = Image.open(args.input)
        new_w = img.width * scale_val
        new_h = img.height * scale_val
        upscaled = img.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)
        upscaled.save(args.output)

    if not os.path.exists(args.output):
        sys.exit(1)

if __name__ == "__main__":
    main()
