from datetime import datetime
import os
import uuid

from PIL import Image, ImageDraw, ImageFont


LETTER_DIR = "assets/transfer_letters"
LOGO_PATH = "assets/All Three Logos Together.png"

os.makedirs(LETTER_DIR, exist_ok=True)


def _font(size, bold=False):
    candidates = [
        "arialbd.ttf" if bold else "arial.ttf",
        "calibrib.ttf" if bold else "calibri.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _wrap_text(draw, text, font, max_width):
    words = str(text or "").split()
    lines = []
    current = ""

    for word in words:
        test = f"{current} {word}".strip()
        if draw.textbbox((0, 0), test, font=font)[2] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word

    if current:
        lines.append(current)

    return lines or [""]


def _draw_wrapped(draw, text, x, y, font, fill, max_width, line_height):
    for line in _wrap_text(draw, text, font, max_width):
        draw.text((x, y), line, font=font, fill=fill)
        y += line_height
    return y


def generate_transfer_letter_pdf(request_row):
    file_name = f"transfer_letter_{request_row.employee_id}_{uuid.uuid4().hex[:8]}.pdf"
    file_path = os.path.join(LETTER_DIR, file_name)

    page = Image.new("RGB", (1240, 1754), "white")
    draw = ImageDraw.Draw(page)

    title_font = _font(38, bold=True)
    heading_font = _font(28, bold=True)
    body_font = _font(24)
    small_font = _font(20)

    navy = "#111827"
    muted = "#4b5563"
    accent = "#1d4ed8"

    if os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert("RGBA")
        logo.thumbnail((420, 120))
        page.paste(logo, (80, 54), logo)
    else:
        draw.text((80, 70), "Company Letterhead", font=title_font, fill=navy)

    draw.line((80, 190, 1160, 190), fill=accent, width=4)
    draw.text((80, 235), "TRANSFER LETTER", font=title_font, fill=navy)
    draw.text((80, 300), f"Date: {datetime.now().strftime('%d-%m-%Y')}", font=body_font, fill=muted)

    y = 375
    draw.text((80, y), f"To,", font=body_font, fill=navy)
    y += 38
    draw.text((80, y), request_row.employee_name, font=heading_font, fill=navy)
    y += 34
    draw.text((80, y), f"Employee ID: {request_row.employee_id}", font=body_font, fill=muted)
    y += 70

    body = (
        f"This is to inform you that your transfer has been approved by "
        f"{request_row.top_approver_role or 'Top Management'}"
        f"{f' ({request_row.top_approver_name})' if request_row.top_approver_name else ''}. "
        f"You are transferred from {request_row.current_department}, "
        f"{request_row.current_location} to {request_row.requested_department}, "
        f"{request_row.requested_location}."
    )
    y = _draw_wrapped(draw, body, 80, y, body_font, navy, 1080, 38)
    y += 28

    if request_row.current_field or request_row.requested_field:
        field_text = (
            f"Field/Function change: {request_row.current_field or 'N/A'} "
            f"to {request_row.requested_field or 'N/A'}."
        )
        y = _draw_wrapped(draw, field_text, 80, y, body_font, navy, 1080, 38)
        y += 28

    if request_row.preferred_transfer_date:
        date_text = (
            "The transfer will be effective from "
            f"{request_row.preferred_transfer_date.strftime('%d-%m-%Y')}, "
            "or as communicated by HR/management."
        )
        y = _draw_wrapped(draw, date_text, 80, y, body_font, navy, 1080, 38)
        y += 28

    y = _draw_wrapped(
        draw,
        "You are requested to complete all handover formalities with your current department "
        "and report to the assigned department/location as per HR instructions.",
        80,
        y,
        body_font,
        navy,
        1080,
        38,
    )
    y += 48

    if request_row.review_note:
        draw.text((80, y), "Management Note:", font=heading_font, fill=navy)
        y += 42
        y = _draw_wrapped(draw, request_row.review_note, 80, y, body_font, navy, 1080, 38)
        y += 55

    draw.text((80, y), "Best Regards,", font=body_font, fill=navy)
    y += 42
    draw.text((80, y), "HR Department", font=heading_font, fill=navy)
    y += 34
    draw.text((80, y), "Authorized by Top Management", font=body_font, fill=muted)

    footer = "This is a system-generated transfer letter."
    draw.line((80, 1620, 1160, 1620), fill="#d1d5db", width=2)
    draw.text((80, 1645), footer, font=small_font, fill=muted)

    page.save(file_path, "PDF", resolution=100.0)
    return file_path
