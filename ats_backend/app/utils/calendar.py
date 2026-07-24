from datetime import datetime, timedelta
from urllib.parse import urlencode


# ✅ Convert datetime to Google format (YYYYMMDDTHHMMSSZ)
def format_google_datetime(dt_str):
    """
    Input: '2026-04-20T15:30'
    Output: '20260420T153000Z'
    """
    dt = datetime.fromisoformat(dt_str)
    return dt.strftime("%Y%m%dT%H%M%SZ")


# ✅ Generate Google Calendar link
def generate_google_calendar_link(
    title="Interview",
    start_time=None,
    duration_minutes=60,
    description="Interview Scheduled",
    location="Online",
    attendees=None,
    meeting_link=None
):
    """
    Generates a Google Calendar event creation link

    Args:
        title: Event title
        start_time: ISO string (YYYY-MM-DDTHH:MM)
        duration_minutes: duration
        description: event description
        location: meeting location
        attendees: list of emails
        meeting_link: optional meeting URL

    Returns:
        Google Calendar URL
    """

    if not start_time:
        return ""

    start = datetime.fromisoformat(start_time)
    end = start + timedelta(minutes=duration_minutes)

    start_fmt = start.strftime("%Y%m%dT%H%M%S")
    end_fmt = end.strftime("%Y%m%dT%H%M%S")

    # ✅ Append meeting link into description
    if meeting_link:
        description += f"\nMeeting Link: {meeting_link}"

    params = {
        "action": "TEMPLATE",
        "text": title,
        "dates": f"{start_fmt}/{end_fmt}",
        "details": description,
        "location": location
    }

    # ✅ Add attendees
    if attendees:
        params["add"] = ",".join(attendees)

    return "https://calendar.google.com/calendar/render?" + urlencode(params)


# ✅ Optional: Auto-create meeting link (simple placeholder)
def generate_meeting_link(candidate_name):
    """
    You can replace this later with Zoom / Google Meet API
    """
    return f"https://meet.google.com/{candidate_name.replace(' ', '').lower()}-interview"


# ✅ Wrapper for interview scheduling (used in interviews.py)
def create_interview_calendar_event(data):
    """
    Accepts API payload and returns calendar link + meeting link
    """

    meeting_link = generate_meeting_link("candidate")

    calendar_link = generate_google_calendar_link(
        title=f"Interview - {data.get('interview_round')}",
        start_time=data.get("interview_date"),
        duration_minutes=60,
        description=f"Interview Round: {data.get('interview_round')}",
        location="Online",
        attendees=data.get("interviewers", []),
        meeting_link=meeting_link
    )

    return {
        "calendar_link": calendar_link,
        "meeting_link": meeting_link
    }