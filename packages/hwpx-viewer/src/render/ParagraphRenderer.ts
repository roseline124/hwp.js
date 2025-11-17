import { HwpxParagraph } from '@hwp.js/hwpx-parser'
import RunRenderer from './RunRenderer'

export default class ParagraphRenderer {
  private runRenderer = new RunRenderer()

  render(paragraph: HwpxParagraph, marginBottom = 12): HTMLElement {
    const p = document.createElement('p')
    p.style.margin = `0 0 ${marginBottom}px`
    if (paragraph.style?.textAlign) {
      p.style.textAlign = paragraph.style.textAlign
    }
    paragraph.runs.forEach((run) => p.appendChild(this.runRenderer.render(run)))
    return p
  }
}


