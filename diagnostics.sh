#!/bin/bash
# =====================================================================
# Satu Data Bulungan - Server Diagnostic Script
# =====================================================================
# Cara menjalankan:
# 1. SSH ke server Anda
# 2. Masuk ke direktori web root Anda
# 3. Jalankan: bash diagnostics.sh
# 4. Salin isi berkas 'diagnostics_report.txt' yang terbentuk ke ChatGPT.
# =====================================================================

REPORT_FILE="diagnostics_report.txt"

{
  echo "====================================================================="
  echo "          SATU DATA BULUNGAN - SERVER DIAGNOSTICS REPORT             "
  echo "          Generated on: $(date)"
  echo "====================================================================="
  echo ""

  echo "---------------------------------------------------------------------"
  echo "1. INFORMASI DISK SPACE (df -h)"
  echo "---------------------------------------------------------------------"
  df -h
  echo ""

  echo "---------------------------------------------------------------------"
  echo "2. INFORMASI MEMORY / RAM (free -h)"
  echo "---------------------------------------------------------------------"
  free -h
  echo ""

  echo "---------------------------------------------------------------------"
  echo "3. PENGATURAN UKURAN UPLOAD NGINX (client_max_body_size)"
  echo "---------------------------------------------------------------------"
  if [ -d "/etc/nginx" ]; then
    echo "Mencari 'client_max_body_size' di /etc/nginx/..."
    grep -rn "client_max_body_size" /etc/nginx/ 2>/dev/null || echo "Tidak ditemukan pengaturan kustom (default 1MB)."
  else
    echo "Direktori /etc/nginx tidak ditemukan."
  fi
  echo ""

  echo "---------------------------------------------------------------------"
  echo "4. HAK AKSES NGINX TEMPORARY DIRECTORY"
  echo "---------------------------------------------------------------------"
  echo "Memeriksa status folder temporer untuk buffer unggahan berkas..."
  ls -ld /var/lib/nginx /var/lib/nginx/tmp /var/lib/nginx/tmp/client_body_temp 2>/dev/null || echo "Folder Nginx temp tidak ditemukan di path default (/var/lib/nginx)."
  echo ""

  echo "---------------------------------------------------------------------"
  echo "5. LOG ERROR NGINX TERBARU (Last 50 lines)"
  echo "---------------------------------------------------------------------"
  if [ -f "/var/log/nginx/error.log" ]; then
    echo "Menampilkan 50 baris terakhir error.log..."
    tail -n 50 /var/log/nginx/error.log 2>/dev/null || echo "Tidak dapat membaca file log (perlu izin sudo)."
  else
    echo "Berkas log /var/log/nginx/error.log tidak ditemukan."
  fi
  echo ""

  echo "---------------------------------------------------------------------"
  echo "6. STATUS NEXT.JS / PM2 PROCESS LIST"
  echo "---------------------------------------------------------------------"
  if command -v pm2 &> /dev/null; then
    pm2 status
  else
    echo "Perintah PM2 tidak ditemukan atau proses dijalankan langsung."
  fi
  echo ""

  echo "---------------------------------------------------------------------"
  echo "7. LOG DARI PM2 / NEXT.JS TERBARU (Last 50 lines)"
  echo "---------------------------------------------------------------------"
  if command -v pm2 &> /dev/null; then
    pm2 logs --lines 50 --nostream 2>/dev/null || echo "Tidak dapat membaca log dari PM2."
  else
    echo "PM2 tidak aktif."
  fi
  echo ""

  echo "---------------------------------------------------------------------"
  echo "8. KONEKSI & STATUS CKAN PORTAL"
  echo "---------------------------------------------------------------------"
  echo "Membaca variabel lingkungan CKAN..."
  echo "CKAN Base URL: $CKAN_BASE_URL"
  echo "Mencoba melakukan ping ke CKAN Base URL..."
  if [ -n "$CKAN_BASE_URL" ]; then
    curl -Is "$CKAN_BASE_URL/api/3/action/site_read" | head -n 10 || echo "Gagal menghubungi CKAN Base URL."
  else
    echo "Variabel CKAN_BASE_URL kosong di lingkungan shell saat ini."
  fi
  echo ""

  echo "====================================================================="
  echo "                     AKHIR DARI LAPORAN DIAGNOSTIK                   "
  echo "====================================================================="
} > "$REPORT_FILE"

echo "====================================================================="
echo " Laporan diagnostik berhasil dibuat di: $REPORT_FILE"
echo " Silakan salin atau kirimkan isi file tersebut ke saya."
echo " Perintah untuk menampilkan isi laporan:"
echo " cat $REPORT_FILE"
echo "====================================================================="
