import { unzipSync, strFromU8 } from 'fflate'
import { HwpxDocument, HwpxHeader, HwpxParagraph, HwpxRun, HwpxSection } from './models'

function defaultHeader(): HwpxHeader {
  return {
    pageWidth: 59528,
    pageHeight: 84188,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
  }
}

function getTextContent(node: Element, ns: string): string[] {
  const list: string[] = []
  const tNodes = node.querySelectorAll(`${ns}t, t`)
  tNodes.forEach((t) => list.push(t.textContent || ''))
  return list
}

function parseSectionXml(xml: string): HwpxSection {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const ns = 'hp\\:'
  const paragraphs: HwpxParagraph[] = []

  const pNodes = doc.querySelectorAll(`${ns}p, p`)
  pNodes.forEach((p) => {
    const runs: HwpxRun[] = []
    const texts = getTextContent(p as Element, `${ns}`)
    texts.forEach((text) => runs.push({ text }))
    paragraphs.push({ runs })
  })

  return { paragraphs }
}

export default function parseHwpx(data: Uint8Array): HwpxDocument {
  const files = unzipSync(data)

  const sectionEntries = Object.keys(files)
    .filter((name) => /^Contents\/section\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const ai = Number(a.match(/section(\d+)\.xml/i)?.[1] || 0)
      const bi = Number(b.match(/section(\d+)\.xml/i)?.[1] || 0)
      return ai - bi
    })

  const sections: HwpxSection[] = []
  if (sectionEntries.length === 0) {
    sections.push({ paragraphs: [] })
  } else {
    for (const name of sectionEntries) {
      const xml = strFromU8(files[name])
      sections.push(parseSectionXml(xml))
    }
  }

  return {
    header: defaultHeader(),
    sections,
  }
}


