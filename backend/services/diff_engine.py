import difflib
from typing import List, Dict


def compute_word_diff(hypothesis: str, reference: str) -> List[Dict]:
    """Word-level diff returning tokens with type for UI rendering."""
    hyp_words = (hypothesis or "").lower().split()
    ref_words = (reference or "").lower().split()

    matcher = difflib.SequenceMatcher(None, ref_words, hyp_words, autojunk=False)
    tokens: List[Dict] = []

    for op, i1, i2, j1, j2 in matcher.get_opcodes():
        if op == "equal":
            for w in ref_words[i1:i2]:
                tokens.append({"word": w, "type": "correct"})
        elif op == "replace":
            for w in ref_words[i1:i2]:
                tokens.append({"word": w, "type": "deletion"})
            for w in hyp_words[j1:j2]:
                tokens.append({"word": w, "type": "insertion"})
        elif op == "delete":
            for w in ref_words[i1:i2]:
                tokens.append({"word": w, "type": "deletion"})
        elif op == "insert":
            for w in hyp_words[j1:j2]:
                tokens.append({"word": w, "type": "insertion"})

    return tokens
