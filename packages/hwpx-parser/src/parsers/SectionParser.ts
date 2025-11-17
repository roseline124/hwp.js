import { HwpxCharStyle, HwpxParagraph, HwpxParagraphStyle, HwpxRun, HwpxSection } from '../models'

export default class SectionParser {
  private charStyles: Record<number, HwpxCharStyle>
  private paraStyles: Record<number, HwpxParagraphStyle>
  private styleIndex: Record<number, { paraPrIDRef?: number; charPrIDRef?: number }>
  private files?: Record<string, Uint8Array>
  private ns = 'hp\\:'

  constructor(
    charStyles: Record<number, HwpxCharStyle>,
    paraStyles: Record<number, HwpxParagraphStyle>,
    styleIndex: Record<number, { paraPrIDRef?: number; charPrIDRef?: number }>,
    files?: Record<string, Uint8Array>,
  ) {
    this.charStyles = charStyles
    this.paraStyles = paraStyles
    this.styleIndex = styleIndex
    this.files = files
  }

  private getTextContent(node: Element): string[] {
    const list: string[] = []
    const tNodes = node.querySelectorAll(`${this.ns}t, t`)
    tNodes.forEach((t) => list.push(t.textContent || ''))
    return list
  }

  private pxFrom100thMm(v: number): number {
    return Math.round(v / 26.458)
  }

  private guessMimeFromName(name: string): string | undefined {
    const lower = name.toLowerCase()
    if (lower.endsWith('.png')) return 'image/png'
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
    if (lower.endsWith('.gif')) return 'image/gif'
    if (lower.endsWith('.webp')) return 'image/webp'
    if (lower.endsWith('.bmp')) return 'image/bmp'
    return undefined
  }

  private basenameNoExt(path: string): string {
    const base = path.split('/').pop() || path
    const i = base.lastIndexOf('.')
    return i >= 0 ? base.slice(0, i) : base
  }

  private resolveBinary(id: string): { data?: Uint8Array; name?: string; mime?: string } {
    if (!this.files) return {}
    const entry = Object.keys(this.files).find(
      (p) => p.startsWith('BinData/') && this.basenameNoExt(p) === id,
    )
    if (!entry) return {}
    const data = this.files[entry]
    const mime = this.guessMimeFromName(entry)
    const name = entry.split('/').pop()
    return { data, name, mime }
  }

  private renderRunChildren(runNode: Element, idRef: number | undefined, out: HwpxRun[]) {
    Array.from(runNode.children).forEach((child) => {
      const tag = child.localName
      if (tag === 't') {
        const text = child.textContent || ''
        if (text) {
          const style = idRef !== undefined && !Number.isNaN(idRef) ? this.charStyles[idRef] : undefined
          out.push({ text, charPrIDRef: idRef, style })
        }
        return
      }
      if (tag === 'pic') {
        const imgEl = (child as Element).querySelector('hc\\:img, img') as Element | null
        const picId = imgEl?.getAttribute('binaryItemIDRef') || ''
        const szEl = (child as Element).querySelector(`${this.ns}sz, sz`) as Element | null
        const curEl = (child as Element).querySelector(`${this.ns}curSz, curSz`) as Element | null
        const widthAttr = (szEl || curEl)?.getAttribute('width') || undefined
        const heightAttr = (szEl || curEl)?.getAttribute('height') || undefined
        const widthPx = widthAttr ? this.pxFrom100thMm(Number(widthAttr)) : undefined
        const heightPx = heightAttr ? this.pxFrom100thMm(Number(heightAttr)) : undefined
        const resolved = picId ? this.resolveBinary(picId) : {}
        const style = idRef !== undefined && !Number.isNaN(idRef) ? this.charStyles[idRef] : undefined
        out.push({
          text: '',
          charPrIDRef: idRef,
          style,
          image: { id: picId, data: resolved.data, name: resolved.name, mime: resolved.mime, widthPx, heightPx },
        })
      }
      if (tag === 'autoNum') {
        const numType = (child as Element).getAttribute('numType') || ''
        const upper = numType.toUpperCase()
        let autoNumType: 'PAGE' | 'TOTAL_PAGE' | undefined
        if (upper === 'PAGE') autoNumType = 'PAGE'
        if (upper === 'TOTAL_PAGE') autoNumType = 'TOTAL_PAGE'
        const style = idRef !== undefined ? this.charStyles[idRef] : undefined
        out.push({ text: '', charPrIDRef: idRef, style, autoNumType })
      }
    })
  }

  private parseParagraph(p: Element): HwpxParagraph {
    const runs: HwpxRun[] = []
    const styleIDRefAttr = p.getAttribute('styleIDRef') || undefined
    const paraPrIDRefAttr = p.getAttribute('paraPrIDRef') || undefined
    const styleIDRef = styleIDRefAttr ? Number(styleIDRefAttr) : undefined
    const paraPrIDRef = paraPrIDRefAttr ? Number(paraPrIDRefAttr) : undefined
    const styleDefaults = styleIDRef !== undefined ? this.styleIndex[styleIDRef] : undefined
    const appliedParaId = paraPrIDRef ?? styleDefaults?.paraPrIDRef
    const paragraphStyle: HwpxParagraphStyle | undefined =
      appliedParaId !== undefined ? this.paraStyles[appliedParaId] : undefined
    const defaultCharPrId = styleDefaults?.charPrIDRef

    const runNodes = p.querySelectorAll(`${this.ns}run, run`)
    if (runNodes.length > 0) {
      runNodes.forEach((runNode) => {
        const idRefAttr = (runNode as Element).getAttribute('charPrIDRef') || undefined
        const idRef = idRefAttr ? Number(idRefAttr) : defaultCharPrId
        this.renderRunChildren(runNode as Element, idRef, runs)
      })
    } else {
      const texts = this.getTextContent(p)
      texts.forEach((text) => {
        const style = defaultCharPrId !== undefined ? this.charStyles[defaultCharPrId] : undefined
        runs.push({ text, charPrIDRef: defaultCharPrId, style })
      })
    }

    return { runs, style: paragraphStyle }
  }

  private parseFooter(doc: Document): HwpxParagraph[] | undefined {
    const footerNode = doc.querySelector(`${this.ns}footer, footer`) as Element | null
    if (!footerNode) return undefined
    const list: HwpxParagraph[] = []
    const footerPs = footerNode.querySelectorAll(`${this.ns}p, p`)
    footerPs.forEach((fp) => {
      const runs: HwpxRun[] = []
      const runNodes = (fp as Element).querySelectorAll(`${this.ns}run, run`)
      runNodes.forEach((runNode) => {
        const idRefAttr = (runNode as Element).getAttribute('charPrIDRef') || undefined
        const idRef = idRefAttr ? Number(idRefAttr) : undefined
        this.renderRunChildren(runNode as Element, idRef, runs)
      })
      list.push({ runs })
    })
    return list.length ? list : undefined
  }

  parse(xml: string): HwpxSection {
    const doc = new DOMParser().parseFromString(xml, 'application/xml')
    const root = doc.documentElement
    const paragraphs: HwpxParagraph[] = []
    const pNodes = Array.from(root.children).filter((el) => el.localName === 'p')
    pNodes.forEach((p) => paragraphs.push(this.parseParagraph(p as Element)))
    const footer = this.parseFooter(doc)
    return { paragraphs, footer }
  }
}


