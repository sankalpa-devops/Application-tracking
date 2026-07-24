import re
import pdfplumber
import docx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def extract_text(file_path: str) -> str:
    text = ""

    if file_path.endswith(".pdf"):
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                if page.extract_text():
                    text += page.extract_text() + "\n"

    elif file_path.endswith(".docx"):
        doc = docx.Document(file_path)
        text = "\n".join([p.text for p in doc.paragraphs])

    return text.lower()


def extract_skills(text: str, job_skills: list[str]) -> tuple[list[str], list[str]]:
    found = []
    matched = []

    for skill in job_skills:
        skill_clean = skill.strip().lower()
        if skill_clean in text:
            matched.append(skill_clean)
        found.append(skill_clean)

    return found, matched


def estimate_experience(text: str) -> float:
    matches = re.findall(r'(\d+)\+?\s+years', text)
    if matches:
        return float(max(matches))
    return 0.0


def calculate_ats_score(matched: list[str], total: list[str]) -> int:
    if not total:
        return 0
    return int((len(matched) / len(total)) * 100)


# def parse_resume(file_path: str, job_skills: str):
def parse_resume(file_path: str, job_skills: str, job_description: str):

    text = extract_text(file_path)

    job_skill_list = [s.strip() for s in job_skills.split(",")]

    found, matched = extract_skills(text, job_skill_list)

    experience = estimate_experience(text)

    skill_score = calculate_ats_score(matched, job_skill_list)

    jd_score = calculate_jd_similarity(text, job_description)

    exp_score = calculate_experience_score(experience)

    final_score = int(
        (0.5 * skill_score) +
        (0.4 * jd_score) +
        (0.1 * exp_score)
    )

    return {
        "text": text,
        "skills": found,
        "matched": matched,
        "experience": experience,
        "skill_score": skill_score,
        "jd_score": jd_score,
        "exp_score": exp_score,
        "score": final_score
    }
    
def calculate_jd_similarity(resume_text: str, job_description: str) -> int:
    try:
        documents = [resume_text, job_description]

        tfidf = TfidfVectorizer(stop_words="english")
        vectors = tfidf.fit_transform(documents)

        similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]

        return int(similarity * 100)
    except:
        return 0

def calculate_experience_score(candidate_exp: float, required_exp: float = 0) -> int:
    if required_exp == 0:
        return 50  # neutral

    if candidate_exp >= required_exp:
        return 100

    return int((candidate_exp / required_exp) * 100)