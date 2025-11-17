import { unzipSync, strFromU8 } from "fflate";
import { HwpxDocument, HwpxHeader, HwpxSection } from "./models";
import HeaderParser from "./parsers/HeaderParser";
import SectionParser from "./parsers/SectionParser";

function defaultHeader(): HwpxHeader {
  return {
    pageWidth: 21000,
    pageHeight: 29700,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
  };
}

export default function parseHwpx(data: Uint8Array): HwpxDocument {
  const files = unzipSync(data);

  // header.xml → 스타일 파싱
  const headerEntry = Object.keys(files).find(
    (p) => p === "Contents/header.xml"
  );
  const headerXml = headerEntry ? strFromU8(files[headerEntry]) : "";
  const { charStyles, paraStyles, styleIndex } = headerXml
    ? new HeaderParser().parse(headerXml)
    : { charStyles: {}, paraStyles: {}, styleIndex: {} };

  const sectionEntries = Object.keys(files)
    .filter((name) => /^Contents\/section\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const ai = Number(a.match(/section(\d+)\.xml/i)?.[1] || 0);
      const bi = Number(b.match(/section(\d+)\.xml/i)?.[1] || 0);
      return ai - bi;
    });

  const sections: HwpxSection[] = [];
  if (sectionEntries.length === 0) {
    sections.push({ paragraphs: [] });
  } else {
    for (const name of sectionEntries) {
      const xml = strFromU8(files[name]);
      const parser = new SectionParser(
        charStyles,
        paraStyles,
        styleIndex,
        files
      );
      sections.push(parser.parse(xml));
    }
  }

  const header: HwpxHeader = {
    ...defaultHeader(),
    charStyles,
  };

  return {
    header,
    sections,
  };
}
