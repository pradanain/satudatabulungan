#!/usr/bin/env python
"""
Sinkronisasi direktori OPD dari file Excel ke JSON untuk frontend.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from pathlib import Path
from typing import Any

try:
    import pandas as pd
except Exception as error:  # pragma: no cover - runtime dependency check
    print("Gagal mengimpor pandas:", error)
    print("Install dulu dependency: python -m pip install pandas openpyxl")
    sys.exit(1)


FIELD_MAPPING = [
    ("No", "no"),
    ("Nama Perangkat Daerah", "name"),
    ("Website Tercantum", "websiteListed"),
    ("Tautan Aktual", "website"),
    ("Alamat", "address"),
    ("Telepon", "phone"),
    ("Fax", "fax"),
    ("Email", "email"),
    ("WhatsApp", "whatsapp"),
    ("Facebook", "facebook"),
    ("Instagram", "instagram"),
    ("YouTube", "youtube"),
    ("TikTok", "tiktok"),
    ("X/Twitter", "twitter"),
    ("Status Data", "status"),
    ("Pemeriksaan", "inspection"),
    ("Catatan", "notes"),
    ("Sumber Halaman Publik", "sourceUrl"),
]


def clean_cell(value: Any) -> str:
    if value is None:
        return ""

    if isinstance(value, float):
        if math.isnan(value):
            return ""
        if value.is_integer():
            return str(int(value))
        return str(value)

    text = str(value).replace("\xa0", " ").strip()
    if text.lower() == "nan":
        return ""
    return text


def detect_header_row(raw_df: "pd.DataFrame") -> int:
    scan_limit = min(len(raw_df), 30)
    for row_idx in range(scan_limit):
        row_values = {clean_cell(cell).lower() for cell in raw_df.iloc[row_idx].tolist()}
        if "nama perangkat daerah" in row_values and "status data" in row_values:
            return row_idx

    raise ValueError(
        "Header tabel tidak ditemukan. Pastikan sheet berisi kolom 'Nama Perangkat Daerah' dan 'Status Data'."
    )


def normalize_records(raw_df: "pd.DataFrame", header_row_idx: int) -> list[dict[str, Any]]:
    header = [clean_cell(value) for value in raw_df.iloc[header_row_idx].tolist()]
    data = raw_df.iloc[header_row_idx + 1 :].copy()
    data.columns = header

    records: list[dict[str, Any]] = []
    for _, row in data.iterrows():
        entry: dict[str, Any] = {}
        for source, target in FIELD_MAPPING:
            entry[target] = clean_cell(row.get(source, ""))

        if not entry["name"]:
            continue

        try:
            entry["no"] = int(str(entry["no"]))
        except (TypeError, ValueError):
            pass

        records.append(entry)

    records.sort(key=lambda item: item["no"] if isinstance(item["no"], int) else 9999)
    return records


def parse_args() -> argparse.Namespace:
    default_input = Path.home() / "Downloads" / "bulungan_perangkat_daerah_enriched_putaran2_final.xlsx"

    parser = argparse.ArgumentParser(
        description="Sinkronisasi file Excel direktori OPD ke JSON frontend."
    )
    parser.add_argument(
        "--input",
        "-i",
        help=f"Path file Excel sumber. Default: {default_input}",
    )
    parser.add_argument(
        "--output",
        "-o",
        default=str(Path("web/src/lib/data/opd-directory.json")),
        help="Path output JSON. Default: web/src/lib/data/opd-directory.json",
    )
    parser.add_argument(
        "--sheet",
        "-s",
        default="Data Lengkap",
        help="Nama sheet sumber. Default: Data Lengkap",
    )
    return parser.parse_args()


def resolve_input_path(input_arg: str | None) -> Path:
    if input_arg:
        return Path(input_arg).expanduser().resolve()

    env_input = os.getenv("OPD_EXCEL_INPUT")
    if env_input:
        return Path(env_input).expanduser().resolve()

    return (Path.home() / "Downloads" / "bulungan_perangkat_daerah_enriched_putaran2_final.xlsx").resolve()


def main() -> int:
    args = parse_args()
    input_path = resolve_input_path(args.input)
    output_path = Path(args.output).expanduser().resolve()

    if not input_path.exists():
        print(f"File input tidak ditemukan: {input_path}")
        print("Gunakan --input <path-file-excel> atau set env OPD_EXCEL_INPUT.")
        return 1

    try:
        raw_df = pd.read_excel(input_path, sheet_name=args.sheet, header=None)
        header_row_idx = detect_header_row(raw_df)
        records = normalize_records(raw_df, header_row_idx)
    except Exception as error:
        print(f"Gagal memproses Excel '{input_path}': {error}")
        return 1

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    with_website = sum(1 for item in records if item.get("website"))
    with_contact = sum(
        1
        for item in records
        if item.get("address") or item.get("phone") or item.get("email") or item.get("whatsapp")
    )

    print(f"Sinkronisasi selesai: {len(records)} OPD")
    print(f"Input : {input_path}")
    print(f"Output: {output_path}")
    print(f"Website tersedia   : {with_website}")
    print(f"Kontak dasar ada   : {with_contact}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
