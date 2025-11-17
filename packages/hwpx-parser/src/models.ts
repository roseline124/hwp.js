export interface HwpxHeader {
  pageWidth: number;
  pageHeight: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;

  /** charPr 스타일 맵: id -> 스타일 */
  charStyles?: Record<number, HwpxCharStyle>;
}

export interface HwpxCharStyle {
  color?: string;
  fontSizePx?: number;
}

export interface HwpxRun {
  text: string;
  charPrIDRef?: number;
  style?: HwpxCharStyle;
}

export interface HwpxParagraphStyle {
  textAlign?: "left" | "right" | "center" | "justify";
}

export interface HwpxParagraph {
  runs: HwpxRun[];
  style?: HwpxParagraphStyle;
}

export interface HwpxSection {
  paragraphs: HwpxParagraph[];
}

export interface HwpxDocument {
  header: HwpxHeader;
  sections: HwpxSection[];
}
