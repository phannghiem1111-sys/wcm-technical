import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { MaterialItem, MaterialReport } from "@/lib/material/data";
import { MR_PROPOSALS } from "@/lib/material/constants";
import type { PdfImage } from "@/lib/pdf/inspection-pdf";

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
  page: { fontFamily: "Roboto", fontSize: 10, padding: 36, paddingBottom: 44, color: "#111827", lineHeight: 1.35 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 2, borderBottomColor: RED, paddingBottom: 8, marginBottom: 12 },
  logo: { backgroundColor: RED, color: "white", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, fontWeight: "bold", fontSize: 12 },
  brand: { fontSize: 7, color: "#6b7280", marginTop: 2 },
  bold: { fontWeight: "bold" },
  title: { fontSize: 17, fontWeight: "bold", textAlign: "center", marginTop: 4 },
  vv: { textAlign: "center", fontStyle: "normal", marginTop: 2, marginBottom: 10 },
  p: { marginBottom: 3 },
  h: { fontWeight: "bold", marginTop: 10, marginBottom: 3 },
  box: { borderWidth: 0.5, borderColor: "#9ca3af", padding: 6, minHeight: 30 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: "#9ca3af" },
  th: { backgroundColor: "#f3f4f6", fontWeight: "bold", borderTopWidth: 0.5 },
  c1: { width: 28, padding: 4, textAlign: "center", borderRightWidth: 0.5, borderColor: "#9ca3af" },
  c2: { width: 90, padding: 4, borderRightWidth: 0.5, borderColor: "#9ca3af" },
  c3: { flex: 1, padding: 4, borderRightWidth: 0.5, borderColor: "#9ca3af" },
  c4: { width: 50, padding: 4, textAlign: "center", borderRightWidth: 0.5, borderColor: "#9ca3af" },
  c5: { width: 55, padding: 4, textAlign: "right" },
  chk: { flexDirection: "row", gap: 18, marginTop: 2 },
  signRow: { flexDirection: "row", marginTop: 22 },
  signBox: { flex: 1, alignItems: "center" },
  signImg: { height: 60, objectFit: "contain", marginVertical: 4 },
  footer: { position: "absolute", bottom: 18, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: "#9ca3af" },
});

const dt = (v: string) => {
  const d = new Date(v);
  const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", ...o });
  return `${f({ hour: "2-digit", minute: "2-digit", hour12: false })} giờ, ngày ${f({ day: "2-digit" })} tháng ${f({ month: "2-digit" })} năm ${f({ year: "numeric" })}`;
};

export function MaterialPdf({ r, items, sig }: { r: MaterialReport; items: MaterialItem[]; sig: { reporter?: PdfImage; store?: PdfImage } }) {
  const cat = r.category === "Khác" ? `Khác: ${r.category_other ?? ""}` : r.category;
  return (
    <Document title={`${r.code} - ${r.store_code}`} author="WCM TECHNICAL" subject="Biên bản vật tư">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View>
            <Text style={s.logo}>WCM TECHNICAL</Text>
            <Text style={s.brand}>WINCOMMERCE TECHNICAL MANAGEMENT</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.bold}>Số: {r.code}</Text>
            {r.ticket_code && <Text style={{ color: "#6b7280" }}>Mã ticket: {r.ticket_code}</Text>}
          </View>
        </View>

        <Text style={s.title}>BIÊN BẢN VẬT TƯ</Text>
        <Text style={s.vv}>V/v: {r.subject}</Text>

        <Text style={s.p}>Hôm nay, lúc {dt(r.report_at)}, tại cửa hàng <Text style={s.bold}>{r.store_code} – {r.store_name}</Text></Text>
        {r.store_address && <Text style={s.p}>Địa chỉ: {r.store_address}</Text>}
        <Text style={s.p}>Hạng mục: <Text style={s.bold}>{cat}</Text></Text>
        <Text style={s.h}>Thành phần gồm:</Text>
        <Text style={s.p}>1. Ông/Bà: <Text style={s.bold}>{r.reporter_name}</Text> · MSNV: {r.reporter_msnv} · Chức vụ: {r.reporter_title || "Nhân viên kỹ thuật"} · Bộ phận: Kỹ thuật</Text>
        <Text style={s.p}>2. Ông/Bà: <Text style={s.bold}>{r.store_manager_name || "………………………"}</Text> · Chức vụ: Cửa hàng trưởng · Bộ phận: Cửa hàng</Text>

        <Text style={s.h}>1. Nội dung sự việc</Text>
        <Text style={s.box}>{r.incident}</Text>
        <Text style={s.h}>2. Biện pháp xử lý / phương án thực hiện</Text>
        <Text style={s.box}>{r.solution}</Text>

        <Text style={s.h} minPresenceAhead={60}>3. Vật tư thay thế</Text>
        <View style={[s.row, s.th]}>
          <Text style={s.c1}>STT</Text><Text style={s.c2}>Mã vật tư</Text><Text style={s.c3}>Tên vật tư</Text><Text style={s.c4}>ĐVT</Text><Text style={s.c5}>Số lượng</Text>
        </View>
        {items.map((x, i) => (
          <View key={x.id} style={s.row} wrap={false}>
            <Text style={s.c1}>{i + 1}</Text><Text style={s.c2}>{x.material_code ?? ""}</Text><Text style={s.c3}>{x.material_name}</Text>
            <Text style={s.c4}>{x.unit ?? ""}</Text><Text style={s.c5}>{Number(x.qty).toLocaleString("vi-VN")}</Text>
          </View>
        ))}

        <View wrap={false}>
          <Text style={s.h}>4. Đề xuất xử lý vật tư</Text>
          <View style={s.chk}>
            {MR_PROPOSALS.map((p) => <Text key={p}>{p === r.proposal ? "[X]" : "[  ]"} {p}</Text>)}
          </View>
          <Text style={{ marginTop: 10 }}>Biên bản được lập thành 02 bản, mỗi bên giữ 01 bản có giá trị như nhau.</Text>

          <View style={s.signRow}>
            <View style={s.signBox}>
              <Text style={s.bold}>NGƯỜI LẬP</Text>
              <Text style={{ fontSize: 8, color: "#6b7280" }}>(Ký, ghi rõ họ tên)</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              {sig.reporter ? <Image style={s.signImg} src={sig.reporter} /> : <View style={{ height: 68 }} />}
              <Text style={s.bold}>{r.reporter_name}</Text>
            </View>
            <View style={s.signBox}>
              <Text style={s.bold}>CỬA HÀNG TRƯỞNG</Text>
              <Text style={{ fontSize: 8, color: "#6b7280" }}>(Ký, ghi rõ họ tên, đóng dấu)</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              {sig.store ? <Image style={s.signImg} src={sig.store} /> : <View style={{ height: 68 }} />}
              <Text style={s.bold}>{r.store_manager_name ?? ""}</Text>
            </View>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>WCM TECHNICAL · {r.code} · {r.store_code}</Text>
          <Text render={({ pageNumber, totalPages }) => `Trang ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
