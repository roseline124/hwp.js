import { HwpxSection } from '@hwp.js/hwpx-parser'
import { createEl } from './utils'
import ParagraphRenderer from './ParagraphRenderer'

export default class PageRenderer {
  private section: HwpxSection
  private widthPx: number
  private heightPx: number
  private pageIndex: number
  private totalPages: number
  private paragraphRenderer = new ParagraphRenderer()

  constructor(section: HwpxSection, widthPx: number, heightPx: number, pageIndex: number, totalPages: number) {
    this.section = section
    this.widthPx = widthPx
    this.heightPx = heightPx
    this.pageIndex = pageIndex
    this.totalPages = totalPages
  }

  private createPageRoot(): HTMLElement {
    const page = createEl('div')
    page.style.width = `${this.widthPx}px`
    page.style.minHeight = `${this.heightPx}px`
    page.style.margin = '16px auto'
    page.style.background = '#fff'
    page.style.boxShadow = '0 1px 3px rgba(0,0,0,.2)'
    page.style.padding = '32px'
    page.style.boxSizing = 'border-box'
    page.style.display = 'flex'
    page.style.flexDirection = 'column'
    return page
  }

  private renderContent(): HTMLElement {
    const content = createEl('div')
    content.style.flex = '1 1 auto'
    this.section.paragraphs.forEach((p) => {
      content.appendChild(this.paragraphRenderer.render(p))
    })
    return content
  }

  private renderFooter(): HTMLElement | null {
    if (!this.section.footer || this.section.footer.length === 0) return null
    const wrapper = createEl('div')
    wrapper.style.marginTop = 'auto'
    this.section.footer.forEach((p) => {
      const cloned = {
        ...p,
        runs: p.runs.map((r) => {
          if (r.autoNumType === 'PAGE') {
            return { ...r, text: String(this.pageIndex + 1) }
          }
          if (r.autoNumType === 'TOTAL_PAGE') {
            return { ...r, text: String(this.totalPages) }
          }
          return r
        }),
      }
      wrapper.appendChild(this.paragraphRenderer.render(cloned, 8))
    })
    return wrapper
  }

  render(): HTMLElement {
    const page = this.createPageRoot()
    page.appendChild(this.renderContent())
    const footer = this.renderFooter()
    if (footer) page.appendChild(footer)
    return page
  }
}


