/**
 * Utility to upload files with progress tracking using XMLHttpRequest.
 * Supports multipart/form-data for optimal efficiency with large files.
 */
export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResponse {
  success: boolean;
  url: string;
  storage?: "ckan" | "local";
  error?: string;
}

export function uploadFileWithProgress(
  file: File,
  contentType?: string,
  onProgress?: (event: UploadProgressEvent) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.set("file", file);
    if (contentType) {
      formData.set("contentType", contentType);
    }

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage,
          });
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as UploadResponse;
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || "Gagal mengunggah berkas."));
          }
        } catch {
          reject(new Error("Gagal mengurai respons server."));
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText) as UploadResponse;
          reject(new Error(response.error || `Unggahan gagal dengan status ${xhr.status}.`));
        } catch {
          reject(new Error(`Unggahan gagal dengan status ${xhr.status}.`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Terjadi kesalahan jaringan saat mengunggah berkas."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Unggahan dibatalkan oleh pengguna."));
    });

    xhr.open("POST", "/api/internal/uploads/file");
    xhr.send(formData);
  });
}
