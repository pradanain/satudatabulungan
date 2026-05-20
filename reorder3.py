import sys
import re

file_path = 'web/src/components/internal/internal-dataset-form.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Identify the exact blocks
judul_match = re.search(r'(\s*{/\* ─── ROW 1: Judul Dataset \(full width\) ──────────────────── \*/}.*?</div>)', content, re.DOTALL)
hidden_slug = re.search(r'(\s*<input type="hidden" value=\{form\.slug\} />)', content, re.DOTALL)
metadata_utama = re.search(r'(\s*{/\* ─── ROW 2: Metadata Utama \(4 kolom\) ──────────────────── \*/}.*?</div>\s*</div>)', content, re.DOTALL)
metadata_satuan = re.search(r'(\s*{/\* ─── ROW 3: Satuan & Produsen Data ──────────────────── \*/}.*?</div>\s*</div>)', content, re.DOTALL)
hidden_wali = re.search(r'(\s*{/\* Hidden fields \*/}.*?<input type="hidden" value=\{form\.coverage\} />)', content, re.DOTALL)
deskripsi = re.search(r'(\s*{/\* ─── ROW 4: Deskripsi Dataset ──────────────────── \*/}.*?</div>)', content, re.DOTALL)

# Capture everything from ROW 5: Upload File until </Card> (exclusive)
upload_full = re.search(r'(\s*{/\* ─── ROW 5: Upload File ──────────────────── \*/}.*?)(?=\s*</Card>)', content, re.DOTALL)

if not all([judul_match, hidden_slug, metadata_utama, metadata_satuan, hidden_wali, deskripsi, upload_full]):
    print("Some blocks not found!")
    sys.exit(1)

new_layout = f"""
        {{/* ========================================================= */}}
        {{/* BAGIAN 1: INFORMASI DATASET */}}
        {{/* ========================================================= */}}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1e2f52] text-white">
              <span className="text-[10px] font-bold">1</span>
            </div>
            <h3 className="text-sm font-bold text-[#1e2f52] uppercase tracking-wider">Informasi Dataset</h3>
          </div>
          <div className="space-y-6">{judul_match.group(1)}{deskripsi.group(1)}
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200 my-8" />

        {{/* ========================================================= */}}
        {{/* BAGIAN 2: UNGGAH DATASET */}}
        {{/* ========================================================= */}}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1e2f52] text-white">
              <span className="text-[10px] font-bold">2</span>
            </div>
            <h3 className="text-sm font-bold text-[#1e2f52] uppercase tracking-wider">Unggah Dataset</h3>
          </div>
          <div className="space-y-6">{upload_full.group(1)}
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200 my-8" />

        {{/* ========================================================= */}}
        {{/* BAGIAN 3: METADATA DATASET */}}
        {{/* ========================================================= */}}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1e2f52] text-white">
              <span className="text-[10px] font-bold">3</span>
            </div>
            <h3 className="text-sm font-bold text-[#1e2f52] uppercase tracking-wider">Metadata Dataset</h3>
          </div>
          <div className="space-y-6">{metadata_utama.group(1)}{metadata_satuan.group(1)}
          </div>
        </div>{hidden_slug.group(1)}{hidden_wali.group(1)}
"""

start_pos = judul_match.start(1)
end_pos = upload_full.end(1)

new_content = content[:start_pos] + new_layout + content[end_pos:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replacement successful")
