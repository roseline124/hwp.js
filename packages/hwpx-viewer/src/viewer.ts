import { parse, HwpxDocument } from "@hwp.js/hwpx-parser";
import PageRenderer from "./render/PageRenderer";
import { pxFrom100thMm } from "./render/utils";

class HwpxViewer {
  private doc: HwpxDocument;
  private container: HTMLElement;
  private root: HTMLElement = document.createElement("div");

  constructor(container: HTMLElement, data: Uint8Array) {
    this.container = container;
    this.doc = parse(data);
    this.render();
  }

  private render() {
    this.root.innerHTML = "";
    this.root.style.width = "100%";
    this.root.style.padding = "24px 0";
    this.root.style.background = "#E8EAED";
    this.container.appendChild(this.root);

    const pageW = pxFrom100thMm(this.doc.header.pageWidth);
    const pageH = pxFrom100thMm(this.doc.header.pageHeight);

    const totalPages = this.doc.sections.length;
    this.doc.sections.forEach((section, pageIndex) => {
      const page = new PageRenderer(
        section,
        pageW,
        pageH,
        pageIndex,
        totalPages
      ).render();
      this.root.appendChild(page);
    });
  }
}

export default HwpxViewer;
