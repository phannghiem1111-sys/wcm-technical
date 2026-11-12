/** Gọi API gửi mail biên bản (cửa hàng + nhân viên). Không ném lỗi. */
export async function sendInspectionEmail(id: string): Promise<{ ok: boolean; to?: string[]; error?: string }> {
  try {
    const res = await fetch(`/api/inspections/${id}/email`, { method: "POST" });
    return await res.json();
  } catch {
    return { ok: false, error: "Không kết nối được máy chủ" };
  }
}
