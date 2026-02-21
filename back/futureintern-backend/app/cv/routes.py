"""
CV Builder API Routes
Endpoints for managing student CVs: create, read, update, delete sections, and PDF export.
All endpoints are protected: each student can only access their own CV.
"""
import os
from flask import Blueprint, jsonify, request, make_response
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

    return jsonify({'message': 'Section added', 'section': section.to_dict()}), 201


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

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
        from reportlab.lib.enums import TA_LEFT, TA_CENTER
        import io

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                                rightMargin=2*cm, leftMargin=2*cm,
                                topMargin=2*cm, bottomMargin=2*cm)

        styles = getSampleStyleSheet()
        elements = []

        # ── Name & headline ──
        name_style = ParagraphStyle('name', fontSize=20, fontName='Helvetica-Bold',
                                    alignment=TA_CENTER, spaceAfter=4)
        sub_style = ParagraphStyle('sub', fontSize=11, fontName='Helvetica',
                                   alignment=TA_CENTER, textColor=colors.grey, spaceAfter=8)
        body_style = ParagraphStyle('body', fontSize=10, fontName='Helvetica', spaceAfter=4)
        section_title_style = ParagraphStyle('sec', fontSize=12, fontName='Helvetica-Bold',
                                             spaceAfter=4, spaceBefore=10,
                                             textColor=colors.HexColor('#1a1a2e'))

        elements.append(Paragraph(user.name or '', name_style))
        if cv.headline:
            elements.append(Paragraph(cv.headline, sub_style))

        # Contact line
        contacts = []
        if user.email:
            contacts.append(user.email)
        if cv.phone:
            contacts.append(cv.phone)
        if cv.linkedin:
            contacts.append(cv.linkedin)
        if contacts:
            elements.append(Paragraph(' | '.join(contacts), sub_style))

        elements.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#1a1a2e')))
        elements.append(Spacer(1, 8))

        # Summary
        if cv.summary:
            elements.append(Paragraph('Summary', section_title_style))
            elements.append(Paragraph(cv.summary, body_style))
            elements.append(Spacer(1, 6))

        # Group sections by type
        section_order = ['education', 'experience', 'projects', 'skills', 'certifications', 'other']
        grouped = {}
        for s in cv.sections:
            grouped.setdefault(s.section_type, []).append(s)

        for sec_type in section_order:
            if sec_type not in grouped:
                continue
            elements.append(Paragraph(sec_type.capitalize(), section_title_style))
            elements.append(HRFlowable(width='100%', thickness=0.5, color=colors.lightgrey))
            elements.append(Spacer(1, 4))

            for item in grouped[sec_type]:
                if item.title:
                    bold = ParagraphStyle('bold', fontSize=10, fontName='Helvetica-Bold')
                    date_str = ''
                    if item.start_date:
                        date_str = f'{item.start_date} – {item.end_date or "Present"}'
                    header = f'{item.title}'
                    if item.subtitle:
                        header += f' | {item.subtitle}'
                    if date_str:
                        header += f'  ({date_str})'
                    elements.append(Paragraph(header, bold))
                if item.description:
                    elements.append(Paragraph(item.description, body_style))
                elements.append(Spacer(1, 4))

        doc.build(elements)
        buffer.seek(0)

        filename = f"CV_{user.name.replace(' ', '_')}.pdf" if user.name else "CV.pdf"
        response = make_response(buffer.read())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    except ImportError:
        return jsonify({
            'error': 'PDF export requires reportlab. Run: pip install reportlab'
        }), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
