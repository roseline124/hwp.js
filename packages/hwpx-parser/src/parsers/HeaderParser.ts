import { HwpxCharStyle, HwpxParagraphStyle } from "../models";

export default class HeaderParser {
  private fontSizePxFromHeight(height: number | undefined): number | undefined {
    if (!height || Number.isNaN(height)) return undefined;
    const pt = height / 100; // 1/100 pt
    return Math.round(pt * 1.333 * 10) / 10;
  }

  private parseCharStyles(doc: Document): Record<number, HwpxCharStyle> {
    const charStyles: Record<number, HwpxCharStyle> = {};
    const prNodes = doc.querySelectorAll("hh\\:charPr, charPr");
    prNodes.forEach((node) => {
      const idAttr = (node as Element).getAttribute("id");
      if (!idAttr) return;
      const id = Number(idAttr);
      if (Number.isNaN(id)) return;

      const height = Number((node as Element).getAttribute("height") || "");
      const textColor =
        (node as Element).getAttribute("textColor") || undefined;
      const boldAttr = (node as Element).getAttribute("bold");
      const weightAttr = (node as Element).getAttribute("weight");
      const childBold = (node as Element).querySelector(
        "hh\\:bold, bold"
      ) as Element | null;
      const childBoldVal = childBold?.getAttribute("value");
      const isBold =
        (boldAttr && /^(1|true)$/i.test(boldAttr)) ||
        (weightAttr && /^bold$/i.test(weightAttr)) ||
        (childBoldVal &&
          (/^(1|true)$/i.test(childBoldVal) || /^bold$/i.test(childBoldVal)));

      charStyles[id] = {
        color: textColor && textColor !== "none" ? textColor : undefined,
        fontSizePx: this.fontSizePxFromHeight(height),
        fontWeight: isBold ? "bold" : undefined,
      };
    });
    return charStyles;
  }

  private parseParaStyles(doc: Document): Record<number, HwpxParagraphStyle> {
    const paraStyles: Record<number, HwpxParagraphStyle> = {};
    const paraPrNodes = doc.querySelectorAll("hh\\:paraPr, paraPr");
    paraPrNodes.forEach((node) => {
      const idAttr = (node as Element).getAttribute("id");
      if (!idAttr) return;
      const id = Number(idAttr);
      if (Number.isNaN(id)) return;
      const alignEl = (node as Element).querySelector(
        "hh\\:align, align"
      ) as Element | null;
      const horizontal = alignEl?.getAttribute("horizontal") || undefined;
      let textAlign: HwpxParagraphStyle["textAlign"];
      switch ((horizontal || "").toUpperCase()) {
        case "LEFT":
          textAlign = "left";
          break;
        case "RIGHT":
          textAlign = "right";
          break;
        case "CENTER":
          textAlign = "center";
          break;
        case "JUSTIFY":
          textAlign = "justify";
          break;
        default:
          textAlign = undefined;
      }
      paraStyles[id] = { textAlign };
    });
    return paraStyles;
  }

  private parseStyleIndex(
    doc: Document
  ): Record<number, { paraPrIDRef?: number; charPrIDRef?: number }> {
    const styleIndex: Record<
      number,
      { paraPrIDRef?: number; charPrIDRef?: number }
    > = {};
    const styleNodes = doc.querySelectorAll("hh\\:style, style");
    styleNodes.forEach((node) => {
      const idAttr = (node as Element).getAttribute("id");
      if (!idAttr) return;
      const id = Number(idAttr);
      if (Number.isNaN(id)) return;
      const paraPrIDRef = (node as Element).getAttribute("paraPrIDRef");
      const charPrIDRef = (node as Element).getAttribute("charPrIDRef");
      styleIndex[id] = {
        paraPrIDRef: paraPrIDRef ? Number(paraPrIDRef) : undefined,
        charPrIDRef: charPrIDRef ? Number(charPrIDRef) : undefined,
      };
    });
    return styleIndex;
  }

  parse(xml: string): {
    charStyles: Record<number, HwpxCharStyle>;
    paraStyles: Record<number, HwpxParagraphStyle>;
    styleIndex: Record<number, { paraPrIDRef?: number; charPrIDRef?: number }>;
  } {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const charStyles = this.parseCharStyles(doc);
    const paraStyles = this.parseParaStyles(doc);
    const styleIndex = this.parseStyleIndex(doc);
    return { charStyles, paraStyles, styleIndex };
  }
}
