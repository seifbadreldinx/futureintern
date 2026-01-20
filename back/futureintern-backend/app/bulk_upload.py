"""
Bulk Logo Upload Endpoint
"""
from flask import Blueprint, request, jsonify
from app.models.user import User
from app.models import db
from app.utils.file_upload import save_logo, ALLOWED_IMAGE_EXTENSIONS
import os

bulk_upload_bp = Blueprint('bulk_upload', __name__)

@bulk_upload_bp.route('/bulk-upload-logos-ADMIN', methods=['POST'])
def bulk_upload_logos():
    """
    Bulk upload logos for multiple companies
    
    Send POST request with:
    - multipart/form-data
    - Files named: logo_1, logo_2, logo_3, etc.
    - Form fields: company_id_1, company_id_2, company_id_3 (matching the logo numbers)
    
    OR send company_name_1, company_name_2 instead of IDs
    """
    try:
        results = {
            'success': [],
            'errors': [],
            'total': 0
        }
        
        # Get all uploaded files
        uploaded_files = request.files
        form_data = request.form
        
        # Process each logo
        logo_index = 1
        while f'logo_{logo_index}' in uploaded_files:
            logo_file = uploaded_files[f'logo_{logo_index}']
            
            # Get company identifier (ID or name)
            company_id = form_data.get(f'company_id_{logo_index}')
            company_name = form_data.get(f'company_name_{logo_index}')
            
            if not company_id and not company_name:
                results['errors'].append({
                    'logo': f'logo_{logo_index}',
                    'error': 'No company_id or company_name provided'
                })
                logo_index += 1
                continue
            
            # Find the company
            if company_id:
                company = User.query.filter_by(id=company_id, role='company').first()
            else:
                # Try both company_name field and name field
                company = User.query.filter_by(company_name=company_name, role='company').first()
                if not company:
                    company = User.query.filter_by(name=company_name, role='company').first()
            
            if not company:
                results['errors'].append({
                    'logo': f'logo_{logo_index}',
                    'error': f'Company not found: {company_id or company_name}'
                })
                logo_index += 1
                continue
            
            # Save the logo
            logo_path, error = save_logo(logo_file, company.id)
            
            if error:
                results['errors'].append({
                    'logo': f'logo_{logo_index}',
                    'company': company.company_name or company.name,
                    'error': error
                })
            else:
                # Update company profile
                company.profile_image = logo_path
                results['success'].append({
                    'logo': f'logo_{logo_index}',
                    'company_id': company.id,
                    'company_name': company.company_name or company.name,
                    'logo_path': logo_path
                })
            
            logo_index += 1
        
        results['total'] = len(results['success']) + len(results['errors'])
        
        # Commit all changes
        if results['success']:
            db.session.commit()
        
        return jsonify(results), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': str(e),
            'success': [],
            'errors': []
        }), 500


@bulk_upload_bp.route('/list-companies-for-upload', methods=['GET'])
def list_companies():
    """
    List all companies with their IDs for logo upload
    """
    try:
        companies = User.query.filter_by(role='company').order_by(User.id).all()
        
        company_list = [{
            'id': c.id,
            'name': c.company_name or c.name,
            'email': c.email,
            'has_logo': bool(c.profile_image)
        } for c in companies]
        
        return jsonify({
            'total': len(company_list),
            'companies': company_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
