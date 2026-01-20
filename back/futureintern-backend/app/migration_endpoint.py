"""
TEMPORARY: Admin endpoint to run migration
Delete this file after running the migration once!
"""
from flask import Blueprint, jsonify
import os
import re
from app.models.user import User
from app.models import db

migration_bp = Blueprint('migration', __name__)

@migration_bp.route('/run-logo-migration-DO-NOT-SHARE', methods=['GET'])
def run_migration():
    """
    TEMPORARY ENDPOINT - Run logo migration
    Visit this URL once to migrate logos, then delete this file!
    """
    try:
        from flask import current_app
        
        results = {
            'status': 'running',
            'fixed': 0,
            'cleaned': 0,
            'errors': []
        }
        
        # 1. Ensure logos directory exists
        logos_dir = os.path.join(current_app.root_path, '..', 'uploads', 'logos')
        os.makedirs(logos_dir, exist_ok=True)
        
        # 2. Get all companies with logos
        companies = User.query.filter(User.profile_image.isnot(None)).filter_by(role='company').all()
        
        for company in companies:
            old_path = company.profile_image
            logo_path = old_path
            
            try:
                # Step 1: Fix path format
                if old_path.startswith('/logos/'):
                    logo_path = old_path.replace('/logos/', '/uploads/logos/')
                    company.profile_image = logo_path
                    results['fixed'] += 1
                elif old_path.startswith('http'):
                    match = re.search(r'/uploads/logos/(.+)$', old_path)
                    if match:
                        logo_path = f"/uploads/logos/{match.group(1)}"
                        company.profile_image = logo_path
                        results['fixed'] += 1
                
                # Step 2: Check if file exists
                if logo_path.startswith('/uploads/logos/'):
                    filename = logo_path.replace('/uploads/logos/', '')
                    file_path = os.path.join(logos_dir, filename)
                    
                    if not os.path.exists(file_path):
                        company.profile_image = None
                        results['cleaned'] += 1
            except Exception as e:
                results['errors'].append(f"Company {company.id}: {str(e)}")
        
        # Commit changes
        if results['fixed'] > 0 or results['cleaned'] > 0:
            db.session.commit()
            results['status'] = 'success'
            results['message'] = f"Migration complete: Fixed {results['fixed']} paths, cleaned {results['cleaned']} non-existent files"
        else:
            results['status'] = 'success'
            results['message'] = "No migration needed"
        
        return jsonify(results), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
