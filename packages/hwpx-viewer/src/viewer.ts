import { parse, HwpxDocument } from "@hwp.js/hwpx-parser";

class HwpxViewer {
  private doc: HwpxDocument;
  private container: HTMLElement;
  private root: HTMLElement = document.createElement("div");

  constructor(container: HTMLElement, data: Uint8Array) {
    this.container = container;
    this.doc = parse(data);
    this.render();
  }

  private createPage(widthPx: number, heightPx: number): HTMLElement {
    const page = document.createElement("div");
    page.style.width = `${widthPx}px`;
    page.style.minHeight = `${heightPx}px`;
    page.style.margin = "16px auto";
    page.style.background = "#fff";
    page.style.boxShadow = "0 1px 3px rgba(0,0,0,.2)";
    page.style.padding = "32px";
    page.style.boxSizing = "border-box";
    return page;
  }

  private render() {
    this.root.innerHTML = "";
    this.root.style.width = "100%";
    this.root.style.padding = "24px 0";
    this.root.style.background = "#E8EAED";
    this.container.appendChild(this.root);

    // Convert from 1/100 mm to CSS px (96dpi): px = (mm/100) * 96 / 25.4 ≈ v / 26.458
    const px = (v: number) => Math.round(v / 26.458);
    const pageW = px(this.doc.header.pageWidth);
    const pageH = px(this.doc.header.pageHeight);

    this.doc.sections.forEach((section) => {
      const page = this.createPage(pageW, pageH);
      section.paragraphs.forEach((p) => {
        const para = document.createElement("p");
        para.style.margin = "0 0 12px";
        if (p.style?.textAlign) {
          para.style.textAlign = p.style.textAlign;
        }
        p.runs.forEach((r) => {
          const span = document.createElement("span");
          span.textContent = r.text;
          if (r.style?.color) {
            span.style.color = r.style.color;
          }
          if (r.style?.fontSizePx) {
            span.style.fontSize = `${r.style.fontSizePx}px`;
            span.style.lineHeight = "1.3";
          }
          para.appendChild(span);
        });
        page.appendChild(para);
      });
      this.root.appendChild(page);
    });
  }
}

export default HwpxViewer;
