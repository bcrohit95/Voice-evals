import re
from jiwer import wer as _wer, cer as _cer, mer as _mer, wil as _wil


def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s']", "", text)
    text = re.sub(r"\s+", " ", text)
    return text


def compute_metrics(hypothesis: str, reference: str) -> dict:
    if not reference or not reference.strip():
        return {"wer": None, "cer": None, "mer": None, "wil": None}

    hyp = normalize_text(hypothesis or "")
    ref = normalize_text(reference)

    if not ref:
        return {"wer": None, "cer": None, "mer": None, "wil": None}

    try:
        return {
            "wer": round(_wer(ref, hyp), 4),
            "cer": round(_cer(ref, hyp), 4),
            "mer": round(_mer(ref, hyp), 4),
            "wil": round(_wil(ref, hyp), 4),
        }
    except Exception as e:
        return {"wer": None, "cer": None, "mer": None, "wil": None, "error": str(e)}
