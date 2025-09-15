import os
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from typing import Tuple, List, Union

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
FONTS_DIR = os.path.join(BASE_DIR, "fonts")

GRADIENT_PRESETS: List[Tuple[Tuple[int, int, int], Tuple[int, int, int]]] = [
    ((0, 180, 255), (255, 0, 150)),  # Blue → Pink
    ((255, 95, 109), (255, 195, 113)),  # Coral → Peach
    ((131, 58, 180), (253, 29, 29)),  # Purple → Red
    ((29, 253, 149), (29, 87, 253)),  # Green → Blue
    ((255, 204, 0), (255, 82, 82)),  # Yellow → Red
]


def load_font(
    filename: str, size: int
) -> Union[ImageFont.FreeTypeFont, ImageFont.ImageFont]:
    path = os.path.join(FONTS_DIR, filename)
    if os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_blurred_text(
    base_image: Image.Image,
    text: str,
    position: Tuple[int, int],
    font: Union[ImageFont.FreeTypeFont, ImageFont.ImageFont],
    text_color: Union[str, Tuple[int, int, int]],
    shadow_color: Union[str, Tuple[int, int, int, int]],
    blur_radius: int = 6,
) -> Image.Image:
    """Draws text with a blurred shadow (soft glow effect)."""
    shadow_layer = Image.new("RGBA", base_image.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    shadow_draw.text(position, text, font=font, fill=shadow_color)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(blur_radius))
    base_image = Image.alpha_composite(base_image.convert("RGBA"), shadow_layer)
    draw = ImageDraw.Draw(base_image)
    draw.text(position, text, font=font, fill=text_color)
    return base_image


def create_playlist_cover(month_code: str, year: int, size: int = 640) -> Image.Image:
    """Generate a square playlist cover image with month + year."""
    top_color, bottom_color = random.choice(GRADIENT_PRESETS)

    gradient = Image.new("RGB", (size, size), "#000")
    for y in range(size):
        r = int(top_color[0] + (bottom_color[0] - top_color[0]) * y / size)
        g = int(top_color[1] + (bottom_color[1] - top_color[1]) * y / size)
        b = int(top_color[2] + (bottom_color[2] - top_color[2]) * y / size)
        for x in range(size):
            gradient.putpixel((x, y), (r, g, b))

    image = gradient.convert("RGBA")

    for _ in range(3):
        radius = random.randint(size // 3, size // 2)
        x = random.randint(-radius // 2, size - radius // 2)
        y = random.randint(-radius // 2, size - radius // 2)
        circle = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        circle_draw = ImageDraw.Draw(circle)
        circle_draw.ellipse((x, y, x + radius, y + radius), fill=(255, 255, 255, 60))
        image = Image.alpha_composite(image, circle)

    month_font = load_font("Montserrat-Bold.ttf", size // 5)
    year_font = load_font("Montserrat-Bold.ttf", size // 7)

    padding = size // 12
    month_y = padding
    year_y = month_y + size // 4

    image = draw_blurred_text(
        image,
        month_code.upper(),
        (padding, month_y),
        month_font,
        text_color="white",
        shadow_color=(0, 0, 0, 150),
        blur_radius=6,
    )

    image = draw_blurred_text(
        image,
        str(year),
        (padding, year_y),
        year_font,
        text_color=(235, 235, 235),
        shadow_color=(0, 0, 0, 140),
        blur_radius=6,
    )

    return image.convert("RGB")
