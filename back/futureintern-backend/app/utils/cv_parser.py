import os
import re

def extract_text_from_pdf(filepath):
    try:
        import PyPDF2
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + " "
            return text
    except ImportError:
        print("PyPDF2 not installed. Skipping PDF text extraction.")
        return ""
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def extract_text_from_docx(filepath):
    try:
        import docx
        doc = docx.Document(filepath)
        return " ".join([p.text for p in doc.paragraphs])
    except ImportError:
        print("python-docx not installed. Skipping DOCX text extraction.")
        return ""
    except Exception as e:
        print(f"Error reading DOCX: {e}")
        return ""

def extract_skills(text):
    if not text:
        return []
        
    # extensible list of skills
    COMMON_SKILLS = {
        'python', 'java', 'javascript', 'typescript', 'react', 'reactjs', 'angular', 'vue', 'vuejs',
        'html', 'css', 'sass', 'scss', 'tailwind', 'bootstrap',
        'node', 'nodejs', 'express', 'django', 'flask', 'fastapi',
        'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd',
        'git', 'github', 'gitlab', 'linux', 'bash', 'shell',
        'agile', 'scrum', 'jira', 'confluence',
        'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
        'design', 'figma', 'adobe xd', 'photoshop', 'illustrator',
        'machine learning', 'deep learning', 'data science', 'pandas', 'numpy', 'scikit-learn', 'pytorch', 'tensorflow',
        'c++', 'c#', '.net', 'php', 'laravel', 'ruby', 'rails', 'go', 'golang', 'rust', 'swift', 'kotlin'
    }
    
    found_skills = set()
    text_lower = text.lower()
    
    # Improve matching to handle word boundaries
    for skill in COMMON_SKILLS:
        # escapes special chars in skill name if any (like c++)
        pattern = r'\b' + re.escape(skill) + r'\b'
        # specific handling for c++ and .net as \b might fail on symbols
        if skill in ['c++', '.net', 'c#']:
             if skill in text_lower: # simpler check for symbolic skills
                 found_skills.add(skill)
        elif re.search(pattern, text_lower):
            found_skills.add(skill)
            
    # Format skills to Title Case (mostly)
    formatted_skills = []
    for skill in found_skills:
        if skill in ['html', 'css', 'sql', 'aws', 'api', 'php']:
            formatted_skills.append(skill.upper())
        elif skill in ['reactjs', 'vuejs', 'nodejs']:
            formatted_skills.append(skill[:-2].capitalize() + '.js')
        else:
            formatted_skills.append(skill.title())
            
    return sorted(list(formatted_skills))

def parse_cv(filepath):
    """
    Parses a CV file and extracts text and skills.
    Returns tuple (text, skills_list)
    """
    ext = os.path.splitext(filepath)[1].lower()
    text = ""
    
    if ext == '.pdf':
        text = extract_text_from_pdf(filepath)
    elif ext in ['.doc', '.docx']:
        text = extract_text_from_docx(filepath)
        
    skills = extract_skills(text)
    return text, skills
