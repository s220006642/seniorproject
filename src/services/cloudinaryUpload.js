const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function uploadToCloudinary(file) {
  if (!file) throw new Error("No file selected.");

  if (!file.type || !ALLOWED.includes(file.type)) {
    throw new Error("الصورة لازم تكون JPG أو PNG أو WebP.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("حجم الصورة كبير. الحد الأقصى 2MB.");
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary env vars missing.");
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);

  // (اختياري) نخزنها تحت مجلد واحد
  form.append("folder", "foodtrucks");

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Cloudinary upload failed.");
  }

  // secure_url هو الأفضل
  return data.secure_url || data.url;
}