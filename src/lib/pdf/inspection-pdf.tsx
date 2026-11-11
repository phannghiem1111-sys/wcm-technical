import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { BAD_RESULTS, COMPLETION_LABEL, FORM_META, RESULT_LABEL, STATUS_LABEL } from "@/lib/constants";
import type { InspectionFull, ItemRow, PhotoRow } from "@/lib/inspection-data";
import { groupBySection } from "@/lib/inspection-data";

const fontDir = path.join(process.cwd(), "public", "fonts");
Font.register({
  family: "Roboto",
  fonts: [
    { src: path.join(fontDir, "Roboto-Regular.ttf") },
    { src: path.join(fontDir, "Roboto-Bold.ttf"), fontWeight: "bold" },
  ],
});
Font.registerHyphenationCallback((w) => [w]);

const RED = "#d9232d";
const s = StyleSheet.create({
  page: { fontFamily: "Roboto", fontSize: 9, padding: 28, paddingBottom: 40, color: "#111827" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 2, borderBottomColor: RED, paddingBottom: 8, marginBottom: 10 },
  logo: { backgroundColor: RED, color: "white", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, fontWeight: "bold", fontSize: 12 },
  brand: { fontSize: 7, color: "#6b7280", marginTop: 2 },
  title: { fontSize: 15, fontWeight: "bold", textAlign: "center", textTransform: "uppercase", marginVertical: 6 },
  code: { textAlign: "center", color: "#6b7280", marginBottom: 10 },
  info: { flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, padding: 6, marginBottom: 8 },
  infoCell: { width: "50%", paddingVertical: 2 },
  bold: { fontWeight: "bold" },
  summary: { flexDirection: "row", gap: 6, marginBottom: 10 },
  sumBox: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, padding: 5, alignItems: "center" },
  sumVal: { fontSize: 13, fontWeight: "bold" },
  sumLbl: { fontSize: 7, color: "#6b7280" },
  section: { backgroundColor: "#111827", color: "white", padding: 5, fontWeight: "bold", marginTop: 6 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#d1d5db", borderLeftWidth: 0.5, borderRightWidth: 0.5, borderLeftColor: "#d1d5db", borderRightColor: "#d1d5db" },
  th: { backgroundColor: "#f3f4f6", fontWeight: "bold" },
  c1: { width: 22, padding: 4, textAlign: "center" },
  c2: { flex: 1, padding: 4 },
  c3: { width: 70, padding: 4, textAlign: "center" },
  c4: { width: 140, padding: 4 },
  bad: { color: "#b91c1c", fontWeight: "bold" },
  ok: { color: "#047857", fontWeight: "bold" },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 3 },
  photo: { width: 82, height: 62, objectFit: "cover", borderRadius: 2 },
  cap: { fontSize: 6, color: "#6b7280", width: 82 },
  signRow: { flexDirection: "row", marginTop: 16, gap: 10 },
  signBox: { flex: 1, alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, padding: 6, minHeight: 100 },
  signImg: { height: 55, objectFit: "contain", marginVertical: 4 },
  footer: { position: "absolute", bottom: 16, left: 28, right: 28, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: "#9ca3af" },
});

const d = (v?: string | null) => (v ? new Date(v).toLocaleDateString("vi-VN") : "");
const dt = (v?: string | null) => (v ? new Date(v).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "");

export type PdfImage = { data: Buffer; format: "jpg" | "png" };

export function InspectionPdf({ i, items, photos, images, sig, approver }: {
  i: InspectionFull; items: ItemRow[]; photos: PhotoRow[]; images: Map<string, PdfImage>;
  sig: { inspector?: PdfImage; store?: PdfImage }; approver: { full_name: string; msnv: string } | null;
}) {
  const meta = FORM_META[i.form_type];
  const isMaint = i.form_type === "maintenance";
  return (
    <Document title={`${i.code} - ${i.store_code}`} author="WCM TECHNICAL" subject={meta.title}>
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View>
            <Text style={s.logo}>WCM TECHNICAL</Text>
            <Text style={s.brand}>WINCOMMERCE TECHNICAL MANAGEMENT</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.bold}>{i.code}</Text>
            <Text style={{ color: "#6b7280" }}>Trạng thái: {STATUS_LABEL[i.status] ?? i.status}</Text>
          </View>
        </View>

        <Text style={s.title}>{meta.title}</Text>
        <Text style={s.code}>Số: {i.code} · Ngày lập: {dt(i.created_at)}</Text>

        <View style={s.info}>
          <Text style={s.infoCell}><Text style={s.bold}>Mã cửa hàng: </Text>{i.store_code}</Text>
          <Text style={s.infoCell}><Text style={s.bold}>Tên cửa hàng: </Text>{i.store_name}</Text>
          <Text style={{ ...s.infoCell, width: "100%" }}><Text style={s.bold}>Địa chỉ: </Text>{i.store_address ?? ""}</Text>
          <Text style={s.infoCell}><Text style={s.bold}>Khu vực: </Text>{[i.region_name, i.province].filter(Boolean).join(" – ")}</Text>
          <Text style={s.infoCell}><Text style={s.bold}>Ngày thực hiện: </Text>{d(i.inspection_date)}</Text>
          <Text style={s.infoCell}><Text style={s.bold}>Nhân viên: </Text>{i.inspector_msnv} – {i.inspector_name}</Text>
          {isMaint && i.device_config && <Text style={s.infoCell}><Text style={s.bold}>Số thiết bị: </Text>{Object.values(i.device_config).reduce((a, b) => a + Number(b), 0)}</Text>}
        </View>

        <View style={s.summary}>
          <View style={s.sumBox}><Text style={s.sumVal}>{Number(i.score).toFixed(0)}%</Text><Text style={s.sumLbl}>TỶ LỆ ĐẠT</Text></View>
          <View style={s.sumBox}><Text style={s.sumVal}>{i.total_items}</Text><Text style={s.sumLbl}>MỤC ĐÁNH GIÁ</Text></View>
          <View style={s.sumBox}><Text style={{ ...s.sumVal, color: "#047857" }}>{i.pass_items}</Text><Text style={s.sumLbl}>ĐẠT / TỐT</Text></View>
          <View style={s.sumBox}><Text style={{ ...s.sumVal, color: "#b91c1c" }}>{i.fail_items}</Text><Text style={s.sumLbl}>LỖI / CẦN XỬ LÝ</Text></View>
          <View style={s.sumBox}><Text style={{ ...s.sumVal, color: "#a21caf" }}>{i.urgent_items}</Text><Text style={s.sumLbl}>KHẨN CẤP</Text></View>
        </View>

        {groupBySection(items).map(([section, rows]) => (
          <View key={section}>
            <Text style={s.section} minPresenceAhead={40}>{section}</Text>
            <View style={[s.row, s.th]}>
              <Text style={s.c1}>#</Text>
              <Text style={s.c2}>{isMaint ? "Thiết bị / Công việc" : "Tiêu chí kiểm tra"}</Text>
              <Text style={s.c3}>Kết quả</Text>
              <Text style={s.c4}>Ghi chú / Đề xuất</Text>
            </View>
            {rows.map((r, idx) => {
              const ph = photos.filter((p) => p.item_key === r.item_key && images.has(p.path));
              const bad = r.result && BAD_RESULTS.includes(r.result);
              return (
                <View key={r.id} style={s.row} wrap={false}>
                  <Text style={s.c1}>{idx + 1}</Text>
                  <View style={s.c2}>
                    <Text style={isMaint ? s.bold : undefined}>{r.item_text}</Text>
                    {isMaint && (
                      <Text style={{ fontSize: 7.5, color: "#374151", marginTop: 2 }}>
                        {[r.model && `Model: ${r.model}`, r.before_status && `Trước BT: ${RESULT_LABEL[r.before_status]}`, r.materials && `Vật tư: ${r.materials}`, r.completion && `Hoàn thành: ${COMPLETION_LABEL[r.completion]}`].filter(Boolean).join(" · ")}
                        {r.work_done ? `\nCông việc: ${r.work_done.replace(/\n/g, "; ")}` : ""}
                      </Text>
                    )}
                    {ph.length > 0 && (
                      <View style={s.photos}>
                        {ph.slice(0, 6).map((p) => (
                          <View key={p.id}>
                            {/* eslint-disable-next-line jsx-a11y/alt-text */}
                            <Image style={s.photo} src={images.get(p.path)!} />
                            <Text style={s.cap}>{p.phase === "before" ? "TRƯỚC · " : p.phase === "after" ? "SAU · " : ""}{p.caption || dt(p.taken_at)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <Text style={[s.c3, bad ? s.bad : s.ok]}>{r.result ? RESULT_LABEL[r.result] : "—"}</Text>
                  <View style={s.c4}>
                    {r.note && <Text>{r.note}</Text>}
                    {r.proposal && <Text style={{ color: "#b91c1c", marginTop: 2 }}>Đề xuất: {r.proposal}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <View wrap={false}>
          {i.overall_note && (
            <View style={{ marginTop: 10, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, padding: 6 }}>
              <Text style={s.bold}>Đánh giá tổng thể:</Text>
              <Text>{i.overall_note}</Text>
            </View>
          )}
          <View style={s.signRow}>
            <View style={s.signBox}>
              <Text style={s.bold}>NHÂN VIÊN THỰC HIỆN</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              {sig.inspector ? <Image style={s.signImg} src={sig.inspector} /> : <View style={{ height: 63 }} />}
              <Text>{i.inspector_name}</Text>
            </View>
            <View style={s.signBox}>
              <Text style={s.bold}>ĐẠI DIỆN CỬA HÀNG</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              {sig.store ? <Image style={s.signImg} src={sig.store} /> : <View style={{ height: 63 }} />}
              <Text>{i.store_rep_name ?? ""}</Text>
            </View>
            <View style={s.signBox}>
              <Text style={s.bold}>NGƯỜI DUYỆT</Text>
              <View style={{ height: 63, justifyContent: "center" }}>
                {i.approved_at && <Text style={i.status === "approved" ? s.ok : s.bad}>{i.status === "approved" ? "ĐÃ DUYỆT" : "TRẢ LẠI"} {dt(i.approved_at)}</Text>}
                {i.approval_note && <Text style={{ fontSize: 7 }}>{i.approval_note}</Text>}
              </View>
              <Text>{approver?.full_name ?? ""}</Text>
            </View>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>WCM TECHNICAL · {i.code} · {i.store_code}</Text>
          <Text render={({ pageNumber, totalPages }) => `Trang ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
