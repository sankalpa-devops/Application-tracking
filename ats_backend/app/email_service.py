# import os
# import smtplib
# from email.mime.text import MIMEText
# from email.mime.multipart import MIMEMultipart
# from email.mime.image import MIMEImage
# from dotenv import load_dotenv
# load_dotenv()

# EMAIL = os.getenv("EMAIL_USER")
# PASSWORD = os.getenv("EMAIL_PASS")
# SMTP = os.getenv("SMTP_SERVER")
# PORT = int(os.getenv("SMTP_PORT"))
# HRMAIL = os.getenv("HR_EMAIL")

# LOGO_PATH = "assets/All Three Logos Together.png"


# def send_reset_email(to_email, link):

#     msg = MIMEText(f"""
# Hello,

# Click below to reset your password:

# {link}

# This link expires in 10 minutes.

# If not requested, ignore.
# """)

#     msg["Subject"] = "ATS Password Reset"
#     msg["From"] = EMAIL
#     msg["To"] = to_email

#     server = smtplib.SMTP(SMTP, PORT)
#     server.starttls()
#     server.login(EMAIL, PASSWORD)
#     server.send_message(msg)
#     server.quit()

# def send_status_email(candidate_email, candidate_name, status, job_title):

#     subject = ""
#     body_html = ""

#     if status == "Shortlisted":

#         subject = "Application Update - Shortlisted"

#         body_html = f"""
#         <html>
#         <body>

#         <p>Hello {candidate_name},</p>

#         <p><b>Congratulations!</b></p>

#         <p>
#         You have been shortlisted for the position of
#         <b>{job_title}</b>.
#         </p>

#         <p>
#         Our HR team will contact you soon regarding the next steps.
#         </p>

#         <p>
#         Best regards,<br>
#         HR Team
#         </p>

#         <img src="cid:companylogo" width="180"/>

#         </body>
#         </html>
#         """

#     elif status == "Rejected":

#         subject = "Application Update"

#         body_html = f"""
#         <html>
#         <body>

#         <p>Hello {candidate_name},</p>

#         <p>
#         Thank you for applying for the position of
#         <b>{job_title}</b>.
#         </p>

#         <p>
#         After careful review, we regret to inform you that
#         we will not be moving forward with your application.
#         </p>

#         <p>
#         We appreciate your interest in our company and
#         wish you the best.
#         </p>

#         <p>
#         Best regards,<br>
#         HR Team,<br>
#         Nahars Engineering India Pvt Ltd,<br>
#         Corporate Office Whitefield Bengaluru.
#         </p>

#         <img src="cid:companylogo" width="180"/>

#         </body>
#         </html>
#         """

#     msg = MIMEMultipart("related")

#     msg["From"] = EMAIL
#     msg["To"] = candidate_email
#     msg["Subject"] = subject

#     msg_alt = MIMEMultipart("alternative")
#     msg.attach(msg_alt)

#     msg_alt.attach(MIMEText(body_html, "html"))

#     if os.path.exists(LOGO_PATH):
#         with open(LOGO_PATH, "rb") as f:
#             img = MIMEImage(f.read())
#             img.add_header("Content-ID", "<companylogo>")
#             msg.attach(img)

#     try:

#         server = smtplib.SMTP(SMTP, PORT)
#         server.starttls()

#         # ✅ CORRECT LOGIN
#         server.login(EMAIL, PASSWORD)

#         server.sendmail(
#             EMAIL,
#             candidate_email,
#             msg.as_string()
#         )

#         server.quit()

#         print("Email sent to", candidate_email)

#     except Exception as e:
#         print("Email error:", e)


# app/email_service.py

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.mime.application import MIMEApplication
from dotenv import load_dotenv

load_dotenv()

EMAIL = os.getenv("EMAIL_USER")
PASSWORD = os.getenv("EMAIL_PASS")
SMTP = os.getenv("SMTP_SERVER")
PORT = int(os.getenv("SMTP_PORT"))
HRMAIL = os.getenv("HR_EMAIL")

LOGO_PATH = "assets/All Three Logos Together.png"


def send_reset_email(to_email, link):

    msg = MIMEText(f"""
Hello,

Click below to reset your password:

{link}

This link expires in 10 minutes.

If not requested, ignore.
""")

    msg["Subject"] = "ATS Password Reset"
    msg["From"] = EMAIL
    msg["To"] = to_email

    server = smtplib.SMTP(SMTP, PORT)
    server.starttls()
    server.login(EMAIL, PASSWORD)
    server.send_message(msg)
    server.quit()


def send_status_email(candidate_email, candidate_name, status, job_title):

    subject = ""
    body_html = ""

    if status == "Shortlisted":

        subject = "Application Update - Shortlisted"

        body_html = f"""
        <html>
        <body>

        <p>Hello {candidate_name},</p>

        <p><b>Congratulations!</b></p>

        <p>
        You have been shortlisted for the position of
        <b>{job_title}</b>.
        </p>

        <p>Our HR team will contact you soon.</p>

        <p>Best regards,<br>HR Team</p>

        <img src="cid:companylogo" width="180"/>

        </body>
        </html>
        """

    elif status == "Rejected":

        subject = "Application Update"

        body_html = f"""
        <html>
        <body>

        <p>Hello {candidate_name},</p>

        <p>
        Thank you for applying for
        <b>{job_title}</b>.
        </p>

        <p>
        We regret to inform you that we will not move
        forward with your application.
        </p>

        <p>
        Best regards,<br>
        HR Team<br>
        Nahars Engineering India Pvt Ltd
        </p>

        <img src="cid:companylogo" width="180"/>

        </body>
        </html>
        """

    msg = MIMEMultipart("related")

    msg["From"] = EMAIL
    msg["To"] = candidate_email
    msg["Subject"] = subject

    alt = MIMEMultipart("alternative")
    msg.attach(alt)

    alt.attach(MIMEText(body_html, "html"))

    if os.path.exists(LOGO_PATH):

        with open(LOGO_PATH, "rb") as f:
            img = MIMEImage(f.read())
            img.add_header("Content-ID", "<companylogo>")
            msg.attach(img)

    try:

        server = smtplib.SMTP(SMTP, PORT)
        server.starttls()
        server.login(EMAIL, PASSWORD)

        server.sendmail(
            EMAIL,
            candidate_email,
            msg.as_string()
        )

        server.quit()

        print("Email sent to", candidate_email)

    except Exception as e:
        print("Email error:", e)

def send_email(to_email, subject, body, attachment_path=None):

    msg = MIMEMultipart()

    msg["From"] = EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    if attachment_path and os.path.exists(attachment_path):
        with open(attachment_path, "rb") as f:
            part = MIMEApplication(f.read(), Name=os.path.basename(attachment_path))
            part.add_header(
                "Content-Disposition",
                f'attachment; filename="{os.path.basename(attachment_path)}"'
            )
            msg.attach(part)

    try:
        server = smtplib.SMTP(SMTP, PORT)
        server.starttls()
        server.login(EMAIL, PASSWORD)
        server.send_message(msg)
        server.quit()
        print("Email sent to", to_email)
    except Exception as e:
        print("Email error:", e)
        
# ✅ INTERVIEW SCHEDULE EMAIL WITH CALENDAR

from datetime import datetime

def send_interview_email(candidate_email, candidate_name, job_title, interview_date, attachment_path=None):

    subject = "Interview Scheduled"

    body = f"""
Hello {candidate_name},

Your interview for the role of {job_title} has been scheduled.

Date & Time: {interview_date}

Please find the calendar invite attached.

Best regards,
HR Team
"""

    send_email(
        candidate_email,
        subject,
        body,
        attachment_path
    )
