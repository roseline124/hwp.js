export interface HwpxHeader {
  pageWidth: number
  pageHeight: number
  marginLeft: number
  marginRight: number
  marginTop: number
  marginBottom: number
}

export interface HwpxRun {
  text: string
}

export interface HwpxParagraph {
  runs: HwpxRun[]
}

export interface HwpxSection {
  paragraphs: HwpxParagraph[]
}

export interface HwpxDocument {
  header: HwpxHeader
  sections: HwpxSection[]
}


