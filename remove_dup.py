import re

file_path = 'web/src/components/internal/internal-dataset-form.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to remove the block that starts with {/* ─── ROW 4: Deskripsi Dataset ──────────────────── */}
# that is located AFTER Bagian 3.
# The issue is that the replacement script didn't remove the original lines properly or left a trail.

# Let's find the last occurrence of the hidden inputs before the duplicate block:
# It's right after `        <input type="hidden" value={form.slug} />` and `<input type="hidden" value={form.walidata} />`
# We can just match:
#            {/* ─── ROW 4: Deskripsi Dataset ──────────────────── */}
#            <div className="flex flex-col gap-1.5">
# ...
#            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#d6ddeb] bg-gray-50/50 p-5 text-center transition hover:bg-gray-50">
#              <input
#                type="file"
#                accept=".xlsx,.xls,.csv,.json,.pdf"
#                onChange={handleFileChange}
#                multiple
#                className="block max-w-max text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#4b7fe0] hover:file:bg-blue-100 cursor-pointer"
#              />
#              <span className="text-[10px] text-gray-400">
#                Mendukung multi-file (.xlsx, .csv, .json, .pdf)
#              </span>
#            </div>
#          </div>
#        </div>

# Actually, the simplest way is to match from:
#        <input type="hidden" value={form.coverage} />
#      </Card>
# and check what is before it.

pattern_to_remove = r'(\s*{/\* ─── ROW 4: Deskripsi Dataset ──────────────────── \*/}.*?)(\s*</Card>)'

match = re.search(pattern_to_remove, content, re.DOTALL)
if match:
    # Just to be sure we are not removing the primary one!
    # The primary one is now under BAGIAN 1. It does NOT have `ROW 4:` comment anymore, because my script stripped it or no wait:
    # `new_layout` included `deskripsi.group(1)` which INCLUDES the comment `{/* ─── ROW 4: Deskripsi Dataset ──────────────────── */}`!
    pass

# So there are TWO `{/* ─── ROW 4: Deskripsi Dataset ──────────────────── */}` in the file.
# We want to remove the SECOND one.
matches = list(re.finditer(r'\s*{/\* ─── ROW 4: Deskripsi Dataset ──────────────────── \*/}', content))
if len(matches) > 1:
    start_pos = matches[-1].start() # get the last occurrence
    # find the next </Card>
    end_pos = content.find('</Card>', start_pos)
    if end_pos != -1:
        # Before we delete, we should check what we are deleting.
        # It's exactly the duplicate block.
        # Wait, the closing `</div>` might not match perfectly if we delete up to `</Card>`.
        # Let's delete up to `</Card>` and keep `</Card>`.
        new_content = content[:start_pos] + '\n      ' + content[end_pos:]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Removed duplicates!")
    else:
        print("Could not find </Card> after second match.")
else:
    print("No duplicates found.")
