import argparse
import sys
import os
import json
from PIL import Image, ImageFilter

def main():
    parser = argparse.ArgumentParser(description="OpenCV / PIL Face Blurring Bridge")
    parser.add_argument("--input", required=True, help="Path to input image")
    parser.add_argument("--output", required=True, help="Path to output image")
    parser.add_argument("--blur-strength", type=int, default=35, help="Blur radius/strength")
    parser.add_argument("--padding", type=float, default=0.1, help="Bounding box padding ratio")
    parser.add_argument("--faces-json", default=None, help="Optional JSON array of face bounding boxes")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    img = Image.open(args.input)
    width, height = img.size

    detected_faces = []

    # 1. Check if client supplied pre-computed face coordinates
    if args.faces_json:
        try:
            detected_faces = json.loads(args.faces_json)
        except Exception:
            pass

    # 2. If no faces provided, run OpenCV face cascade detection
    if not detected_faces:
        try:
            import cv2
            cv_img = cv2.imread(args.input)
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            for (x, y, w, h) in faces:
                detected_faces.append({"x": int(x), "y": int(y), "width": int(w), "height": int(h)})
        except Exception as e:
            sys.stderr.write(f"OpenCV face detection unavailable: {e}\n")

    # 3. Apply Gaussian blur to each detected face region
    blur_radius = max(5, int(args.blur_strength / 2))

    for face in detected_faces:
        pad_x = int(face["width"] * args.padding)
        pad_y = int(face["height"] * args.padding)

        left = max(0, int(face["x"]) - pad_x)
        top = max(0, int(face["y"]) - pad_y)
        right = min(width, int(face["x"]) + int(face["width"]) + pad_x)
        bottom = min(height, int(face["y"]) + int(face["height"]) + pad_y)

        if right > left and bottom > top:
            roi = img.crop((left, top, right, bottom))
            blurred_roi = roi.filter(ImageFilter.GaussianBlur(radius=blur_radius))
            img.paste(blurred_roi, (left, top))

    img.save(args.output)

    if not os.path.exists(args.output):
        sys.exit(1)

if __name__ == "__main__":
    main()
