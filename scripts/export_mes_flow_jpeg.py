from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "exports"
OUT_FILE = OUT_DIR / "mes-document-flow.jpg"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("C:/Windows/Fonts/tahomabd.ttf" if bold else "C:/Windows/Fonts/tahoma.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


TITLE_FONT = font(46, True)
SUB_FONT = font(25)
BOX_FONT = font(26, True)
SMALL_FONT = font(22)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split(" ")
    lines: list[str] = []
    current = ""
    for word in words:
        trial = word if not current else f"{current} {word}"
        if draw.textbbox((0, 0), trial, font=fnt)[2] <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_box(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    title: str,
    detail: str = "",
    fill: str = "#ffffff",
    outline: str = "#d8e1e8",
    title_color: str = "#172026",
):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=20, fill=fill, outline=outline, width=3)
    max_width = x2 - x1 - 44
    y = y1 + 24
    for line in wrap_text(draw, title, BOX_FONT, max_width):
        draw.text((x1 + 22, y), line, font=BOX_FONT, fill=title_color)
        y += 34
    if detail:
        y += 8
        for line in wrap_text(draw, detail, SMALL_FONT, max_width):
            draw.text((x1 + 22, y), line, font=SMALL_FONT, fill="#53616d")
            y += 29


def arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], color: str = "#607483"):
    draw.line([start, end], fill=color, width=4)
    x1, y1 = start
    x2, y2 = end
    if abs(y2 - y1) >= abs(x2 - x1):
        direction = 1 if y2 > y1 else -1
        head = [(x2, y2), (x2 - 10, y2 - 18 * direction), (x2 + 10, y2 - 18 * direction)]
    else:
        direction = 1 if x2 > x1 else -1
        head = [(x2, y2), (x2 - 18 * direction, y2 - 10), (x2 - 18 * direction, y2 + 10)]
    draw.polygon(head, fill=color)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (1800, 2350), "#f5f7fa")
    draw = ImageDraw.Draw(img)

    draw.text((90, 70), "Office MES - Flow การทำงานและการเดินเอกสาร", font=TITLE_FONT, fill="#102027")
    draw.text(
        (92, 132),
        "ฝ่ายขายรับงาน -> ถอดแบบ/เช็คสต็อก -> ออก SO -> วางแผนผลิต -> ผลิต -> จัดส่ง -> สมบูรณ์แล้ว",
        font=SUB_FONT,
        fill="#53616d",
    )

    boxes = {
        "sales": (640, 220, 1160, 340, "ฝ่ายขายรับงานลูกค้า", "สร้าง INQ, แนบไฟล์ลูกค้า, ระบุรายการสินค้าและจำนวน"),
        "type": (640, 420, 1160, 540, "แยกประเภทงาน", "ต้องถอดแบบ / เช็คสต็อก / งานง่าย"),
        "design": (120, 650, 610, 800, "ฝ่ายผลิตถอดแบบ", "ประเมินวัสดุ เวลา ต้นทุน และแนบไฟล์/ข้อความตอบกลับฝ่ายขาย"),
        "stock": (655, 650, 1145, 800, "คลังเช็คสต็อก", "ตรวจจำนวนสินค้า วัตถุดิบ หรือความพร้อมก่อนออก SO"),
        "simple": (1190, 650, 1680, 800, "ฝ่ายขายทำราคาเอง", "กรณีงานง่ายหรือสินค้าที่ไม่ต้องส่งถอดแบบ"),
        "so": (640, 920, 1160, 1055, "ฝ่ายขายออก SO / Sales Order", "รับผลถอดแบบหรือสต็อก แล้วออกเอกสาร SO"),
        "plan": (640, 1150, 1160, 1285, "Admin / วางแผนผลิต", "รับ SO, จัดคิว, เตรียมข้อมูลผลิต"),
        "wo": (640, 1380, 1160, 1515, "สร้าง WO / Work Order", "เอกสารสั่งผลิตสำหรับฝ่ายผลิต"),
        "prod": (640, 1610, 1160, 1745, "ฝ่ายผลิตดำเนินการผลิต", "บันทึกจำนวนดี จำนวนเสีย และหมายเหตุ"),
        "delivery_confirm": (640, 1840, 1160, 1975, "ฝ่ายขายยืนยันจัดส่ง", "ยืนยันกำหนดส่งกับลูกค้า"),
        "delivery": (640, 2070, 1160, 2205, "ขนส่ง / ลูกค้ารับเอง", "จองรถ จัดรอบส่ง หรือเตรียมของให้ลูกค้ารับ"),
        "done": (1280, 2070, 1680, 2205, "สมบูรณ์แล้ว", "จัดส่งแล้วและปิดงาน", "#e5f8ee", "#0d6b4a"),
    }

    for key, values in boxes.items():
        x1, y1, x2, y2, title, detail, *colors = values
        fill = colors[0] if colors else "#ffffff"
        outline = colors[1] if len(colors) > 1 else "#d8e1e8"
        draw_box(draw, (x1, y1, x2, y2), title, detail, fill=fill, outline=outline)

    arrow(draw, (900, 340), (900, 420))
    arrow(draw, (900, 540), (365, 650))
    arrow(draw, (900, 540), (900, 650))
    arrow(draw, (900, 540), (1435, 650))
    arrow(draw, (365, 800), (900, 920))
    arrow(draw, (900, 800), (900, 920))
    arrow(draw, (1435, 800), (900, 920))
    arrow(draw, (900, 1055), (900, 1150))
    arrow(draw, (900, 1285), (900, 1380))
    arrow(draw, (900, 1515), (900, 1610))
    arrow(draw, (900, 1745), (900, 1840))
    arrow(draw, (900, 1975), (900, 2070))
    arrow(draw, (1160, 2138), (1280, 2138))

    draw_box(draw, (90, 1915, 540, 2205), "เอกสารหลัก", "INQ รับงาน\nไฟล์ลูกค้า\nผลถอดแบบ/เช็คสต็อก\nSO / Sales Order\nWO / Work Order\nบันทึกผลผลิต\nสถานะจัดส่ง", fill="#fffdf3", outline="#e6c567")

    img.save(OUT_FILE, "JPEG", quality=94, optimize=True)
    print(OUT_FILE)


if __name__ == "__main__":
    main()
