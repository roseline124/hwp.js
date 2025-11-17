import {
  HwpxCharStyle,
  HwpxParagraph,
  HwpxRun,
  HwpxSection,
  HwpxParagraphStyle,
} from "./models";

export function fontSizePxFromHeight(
  height: number | undefined
): number | undefined {
  if (!height || Number.isNaN(height)) return undefined;
  // height ≈ 1/100 pt → px = pt * 1.333...
  const pt = height / 100;
  return Math.round(pt * 1.333 * 10) / 10;
}

export function parseHeaderXml(xml: string): {
  charStyles: Record<number, HwpxCharStyle>;
  paraStyles: Record<number, HwpxParagraphStyle>;
  styleIndex: Record<number, { paraPrIDRef?: number; charPrIDRef?: number }>;
} {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const styles: Record<number, HwpxCharStyle> = {};
  const paraStyles: Record<number, HwpxParagraphStyle> = {};
  const styleIndex: Record<
    number,
    { paraPrIDRef?: number; charPrIDRef?: number }
  > = {};

  const prNodes = doc.querySelectorAll("hh\\:charPr, charPr");
  prNodes.forEach((node) => {
    const idAttr = (node as Element).getAttribute("id");
    if (!idAttr) return;
    const id = Number(idAttr);
    if (Number.isNaN(id)) return;
    const height = Number((node as Element).getAttribute("height") || "");
    const textColor = (node as Element).getAttribute("textColor") || undefined;

    styles[id] = {
      color: textColor && textColor !== "none" ? textColor : undefined,
      fontSizePx: fontSizePxFromHeight(height),
    };
  });

  // paraProperties
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

  // styles (styleIDRef)
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

  return { charStyles: styles, paraStyles, styleIndex };
}

export function getTextContent(node: Element, ns: string): string[] {
  const list: string[] = [];
  const tNodes = node.querySelectorAll(`${ns}t, t`);
  tNodes.forEach((t) => list.push(t.textContent || ""));
  return list;
}

export function parseSectionXml(
  xml: string,
  charStyles: Record<number, HwpxCharStyle>,
  paraStyles: Record<number, HwpxParagraphStyle>,
  styleIndex: Record<number, { paraPrIDRef?: number; charPrIDRef?: number }>
): HwpxSection {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const ns = "hp\\:";
  const paragraphs: HwpxParagraph[] = [];

  const pNodes = doc.querySelectorAll(`${ns}p, p`);
  pNodes.forEach((p) => {
    const runs: HwpxRun[] = [];
    const styleIDRefAttr =
      (p as Element).getAttribute("styleIDRef") || undefined;
    const paraPrIDRefAttr =
      (p as Element).getAttribute("paraPrIDRef") || undefined;
    const styleIDRef = styleIDRefAttr ? Number(styleIDRefAttr) : undefined;
    const paraPrIDRef = paraPrIDRefAttr ? Number(paraPrIDRefAttr) : undefined;
    const styleDefaults =
      styleIDRef !== undefined ? styleIndex[styleIDRef] : undefined;
    const appliedParaId = paraPrIDRef ?? styleDefaults?.paraPrIDRef;
    const paragraphStyle: HwpxParagraphStyle | undefined =
      appliedParaId !== undefined ? paraStyles[appliedParaId] : undefined;
    const defaultCharPrId = styleDefaults?.charPrIDRef;
    // run 단위로 charPrIDRef를 추적
    const runNodes = (p as Element).querySelectorAll(`${ns}run, run`);
    if (runNodes.length > 0) {
      runNodes.forEach((runNode) => {
        const idRefAttr =
          (runNode as Element).getAttribute("charPrIDRef") || undefined;
        const idRef = idRefAttr ? Number(idRefAttr) : defaultCharPrId;
        const text = getTextContent(runNode as Element, `${ns}`).join("");
        if (text) {
          const style =
            idRef !== undefined && !Number.isNaN(idRef)
              ? charStyles[idRef]
              : undefined;
          runs.push({ text, charPrIDRef: idRef, style });
        }
      });
    } else {
      // fallback: run이 없으면 p 전체를 하나의 run으로 본다
      const texts = getTextContent(p as Element, `${ns}`);
      texts.forEach((text) => {
        const style =
          defaultCharPrId !== undefined
            ? charStyles[defaultCharPrId]
            : undefined;
        runs.push({ text, charPrIDRef: defaultCharPrId, style });
      });
    }
    paragraphs.push({ runs, style: paragraphStyle });
  });

  return { paragraphs };
}
