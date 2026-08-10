import type { Brief } from "@/lib/types";
import {
  make15m,
  makeCandles,
  makeContract,
  makeCumulative,
  makeFlows,
  makeSpark,
} from "./generate";

/**
 * ตัวอย่าง Brief 1 วัน — ข้อความทั้งหมดมาจาก Result Example ที่ IC ทำไว้
 * ตัวเลขซีรีส์เป็น demo data (ปักหมุดค่าล่าสุดให้ตรงของจริง) จนกว่าจะต่อ TQ Pro / SET
 */
export const brief20260805: Brief = {
  date: "2026-08-05",
  dateLabelTH: "05 ส.ค. 2569",
  headline: "อ่าน 6 ชุดข้อมูล แล้วตลาดกำลังบอกอะไร",
  bigPicture: [
    {
      rank: 1,
      title: "S50 / หุ้นใหญ่",
      body: "ยังมีสิทธิ์เด้ง แต่เน้น Selective Long / Long on Dip",
      tone: "neutral",
    },
    { rank: 2, title: "Gold", body: "ภาพโลกเริ่มหนุน จับตา Long on Dip", tone: "bull" },
    { rank: 3, title: "USD Futures", body: "ยังอ่อน ต้องรอฐาน ไม่ไล่ Long", tone: "bear" },
  ],
  dataSays: [
    "ราคา S50 ย่อ แต่ยังอยู่ใกล้โซนเด้ง",
    "OI เพิ่ม = แรงกดดันยังไม่หมด",
    "ต่างชาติยังไม่ confirm ฝั่ง Long",
    "Breadth อยู่โซนรับของหุ้นส่วนใหญ่",
    "DXY / US10Y อ่อนลง หนุนทอง",
  ],
  todayActions: [
    { label: "เด่น", value: "S50 Futures / หุ้น SET50", tone: "bull" },
    { label: "รอง", value: "Gold", tone: "bull" },
    { label: "รอฐาน", value: "USD Futures", tone: "bear" },
    { label: "โฟกัส", value: "เข้าเป็นจังหวะ ไม่ไล่ราคา", tone: "neutral" },
  ],
  insight:
    "วันนี้ Data บอกว่าเล่นหุ้นแบบเลือกจังหวะได้ ขณะเดียวกันทองเริ่มน่าสนใจจากแรงหนุนฝั่งโลก",

  sections: [
    /* ─────────────── 1 ─────────────── */
    {
      id: "s50-oi",
      index: 1,
      title: "S50 Futures + Open Interest",
      subtitle: "ดูว่าราคาย่อด้วยแรงขายธรรมดา หรือมีแรงกดดันใหม่เพิ่ม",
      source: "TQ Pro (Price Close) · SET (Open Interest)",
      accent: "cyan",
      mode: "data",
      contracts: [
        makeContract("S50U26", 11, {
          days: 90,
          priceFrom: 930,
          priceTo: 1076.3,
          oiFrom: 180_000,
          oiTo: 582_497,
          oiJumpAt: 0.62,
          oiJumpTo: 690_000,
        }),
        makeContract("S50Z26", 27, {
          days: 90,
          priceFrom: 942,
          priceTo: 1077.8,
          oiFrom: 11_000,
          oiTo: 30_006,
        }),
      ],
      narrative: {
        summary: [
          "ราคา S50U26 / S50Z26 ย่อลงจากยอดเดิม",
          "แต่ Open Interest เพิ่มขึ้น",
          "แปลว่าแรงกดดันยังไม่หมด และมีสถานะใหม่เข้ามา",
        ],
        interpretation:
          "ภาพนี้ไม่ใช่การขึ้นที่แข็งแรงเต็มตัว เพราะราคาอ่อนลงในขณะที่ OI เพิ่ม ทำให้ต้องระวังแรงเปิด Short หรือแรงกดดันใหม่ในระบบ",
        actions: [
          { label: "สินค้าที่เด่น", value: "S50U26 / S50Z26", tone: "neutral" },
          { label: "มุมมอง", value: "Selective Long / Long on Dip เท่านั้น", tone: "neutral" },
          { label: "โซนเฝ้าดู", value: "1,075", tone: "neutral" },
          { label: "ยืนได้", value: "ลุ้นรีบาวด์", tone: "bull" },
          { label: "หลุดพร้อม OI เพิ่ม", value: "ระวัง Short pressure", tone: "bear" },
        ],
        insight: "S50 ยังไม่พัง แต่ OI ที่เพิ่มทำให้ยังไม่ใช่จังหวะไล่ราคา",
      },
    },

    /* ─────────────── 2 ─────────────── */
    {
      id: "flows",
      index: 2,
      title: "สะสม Long / Short ของต่างชาติและกองทุน",
      subtitle: "ดูว่าเงินใหญ่กำลังหนุนตลาด หรือยังถ่วงอยู่",
      source: "SET Data · หน่วย ล้านบาท (สะสม)",
      accent: "green",
      mode: "data",
      flows: makeFlows(7, 30),
      narrative: {
        summary: [
          "ต่างชาติยังอยู่ฝั่ง Short สะสม",
          "กองทุนในประเทศยังช่วยพยุงฝั่ง Long",
          "ภาพรวมจึงยังไม่ใช่ Long พร้อมกันทุกกลุ่ม",
        ],
        interpretation:
          "ตลาดยังพอรีบาวด์ได้เพราะกองทุนช่วยประคอง แต่ต่างชาติยังไม่กลับมาหนุนเต็มตัว ทำให้ขาขึ้นรอบนี้ยังมีแรงต้าน และเสี่ยงเจอแรงขายสลับ",
        actions: [
          { label: "สินค้าที่เด่น", value: "S50 Futures", tone: "neutral" },
          { label: "มุมมอง", value: "เล่นรีบาวด์ได้ แต่ต้องระวัง", tone: "neutral" },
          { label: "สัญญาณเฝ้าดู", value: "ต่างชาติต้องหยุดเพิ่ม Short", tone: "neutral" },
          { label: "ถ้ากองทุนยังซื้อ", value: "ตลาดยังมีแรงพยุง", tone: "bull" },
          { label: "ถ้าต่างชาติลังคดต่อ", value: "เน้นลดการไล่ Long", tone: "bear" },
        ],
        insight: "เงินกองทุนช่วยประคอง แต่ต่างชาติยังไม่ confirm ขาขึ้นเต็มตัว",
      },
    },

    /* ─────────────── 3 ─────────────── */
    {
      id: "usd-futures",
      index: 3,
      title: "USD Futures Flow",
      subtitle: "อ่านจังหวะเงินบาทแข็ง / อ่อน จากตำแหน่งของตลาด",
      source: "VM · แคปภาพจากระบบ",
      accent: "sky",
      mode: "data",
      groups: [
        {
          id: "usd-daily",
          title: "USDU26 — ภาพใหญ่ (Daily)",
          subtitle: "ตำแหน่งสุทธิของตลาดยังอยู่ฝั่งกดดันดอลลาร์",
          accentHex: "#38bdf8",
          panes: [
            {
              id: "usd-price-d",
              title: "USDU26 (Daily)",
              kind: "candle",
              height: 210,
              digits: 2,
              series: [{ key: "c", name: "USDU26", color: "#34f5a0" }],
              rows: makeCandles(101, 58, 32.2, 33.55, 32.93),
              refLines: [{ y: 32.93, color: "#34f5a0", label: "32.93" }],
            },
            {
              id: "usd-superflow",
              title: "Super Flow (สะสม)",
              note: "แรงซื้อ/ขายสุทธิสะสมของภาพใหญ่",
              kind: "line",
              height: 150,
              digits: 0,
              zeroLine: true,
              series: [{ key: "flow", name: "Super Flow", color: "#e2e8f0", fill: true }],
              rows: makeCumulative(103, 58, "flow", 620_000, -225_314),
              refLines: [
                { y: 159_204, color: "#34f5a0", label: "+159,204" },
                { y: -179_037, color: "#fb7185", label: "-179,037" },
              ],
            },
            {
              id: "usd-oi",
              title: "OI (สัญญาคงค้าง)",
              kind: "line",
              height: 150,
              digits: 0,
              series: [{ key: "oi", name: "Open Interest", color: "#ffc53d" }],
              rows: makeCumulative(107, 58, "oi", 980_000, 1_306_431),
            },
          ],
          footer: [
            { label: "USDU26 ล่าสุด", value: "32.93", tone: "neutral" },
            { label: "แนวโน้มภาพใหญ่", value: "อ่อน", tone: "bear" },
            { label: "Super Flow (สะสม)", value: "ติดลบ", tone: "bear" },
          ],
        },
        {
          id: "usd-15m",
          title: "USDU26 — ระยะสั้น (15 นาที)",
          subtitle: "Flow ระยะสั้นเริ่มทรงตัวใกล้โซนฐาน แต่ยังอ่อน",
          accentHex: "#a78bfa",
          panes: [
            {
              id: "usd-price-15",
              title: "USDU26 (15m)",
              kind: "line",
              height: 180,
              digits: 2,
              series: [{ key: "px", name: "USDU26", color: "#ffc53d" }],
              rows: make15m(111, 120, [{ key: "px", from: 33.5, to: 32.96, jitter: 0.06 }]),
              refLines: [
                { y: 32.96, color: "#34f5a0", label: "32.96" },
                { y: 32.93, color: "#22d3ee", label: "32.93" },
              ],
            },
            {
              id: "usd-pbc",
              title: "PBC (สะสม)",
              kind: "line",
              height: 150,
              digits: 0,
              zeroLine: true,
              series: [{ key: "pbc", name: "PBC", color: "#22d3ee", fill: true }],
              rows: make15m(113, 120, [{ key: "pbc", from: 12_000, to: -230_188 }]),
              refLines: [
                { y: -230_188, color: "#34f5a0", label: "-230,188" },
                { y: -329_075, color: "#fb7185", label: "-329,075" },
              ],
            },
            {
              id: "usd-pbc-reset",
              title: "PBC Daily Reset (15m)",
              kind: "line",
              height: 140,
              digits: 0,
              zeroLine: true,
              series: [{ key: "reset", name: "PBC Daily Reset", color: "#e879f9" }],
              rows: make15m(117, 120, [{ key: "reset", from: -1_200, to: -4_075, jitter: 9_000 }]),
            },
          ],
          footer: [
            { label: "USDU26 ล่าสุด", value: "32.96", tone: "neutral" },
            { label: "แนวโน้มระยะสั้น", value: "ทรงตัวใกล้ฐาน", tone: "neutral" },
            { label: "PBC Daily Reset", value: "-4,075", tone: "bear" },
          ],
        },
      ],
      narrative: {
        summary: [
          "ภาพใหญ่ USD ยังอ่อน",
          "กราฟสะสมยังอยู่ฝั่งกดดันดอลลาร์",
          "ระยะสั้นเริ่มเห็นการชะลอลงใกล้โซนฐาน",
        ],
        interpretation:
          "จังหวะนี้ยังไม่ใช่ภาพรีบาวด์แรงของ USD เพราะทั้งภาพใหญ่และ flow ระยะสั้นยังค่อนข้างอ่อน แต่เริ่มเห็นอาการทรงตัว ทำให้ควรจับตาการสร้างฐานมากกว่าการรีบไล่ฝั่ง Long",
        actions: [
          { label: "สินค้าที่เด่น", value: "USDU26", tone: "neutral" },
          { label: "มุมมอง", value: "รอฐาน / ยังไม่รีบ Long", tone: "neutral" },
          { label: "โซนเฝ้าดู", value: "32.93 – 32.96", tone: "neutral" },
          { label: "ยืนเหนือ 32.96", value: "ค่อยลุ้นรีบาวด์", tone: "bull" },
          { label: "หลุด 32.93", value: "ยังอ่อนต่อ", tone: "bear" },
        ],
        insight: "USD ยังอ่อน แต่เริ่มเข้าโซนที่ต้องจับตาการสร้างฐาน",
      },
    },

    /* ─────────────── 4 ─────────────── */
    {
      id: "confirm",
      index: 4,
      title: "Confirm Up / Down S50",
      subtitle: "ดูว่าราคายังยืนได้ แต่ flow ภายใน confirm หรือยัง",
      source: "Website · แคปภาพจากระบบ",
      accent: "amber",
      mode: "image",
      board: {
        src: "/uploads/2026-08-05/confirm.jpg",
        alt: "Confirm Up/Down S50 — Last, Confirm, Trend, Mid Trend",
        stats: [
          { label: "Last", value: "1,077.52", delta: "+0.35%", tone: "bull", spark: makeSpark(9, 24, 1010, 1077) },
          { label: "Confirm Up/Down", value: "-100M", delta: "ดีขึ้นต่อเนื่อง", tone: "neutral", spark: makeSpark(13, 24, -230, -100) },
          { label: "Trend", value: "-28K", delta: "อ่อนลงชัด", tone: "bear", spark: makeSpark(17, 24, 20, -28) },
          { label: "Mid Trend", value: "-89", delta: "เริ่มฟื้นตัว", tone: "neutral", spark: makeSpark(21, 24, -104, -89) },
        ],
        callouts: [
          { x: 22, y: 24, text: "ราคายังยืนเหนือโซนสำคัญได้", tone: "bull" },
          { x: 76, y: 70, text: "Trend ระยะสั้นอ่อนลง กดดันต่อเนื่อง", tone: "bear" },
        ],
      },
      narrative: {
        summary: [
          "ราคา S50 ยังยืนเหนือโซนสำคัญได้",
          "ข้อมูลภาพใหญ่ยังไม่พัง",
          "แต่ flow ระยะสั้นเริ่มอ่อนลง",
        ],
        interpretation:
          "ขาขึ้นระยะใหญ่ยังไม่เสีย แต่การที่ Trend ระยะสั้นอ่อนลง ทำให้ตลาดยังต้องการแรง confirm เพิ่มจาก money flow ก่อนจะกลับมาแข็งแรงจริง",
        actions: [
          { label: "สินค้าที่เด่น", value: "S50U26", tone: "neutral" },
          { label: "มุมมอง", value: "ถือฝั่ง Long ได้แบบเลือกจังหวะ", tone: "bull" },
          { label: "จุดเฝ้าดู", value: "1,075 / 1,070", tone: "neutral" },
          { label: "ยืนได้", value: "บวกต่อ", tone: "bull" },
          { label: "ถ้า flow แย่ลงพร้อมหลุดฐาน", value: "ลดสถานะ", tone: "bear" },
        ],
        insight: "S50 ยังไม่เสีย แต่ต้องการแรง confirm เพิ่มจาก money flow",
      },
    },

    /* ─────────────── 5 ─────────────── */
    {
      id: "breadth",
      index: 5,
      title: "Market Breadth SET50",
      subtitle: "ดูว่าหุ้นส่วนใหญ่ลงมาถึงแนวรับแล้วหรือยัง",
      source: "VM · Indy 2090 (v1.05) · TF 15 นาที",
      accent: "violet",
      mode: "image",
      board: {
        src: "/uploads/2026-08-05/breadth.jpg",
        alt: "Market Breadth SET50 — % เหนือ MA200, % เหนือ RSI50, % New High",
        stats: [
          { label: "% เหนือ MA200", value: "17.00", delta: "ใกล้โซนแนวรับ", tone: "bull", spark: makeSpark(31, 24, 62, 17) },
          { label: "% อยู่เหนือ RSI50", value: "31.00", delta: "ในเขตแนวรับ", tone: "bull", spark: makeSpark(35, 24, 70, 31) },
          { label: "% เหนือ MA200 (2)", value: "18.00", delta: "ใกล้โซนแนวรับ", tone: "bull", spark: makeSpark(39, 24, 58, 18) },
          { label: "% New High (365D)", value: "17.00", delta: "ใกล้โซนแนวรับ", tone: "bull", spark: makeSpark(43, 24, 66, 17) },
        ],
        callouts: [
          { x: 78, y: 16, text: "ดัชนี SET50 ลงมาใกล้แนวรับสำคัญแล้ว", tone: "bull" },
        ],
      },
      narrative: {
        summary: [
          "หุ้นส่วนใหญ่ลงมาใกล้โซนแนวรับ",
          "Breadth หลายเส้นอยู่ในเขตสีเขียว",
          "เชิงสถิติมีโอกาสเห็นการเด้งได้",
        ],
        interpretation:
          "ภาพนี้ไม่ได้แปลว่าตลาดแข็งแรงมาก แต่แปลว่าหุ้นจำนวนมากลงมาลึกจนเริ่มเข้าเขตที่มีโอกาสเด้ง ดังนั้นการเล่นจังหวะ Selective Long จะได้เปรียบกว่าการไล่ราคาทั้งกระดาน",
        actions: [
          { label: "สินค้าที่เด่น", value: "หุ้น SET50 / S50 Futures", tone: "neutral" },
          { label: "มุมมอง", value: "Selective Long", tone: "bull" },
          { label: "โฟกัส", value: "หุ้นใหญ่ที่ลงถึงแนวรับ", tone: "neutral" },
          { label: "ถ้า breadth เด้งกลับ", value: "เล่นฝั่งบวกได้", tone: "bull" },
          { label: "ถ้า breadth ยังทรุด", value: "ระวังพักฐานต่อ", tone: "bear" },
        ],
        insight: "หุ้นส่วนใหญ่เริ่มอยู่ในโซนเด้ง แต่ต้องเลือกจังหวะให้ดี",
      },
    },

    /* ─────────────── 6 ─────────────── */
    {
      id: "macro",
      index: 6,
      title: "Global Macro Signals",
      subtitle: "Gold, VIX, DXY และ Bond Yield กำลังส่งอะไร",
      source: "ข้อมูลราคาจริงจาก provider · อัปเดตอัตโนมัติทุกชั่วโมง",
      accent: "rose",
      // ข้อมูลของ section นี้โหลดสดตอน render (ดู src/lib/market.ts)
      mode: "data",
      narrative: {
        summary: [
          "DXY และ US10Y อ่อนลง",
          "VIX ยังต่ำ = ตลาดโลกไม่ panic",
          "Gold เริ่มได้แรงหนุนชัดขึ้น",
        ],
        interpretation:
          "เมื่อดอลลาร์และ bond yield อ่อนลง ขณะที่ VIX ยังต่ำ ภาพรวมโลกจะเปิดทางให้ทองฟื้นตัวได้ดีขึ้น ทำให้ Gold กลายเป็นสินค้าที่น่าจับตาเพิ่มขึ้นในวันนี้",
        actions: [
          { label: "สินค้าที่เด่น", value: "Gold Futures / Gold", tone: "bull" },
          { label: "มุมมอง", value: "Long on Dip", tone: "bull" },
          { label: "สัญญาณบวก", value: "DXY ต่ำกว่า 100 และ US10Y อ่อนลง", tone: "bull" },
          { label: "ถ้ายืนได้", value: "ทองยังมีแรง", tone: "bull" },
          { label: "ถ้า DXY กับ Yield เด้งแรง", value: "ระวังทองย่อ", tone: "bear" },
        ],
        insight: "วันนี้ทองดูดีขึ้น เพราะแรงกดจาก DXY และ Bond Yield เริ่มเบาลง",
      },
    },
  ],
};
