import sys
import re

file_path = 'web/src/components/internal/internal-dataset-form.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We will extract the blocks using regex.
# The card content starts after: <Card className="p-6 border border-gray-200/80 rounded-3xl shadow-xs bg-white space-y-6">
# and ends at: {/* ─── DIVIDER ──────────────────── */} or `<div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--color-border)]">`

def extract_block(pattern, text):
    match = re.search(pattern, text, re.DOTALL)
    if not match: return ""
    return match.group(1)

# 1. Judul Dataset
judul_pattern = r'({\s*/\*\s*───\s*ROW 1: Judul Dataset.*?</div>)'
judul_block = extract_block(judul_pattern, content)

# 1.5 Hidden fields
hidden_pattern = r'(<input type="hidden" value=\{form\.slug\}.*?<input type="hidden" value=\{form\.coverage\} />)'
hidden_block = extract_block(hidden_pattern, content)

# 2. Metadata Utama
meta1_pattern = r'({\s*/\*\s*───\s*ROW 2: Metadata Utama.*?</div>\s*</div>)'
meta1_block = extract_block(meta1_pattern, content)

# 3. Satuan & Produsen Data
meta2_pattern = r'({\s*/\*\s*───\s*ROW 3: Satuan & Produsen Data.*?</div>\s*</div>)'
meta2_block = extract_block(meta2_pattern, content)

# 4. Deskripsi
deskripsi_pattern = r'({\s*/\*\s*───\s*ROW 4: Deskripsi Dataset.*?</div>)'
deskripsi_block = extract_block(deskripsi_pattern, content)

# 5. Upload File (including list and preview)
upload_pattern = r'({\s*/\*\s*───\s*ROW 5: Upload File.*?</table>\s*</div>\s*</div>\s*)}'
# Actually, it's safer to extract from ROW 5 to just before the buttons.
upload_full_pattern = r'({\s*/\*\s*───\s*ROW 5: Upload File.*?)\s*(?={/\* \-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\- \*/|\s*<div className="flex items-center justify-end)'
upload_block = extract_block(upload_full_pattern, content)

# Let's write a targeted script to do exact string replacement.
