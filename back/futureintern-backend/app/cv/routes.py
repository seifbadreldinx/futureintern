"""
CV Builder API Routes
Endpoints for managing student CVs: create, read, update, delete sections, and PDF export.
All endpoints are protected: each student can only access their own CV.
"""
import os
from flask import Blueprint, jsonify, request, make_response, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db
from app.models.cv import CV, CVSection
from app.models.user import User

cv_bp = Blueprint('cv', __name__)

ALLOWED_SECTION_TYPES = {'education', 'experience', 'skills', 'projects', 'certifications', 'other'}


def _get_student_or_403():
    """Helper: returns (user, None) or (None, error_response)"""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'student':
        return None, (jsonify({'error': 'Only students can access the CV builder'}), 403)
    return user, None


def _get_cv_or_404(user):
    """Returns the CV for this user, or None if it doesn't exist yet."""
    return CV.query.filter_by(student_id=user.id).first()


# ────────────────────────────────────────────────────────
# GET /api/cv/  →  return student's full CV
# ────────────────────────────────────────────────────────
@cv_bp.route("/", methods=["GET"])
@jwt_required()
def get_cv():
    user, err = _get_student_or_403()
    if err:
        return err
    cv = _get_cv_or_404(user)
    if not cv:
        return jsonify({'cv': None, 'message': 'No CV created yet'}), 200
    return jsonify({'cv': cv.to_dict()}), 200


# ────────────────────────────────────────────────────────
# POST /api/cv/  →  create or update CV header info
# ────────────────────────────────────────────────────────
@cv_bp.route("/", methods=["POST"])
@jwt_required()
def create_or_update_cv():
    user, err = _get_student_or_403()
    if err:
        return err

    data = request.get_json() or {}
    cv = _get_cv_or_404(user)

    if not cv:
        cv = CV(student_id=user.id)
        db.session.add(cv)

    # Update header fields
    for field in ('headline', 'summary', 'phone', 'linkedin', 'github', 'website'):
        if field in data:
            setattr(cv, field, str(data[field])[:300] if data[field] else None)

    db.session.commit()
    return jsonify({'message': 'CV saved', 'cv': cv.to_dict()}), 200


# ────────────────────────────────────────────────────────
# POST /api/cv/sections  →  add a new section to the CV
# ────────────────────────────────────────────────────────
@cv_bp.route("/sections", methods=["POST"])
@jwt_required()
def add_section():
    user, err = _get_student_or_403()
    if err:
        return err

    cv = _get_cv_or_404(user)
    if not cv:
        # Auto-create CV if it doesn't exist
        cv = CV(student_id=user.id)
        db.session.add(cv)
        db.session.flush()

    data = request.get_json() or {}
    section_type = data.get('section_type', '').lower()

    if section_type not in ALLOWED_SECTION_TYPES:
        return jsonify({'error': f'section_type must be one of: {", ".join(ALLOWED_SECTION_TYPES)}'}), 400

    # Check & charge points for adding a CV section
    from app.utils.points import check_and_charge
    success, msg, cost = check_and_charge(user, 'cv_section_add')
    if not success:
        return jsonify({
            'error': 'Insufficient points',
            'message': msg,
            'points_required': cost,
            'current_balance': user.points or 0,
        }), 402
    db.session.flush()   # persist the points transaction before creating section

    section = CVSection(
        cv_id=cv.id,
        section_type=section_type,
        title=str(data.get('title', ''))[:200],
        subtitle=str(data.get('subtitle', ''))[:200] if data.get('subtitle') else None,
        location=str(data.get('location', ''))[:200] if data.get('location') else None,
        start_date=str(data.get('start_date', ''))[:20] if data.get('start_date') else None,
        end_date=str(data.get('end_date', ''))[:20] if data.get('end_date') else None,
        description=data.get('description'),
        order_index=int(data.get('order_index', 0)),
    )
    db.session.add(section)
    db.session.commit()

    return jsonify({
        'message': 'Section added',
        'section': section.to_dict(),
        'points_charged': cost,
        'new_balance': user.points or 0,
    }), 201


# ────────────────────────────────────────────────────────
# PUT /api/cv/sections/<section_id>  →  update a section
# ────────────────────────────────────────────────────────
@cv_bp.route("/sections/<int:section_id>", methods=["PUT"])
@jwt_required()
def update_section(section_id):
    user, err = _get_student_or_403()
    if err:
        return err

    section = db.session.get(CVSection, section_id)
    if not section:
        return jsonify({'error': 'Section not found'}), 404

    # Ownership check
    if section.cv.student_id != user.id:
        return jsonify({'error': 'Not authorized to edit this section'}), 403

    data = request.get_json() or {}

    if 'section_type' in data:
        if data['section_type'].lower() not in ALLOWED_SECTION_TYPES:
            return jsonify({'error': f'Invalid section_type'}), 400
        section.section_type = data['section_type'].lower()

    for field in ('title', 'subtitle', 'location', 'start_date', 'end_date', 'description'):
        if field in data:
            setattr(section, field, data[field])

    if 'order_index' in data:
        section.order_index = int(data['order_index'])

    db.session.commit()
    return jsonify({'message': 'Section updated', 'section': section.to_dict()}), 200


# ────────────────────────────────────────────────────────
# DELETE /api/cv/sections/<section_id>  →  remove a section
# ────────────────────────────────────────────────────────
@cv_bp.route("/sections/<int:section_id>", methods=["DELETE"])
@jwt_required()
def delete_section(section_id):
    user, err = _get_student_or_403()
    if err:
        return err

    section = db.session.get(CVSection, section_id)
    if not section:
        return jsonify({'error': 'Section not found'}), 404

    if section.cv.student_id != user.id:
        return jsonify({'error': 'Not authorized to delete this section'}), 403

    db.session.delete(section)
    db.session.commit()
    return jsonify({'message': 'Section deleted'}), 200


# ────────────────────────────────────────────────────────
# GET /api/cv/export/pdf  →  download CV as PDF
# ────────────────────────────────────────────────────────
@cv_bp.route("/export/pdf", methods=["GET"])
@jwt_required()
def export_pdf():
    """
    Generates and returns a PDF of the student's CV using ReportLab.
    Install: pip install reportlab
    """
    user, err = _get_student_or_403()
    if err:
        return err

    cv = _get_cv_or_404(user)
    if not cv:
        return jsonify({'error': 'No CV found. Please create your CV first.'}), 404

    # Check & charge points (first-time-free supported via ServicePricing)
    from app.utils.points import check_and_charge
    success, msg, cost = check_and_charge(user, 'cv_export')
    if not success:
        return jsonify({
            'error': 'Insufficient points',
            'message': msg,
            'points_required': cost,
            'current_balance': user.points or 0,
        }), 402  # Payment Required
    db.session.commit()

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
        from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
        import io
        import re as _re

        # ── Date formatter (matches frontend formatDate) ──────────────────
        _MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        def fmt_date(raw):
            if not raw:
                return ''
            if raw == 'Present':
                return 'Present'
            m = _re.match(r'^(\d{4})-(\d{2})$', raw)
            if m:
                year, month = m.groups()
                idx = int(month) - 1
                if 0 <= idx < 12:
                    return f'{_MONTHS[idx]} {year}'
            return raw

        # ── ATS section label mapping ─────────────────────────────────────
        ATS_LABELS = {
            'education': 'EDUCATION',
            'experience': 'WORK EXPERIENCE',
            'projects': 'PROJECTS',
            'skills': 'SKILLS',
            'certifications': 'CERTIFICATIONS',
            'other': 'OTHER',
        }

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                                rightMargin=2*cm, leftMargin=2*cm,
                                topMargin=2*cm, bottomMargin=2*cm)

        elements = []

        # ── Styles ────────────────────────────────────────────────────────
        name_style = ParagraphStyle('name', fontSize=20, fontName='Helvetica-Bold',
                                    alignment=TA_CENTER, spaceAfter=6, leading=26)
        sub_style = ParagraphStyle('sub', fontSize=10, fontName='Helvetica',
                                   alignment=TA_CENTER, textColor=colors.HexColor('#555555'),
                                   spaceBefore=4, spaceAfter=4)
        contact_style = ParagraphStyle('contact', fontSize=9, fontName='Helvetica',
                                       alignment=TA_CENTER, textColor=colors.HexColor('#555555'), spaceAfter=8)
        body_style = ParagraphStyle('body', fontSize=9.5, fontName='Helvetica',
                                    spaceAfter=3, leading=14)
        section_title_style = ParagraphStyle('sec', fontSize=10, fontName='Helvetica-Bold',
                                             spaceAfter=3, spaceBefore=10,
                                             textTransform='uppercase')
        item_title_style = ParagraphStyle('ititle', fontSize=10, fontName='Helvetica-Bold',
                                          spaceAfter=1)
        item_date_style = ParagraphStyle('idate', fontSize=9, fontName='Helvetica',
                                         textColor=colors.HexColor('#555555'),
                                         alignment=TA_RIGHT, spaceAfter=1)
        item_sub_style = ParagraphStyle('isub', fontSize=9.5, fontName='Helvetica-Oblique',
                                        textColor=colors.HexColor('#444444'), spaceAfter=2)

        # ── Name ─────────────────────────────────────────────────────────
        elements.append(Paragraph(user.name or '', name_style))
        if cv.headline:
            elements.append(Paragraph(cv.headline, sub_style))

        # ── Contact line (all fields) ─────────────────────────────────────
        contacts = []
        if user.email:
            contacts.append(user.email)
        if cv.phone:
            contacts.append(cv.phone)
        if cv.linkedin:
            contacts.append(cv.linkedin)
        if cv.github:
            contacts.append(cv.github)
        if cv.website:
            contacts.append(cv.website)
        if contacts:
            elements.append(Paragraph('  |  '.join(contacts), contact_style))

        elements.append(HRFlowable(width='100%', thickness=1.5, color=colors.HexColor('#1a1a1a')))
        elements.append(Spacer(1, 6))

        # ── Summary ───────────────────────────────────────────────────────
        if cv.summary:
            elements.append(Paragraph('SUMMARY', section_title_style))
            elements.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#cccccc')))
            elements.append(Spacer(1, 3))
            elements.append(Paragraph(cv.summary, body_style))
            elements.append(Spacer(1, 4))

        # ── Sections ──────────────────────────────────────────────────────
        section_order = ['education', 'experience', 'projects', 'skills', 'certifications', 'other']
        grouped = {}
        for s in cv.sections:
            grouped.setdefault(s.section_type, []).append(s)

        # available width inside margins
        page_w = A4[0] - 4 * cm  # left 2cm + right 2cm

        for sec_type in section_order:
            if sec_type not in grouped:
                continue

            label = ATS_LABELS.get(sec_type, sec_type.upper())
            elements.append(Paragraph(label, section_title_style))
            elements.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#cccccc')))
            elements.append(Spacer(1, 3))

            for item in grouped[sec_type]:
                # Title + date as a two-column table row
                start_fmt = fmt_date(item.start_date)
                end_fmt = fmt_date(item.end_date) if item.end_date else ''
                if item.end_date == 'Present' or not item.end_date:
                    end_fmt = 'Present' if item.start_date else ''
                date_str = f'{start_fmt} – {end_fmt}' if start_fmt else end_fmt

                title_cell = Paragraph(item.title or '', item_title_style)
                date_cell = Paragraph(date_str, item_date_style)

                title_table = Table(
                    [[title_cell, date_cell]],
                    colWidths=[page_w * 0.68, page_w * 0.32],
                )
                title_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                    ('TOPPADDING', (0, 0), (-1, -1), 0),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ]))
                elements.append(title_table)

                # Subtitle · location
                if item.subtitle or item.location:
                    sub_parts = [p for p in [item.subtitle, item.location] if p]
                    elements.append(Paragraph(' · '.join(sub_parts), item_sub_style))

                # Description
                if item.description:
                    elements.append(Paragraph(item.description, body_style))

                elements.append(Spacer(1, 5))

        doc.build(elements)
        buffer.seek(0)

        import re as _re2
        safe_name = _re2.sub(r'[^\w\s-]', '', user.name or '').strip().replace(' ', '_')
        safe_name = safe_name[:50] or 'CV'
        filename = f"CV_{safe_name}.pdf"
        response = make_response(buffer.read())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    except ImportError:
        return jsonify({
            'error': 'PDF export requires reportlab. Run: pip install reportlab'
        }), 500
    except Exception as e:
        current_app.logger.error("CV PDF export error for user %s: %s", user.id, e)
        return jsonify({'error': 'Failed to generate PDF. Please try again.'}), 500
