import { HwpxRun } from '@hwp.js/hwpx-parser'

export default class RunRenderer {
  render(run: HwpxRun): HTMLElement {
    if (run.image) {
      const img = document.createElement('img')
      if (run.image.data) {
        try {
          const u8 = run.image.data
          const copy = new Uint8Array(u8.byteLength)
          copy.set(u8)
          const blob = new Blob([copy.buffer], { type: run.image.mime || 'application/octet-stream' })
          img.src = URL.createObjectURL(blob)
        } catch {
          img.alt = `[image:${run.image.id}]`
        }
      } else {
        img.alt = `[image:${run.image.id}]`
      }
      if (run.image.widthPx) img.style.width = `${run.image.widthPx}px`
      if (run.image.heightPx) img.style.height = `${run.image.heightPx}px`
      img.style.verticalAlign = 'middle'
      img.style.display = 'inline-block'
      return img
    }

    const span = document.createElement('span')
    span.textContent = run.text
    if (run.style?.color) span.style.color = run.style.color
    if (run.style?.fontSizePx) {
      span.style.fontSize = `${run.style.fontSizePx}px`
      span.style.lineHeight = '1.3'
    }
    if (run.style?.fontWeight) span.style.fontWeight = run.style.fontWeight
    return span
  }
}


