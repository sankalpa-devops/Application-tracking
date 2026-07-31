import base64
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


BASE_DIR = Path(__file__).resolve().parents[2]
TEMPLATE_PATH = BASE_DIR / "assets" / "Joining Kit.pdf"


def _value(data, key, default=""):
    value = data.get(key, default)
    if value is None:
        return ""
    return str(value)


def _draw_text(canv, x, y, text, size=8, max_chars=60):
    if not text:
        return
    canv.setFont("Helvetica", size)
    canv.drawString(x, y, str(text)[:max_chars])


def _draw_wrapped(canv, x, y, text, width=54, line_height=9, size=7, max_lines=6):
    if not text:
        return
    words = str(text).split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if len(candidate) > width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)

    canv.setFont("Helvetica", size)
    for index, line in enumerate(lines[:max_lines]):
        canv.drawString(x, y - (index * line_height), line)


def _draw_check(canv, x, y, checked):
    if checked:
        canv.setFont("Helvetica-Bold", 9)
        canv.drawString(x, y, "X")


def _overlay_for_page(page_number, page_width, page_height, candidate, form_data):
    packet = BytesIO()
    canv = canvas.Canvas(packet, pagesize=(page_width, page_height))
    data = {**candidate, **(form_data or {})}

    if page_number == 0:
        _draw_text(canv, 42, 685, _value(data, "name"), size=8, max_chars=44)
        _draw_text(canv, 440, 696, _value(data, "employee_id"), size=8, max_chars=12)
        _draw_text(canv, 114, 495, _value(data, "name"), size=8, max_chars=30)
        _draw_text(canv, 114, 468, _value(data, "father_name"), size=8, max_chars=30)
        _draw_text(canv, 114, 443, _value(data, "mother_name"), size=8, max_chars=30)
        _draw_text(canv, 114, 418, _value(data, "spouse_name"), size=8, max_chars=30)
        _draw_wrapped(canv, 42, 352, _value(data, "permanent_address"), width=44, max_lines=6)
        _draw_wrapped(canv, 310, 352, _value(data, "mailing_address"), width=44, max_lines=6)
        _draw_text(canv, 89, 305, _value(data, "phone"), size=7, max_chars=20)
        _draw_text(canv, 355, 305, _value(data, "emergency_contact_number"), size=7, max_chars=20)
        _draw_text(canv, 43, 285, _value(data, "email"), size=7, max_chars=42)
        _draw_text(canv, 45, 246, _value(data, "dob"), size=7, max_chars=10)
        _draw_text(canv, 180, 246, _value(data, "place_of_birth"), size=7, max_chars=22)
        _draw_text(canv, 350, 246, _value(data, "home_town"), size=7, max_chars=18)
        _draw_text(canv, 470, 246, _value(data, "domicile_state"), size=7, max_chars=18)
        marital = _value(data, "marital_status").lower()
        _draw_check(canv, 47, 203, marital == "unmarried")
        _draw_check(canv, 119, 203, marital == "married")
        _draw_check(canv, 192, 203, marital == "widow")
        _draw_check(canv, 271, 203, marital == "separated")
        _draw_check(canv, 365, 203, marital == "divorced")
        _draw_text(canv, 463, 199, _value(data, "date_of_marriage"), size=7, max_chars=10)
        _draw_text(canv, 42, 153, _value(data, "pan"), size=7, max_chars=12)
        _draw_text(canv, 190, 153, _value(data, "election_card_no"), size=7, max_chars=18)
        _draw_text(canv, 374, 153, _value(data, "aadhaar"), size=7, max_chars=14)

        # Passport photo rendering
        photo_base64 = data.get("photo_base64")
        if photo_base64:
            try:
                if "," in photo_base64:
                    photo_base64 = photo_base64.split(",", 1)[1]
                img_bytes = base64.b64decode(photo_base64)
                img = ImageReader(BytesIO(img_bytes))
                canv.drawImage(img, 455, 545, width=90, height=110)
            except Exception as e:
                print("Failed to draw photo on PDF:", e)

    if page_number == 1:
        _draw_text(canv, 49, 789, _value(data, "passport_no"), size=7, max_chars=18)
        _draw_text(canv, 165, 789, _value(data, "passport_place_of_issue"), size=7, max_chars=18)
        _draw_text(canv, 315, 789, _value(data, "passport_date_of_issue"), size=7, max_chars=10)
        _draw_text(canv, 420, 789, _value(data, "passport_valid_upto"), size=7, max_chars=10)
        _draw_text(canv, 508, 770, _value(data, "height_cms"), size=7, max_chars=8)
        _draw_text(canv, 508, 722, _value(data, "weight_kgs"), size=7, max_chars=8)
        _draw_text(canv, 508, 690, _value(data, "blood_group"), size=7, max_chars=8)
        _draw_text(canv, 50, 728, _value(data, "driving_licence_no"), size=7, max_chars=20)
        _draw_text(canv, 50, 707, _value(data, "driving_licence_issued_by"), size=7, max_chars=20)
        _draw_text(canv, 50, 690, _value(data, "driving_licence_valid_upto"), size=7, max_chars=10)
        _draw_text(canv, 225, 728, _value(data, "ration_card_no"), size=7, max_chars=20)
        _draw_text(canv, 225, 707, _value(data, "ration_card_issued_by"), size=7, max_chars=20)
        _draw_text(canv, 50, 654, _value(data, "religion"), size=7, max_chars=24)
        _draw_text(canv, 50, 640, _value(data, "caste"), size=7, max_chars=24)
        _draw_text(canv, 372, 640, _value(data, "ailment_details"), size=7, max_chars=42)
        _draw_text(canv, 372, 610, _value(data, "disability_details"), size=7, max_chars=42)
        _draw_wrapped(canv, 49, 520, _value(data, "hobby"), width=95, max_lines=3)
        _draw_wrapped(canv, 49, 210, _value(data, "education_summary"), width=100, max_lines=5)

    if page_number == 2:
        family = form_data.get("family_members_text") or form_data.get("family_members") or ""
        _draw_wrapped(canv, 48, 786, family, width=110, line_height=14, size=7, max_lines=10)
        _draw_wrapped(canv, 48, 410, _value(data, "relative_details"), width=100, max_lines=4)
        _draw_wrapped(canv, 48, 320, _value(data, "work_experience_summary"), width=82, max_lines=6)
        _draw_wrapped(canv, 48, 150, _value(data, "last_job_responsibilities"), width=48, max_lines=6)
        _draw_wrapped(canv, 340, 145, _value(data, "bank_name_address"), width=45, max_lines=3)
        _draw_text(canv, 365, 113, _value(data, "bank_account_no"), size=7, max_chars=28)
        _draw_text(canv, 365, 98, _value(data, "bank_account_type"), size=7, max_chars=18)
        _draw_text(canv, 365, 83, _value(data, "bank_ifsc"), size=7, max_chars=14)
        _draw_text(canv, 365, 68, _value(data, "bank_micr"), size=7, max_chars=14)

    if page_number == 3:
        _draw_check(canv, 77, 786, _value(data, "ever_arrested").lower() == "yes")
        _draw_check(canv, 136, 786, _value(data, "ever_arrested").lower() == "no")
        _draw_check(canv, 77, 758, _value(data, "ever_convicted").lower() == "yes")
        _draw_check(canv, 136, 758, _value(data, "ever_convicted").lower() == "no")
        _draw_wrapped(canv, 256, 786, _value(data, "legal_details"), width=58, max_lines=4)
        _draw_check(canv, 210, 710, _value(data, "been_overseas").lower() == "yes")
        _draw_check(canv, 275, 710, _value(data, "been_overseas").lower() == "no")
        _draw_wrapped(canv, 49, 676, _value(data, "overseas_details"), width=70, max_lines=4)
        _draw_wrapped(canv, 444, 690, _value(data, "karnataka_living_details"), width=28, max_lines=5)
        _draw_wrapped(canv, 49, 570, _value(data, "training_summary"), width=100, max_lines=6)
        _draw_wrapped(canv, 49, 390, _value(data, "publication_details"), width=100, max_lines=4)
        _draw_text(canv, 72, 246, _value(data, "declaration_date"), size=7, max_chars=10)
        _draw_text(canv, 72, 204, _value(data, "declaration_place"), size=7, max_chars=20)
        _draw_wrapped(canv, 49, 153, _value(data, "certificate_details"), width=100, max_lines=4)

    canv.save()
    packet.seek(0)
    return PdfReader(packet).pages[0]


def generate_joining_form_pdf(output_path, candidate, form_data):
    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError(f"Joining form template not found: {TEMPLATE_PATH}")

    reader = PdfReader(str(TEMPLATE_PATH))
    writer = PdfWriter()

    for index, page in enumerate(reader.pages):
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)
        if index < 4:
            overlay = _overlay_for_page(index, width, height, candidate, form_data)
            page.merge_page(overlay)
        writer.add_page(page)

    with open(output_path, "wb") as stream:
        writer.write(stream)

    return output_path
