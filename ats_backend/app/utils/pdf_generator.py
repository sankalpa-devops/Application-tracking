from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import os


def generate_loi_pdf(output_path, candidate, job, offer, template, salary_details):
    """Generate Letter of Intent PDF with letterhead template"""
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor(template.get('header_color', '#1a1a1a')),
        spaceAfter=12,
        alignment=TA_CENTER
    )

    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=12,
        leading=14
    )

    # Letterhead Header
    if template.get('company_logo_path') and os.path.exists(template['company_logo_path']):
        try:
            logo = Image(template['company_logo_path'], width=1.5*inch, height=0.75*inch)
            logo.hAlign = 'CENTER'
            story.append(logo)
            story.append(Spacer(1, 0.2*inch))
        except:
            pass

    if template.get('company_name'):
        story.append(Paragraph(template['company_name'], header_style))
        story.append(Spacer(1, 0.1*inch))

    if template.get('company_address'):
        story.append(Paragraph(template['company_address'], normal_style))
    
    if template.get('company_phone') or template.get('company_email'):
        contact_info = []
        if template.get('company_phone'):
            contact_info.append(f"Phone: {template['company_phone']}")
        if template.get('company_email'):
            contact_info.append(f"Email: {template['company_email']}")
        story.append(Paragraph(" | ".join(contact_info), normal_style))
    
    story.append(Spacer(1, 0.3*inch))

    # Date
    story.append(Paragraph(f"Date: {datetime.now().strftime('%B %d, %Y')}", normal_style))
    story.append(Spacer(1, 0.2*inch))

    # Recipient
    if candidate.get('name'):
        story.append(Paragraph(f"To: {candidate['name']}", normal_style))
    if candidate.get('email'):
        story.append(Paragraph(f"Email: {candidate['email']}", normal_style))
    if candidate.get('phone'):
        story.append(Paragraph(f"Phone: {candidate['phone']}", normal_style))
    
    story.append(Spacer(1, 0.3*inch))

    # Subject
    story.append(Paragraph("<b>Subject: Letter of Intent - Job Offer</b>", normal_style))
    story.append(Spacer(1, 0.2*inch))

    # Salutation
    story.append(Paragraph(f"Dear {candidate.get('name', 'Candidate')},", normal_style))
    story.append(Spacer(1, 0.2*inch))

    # Body
    body_text = f"""
    We are pleased to offer you the position of <b>{job.get('title', 'Position')}</b> at our organization. 
    After reviewing your qualifications and interview performance, we believe you will be a valuable addition to our team.
    
    <b>Position Details:</b><br/>
    • Department: {job.get('department', 'N/A')}<br/>
    • Location: {job.get('location', 'N/A')}<br/>
    • Employment Type: {job.get('type', 'N/A')}<br/>
    • Experience Required: {job.get('experience', 'N/A')}
    
    <b>Compensation Details:</b><br/>
    • Annual CTC: {salary_details.get('ctc', 'N/A')}<br/>
    • Other Benefits: {salary_details.get('benefits', 'As per company policy')}
    
    This letter of intent is subject to successful completion of our standard background verification process 
    and signing of the formal employment agreement.
    
    Please confirm your acceptance of this offer by signing below and returning a copy to us within 
    {salary_details.get('response_days', 7)} working days.
    
    We look forward to welcoming you to our organization.
    
    Sincerely,<br/><br/>
    {template.get('signature_block', 'HR Manager')}<br/>
    {template.get('company_name', 'Organization Name')}
    """
    
    story.append(Paragraph(body_text, normal_style))
    story.append(Spacer(1, 0.5*inch))

    # Signature block
    signature_data = [
        ['', 'Candidate Signature'],
        ['', ''],
        ['', f'Date: _______________'],
        ['', ''],
        ['', ''],
        ['', f'For {template.get("company_name", "Organization Name")}'],
        ['', ''],
        ['', f'Authorized Signatory'],
    ]
    
    signature_table = Table(signature_data, colWidths=[3*inch, 3*inch])
    signature_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEABOVE', (1, 6), (1, 6), 1, colors.black),
    ]))
    story.append(signature_table)

    # Footer
    if template.get('footer_text'):
        story.append(Spacer(1, 0.5*inch))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor(template.get('footer_color', '#666666')),
            alignment=TA_CENTER
        )
        story.append(Paragraph(template['footer_text'], footer_style))

    doc.build(story)
    return output_path


def generate_transfer_letter_pdf(output_path, transfer_request, template):
    """Generate Transfer Letter PDF with letterhead template"""
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor(template.get('header_color', '#1a1a1a')),
        spaceAfter=12,
        alignment=TA_CENTER
    )

    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=12,
        leading=14
    )

    # Letterhead Header
    if template.get('company_logo_path') and os.path.exists(template['company_logo_path']):
        try:
            logo = Image(template['company_logo_path'], width=1.5*inch, height=0.75*inch)
            logo.hAlign = 'CENTER'
            story.append(logo)
            story.append(Spacer(1, 0.2*inch))
        except:
            pass

    if template.get('company_name'):
        story.append(Paragraph(template['company_name'], header_style))
        story.append(Spacer(1, 0.1*inch))

    if template.get('company_address'):
        story.append(Paragraph(template['company_address'], normal_style))
    
    if template.get('company_phone') or template.get('company_email'):
        contact_info = []
        if template.get('company_phone'):
            contact_info.append(f"Phone: {template['company_phone']}")
        if template.get('company_email'):
            contact_info.append(f"Email: {template['company_email']}")
        story.append(Paragraph(" | ".join(contact_info), normal_style))
    
    story.append(Spacer(1, 0.3*inch))

    # Date
    story.append(Paragraph(f"Date: {datetime.now().strftime('%B %d, %Y')}", normal_style))
    story.append(Spacer(1, 0.2*inch))

    # Recipient
    story.append(Paragraph(f"To: {transfer_request.get('employee_name', 'Employee')}", normal_style))
    story.append(Paragraph(f"Employee ID: {transfer_request.get('employee_id', 'N/A')}", normal_style))
    if transfer_request.get('email'):
        story.append(Paragraph(f"Email: {transfer_request['email']}", normal_style))
    
    story.append(Spacer(1, 0.3*inch))

    # Subject
    story.append(Paragraph("<b>Subject: Transfer Order</b>", normal_style))
    story.append(Spacer(1, 0.2*inch))

    # Salutation
    story.append(Paragraph(f"Dear {transfer_request.get('employee_name', 'Employee')},", normal_style))
    story.append(Spacer(1, 0.2*inch))

    # Body
    request_type = transfer_request.get('request_type', 'employee')
    request_type_text = {
        'employee': 'Employee Request',
        'department': 'Department Request',
        'management': 'Management Transfer'
    }.get(request_type, 'Transfer Request')

    body_text = f"""
    With reference to your {request_type_text} for transfer, we are pleased to inform you that 
    your request has been approved. This transfer is effective from {transfer_request.get('preferred_transfer_date', 'as per mutually agreed date')}.
    
    <b>Transfer Details:</b><br/>
    • Current Department: {transfer_request.get('current_department', 'N/A')}<br/>
    • New Department: {transfer_request.get('requested_department', 'N/A')}<br/>
    • Current Location: {transfer_request.get('current_location', 'N/A')}<br/>
    • New Location: {transfer_request.get('requested_location', 'N/A')}
    """
    
    if transfer_request.get('current_field') or transfer_request.get('requested_field'):
        body_text += f"<br/>• Current Field: {transfer_request.get('current_field', 'N/A')}<br/>"
        body_text += f"• New Field: {transfer_request.get('requested_field', 'N/A')}"
    
    body_text += f"""
    
    <b>Reason for Transfer:</b><br/>
    {transfer_request.get('reason', 'As per organizational requirements')}
    
    Please note the following:<br/>
    • You are required to complete all pending handover formalities at your current department<br/>
    • Report to your new department head on the effective date of transfer<br/>
    • Your compensation and benefits will remain unchanged unless otherwise communicated<br/>
    • All company assets must be transferred as per the asset handover process
    
    We wish you success in your new role and look forward to your continued contributions.
    
    Sincerely,<br/><br/>
    {template.get('signature_block', 'HR Manager')}<br/>
    {template.get('company_name', 'Organization Name')}
    """
    
    story.append(Paragraph(body_text, normal_style))
    story.append(Spacer(1, 0.5*inch))

    # Signature block
    signature_data = [
        ['', 'Employee Acknowledgement'],
        ['', ''],
        ['', f'Date: _______________'],
        ['', ''],
        ['', ''],
        ['', f'For {template.get("company_name", "Organization Name")}'],
        ['', ''],
        ['', f'Authorized Signatory'],
    ]
    
    signature_table = Table(signature_data, colWidths=[3*inch, 3*inch])
    signature_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEABOVE', (1, 6), (1, 6), 1, colors.black),
    ]))
    story.append(signature_table)

    # Footer
    if template.get('footer_text'):
        story.append(Spacer(1, 0.5*inch))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor(template.get('footer_color', '#666666')),
            alignment=TA_CENTER
        )
        story.append(Paragraph(template['footer_text'], footer_style))

    doc.build(story)
    return output_path
