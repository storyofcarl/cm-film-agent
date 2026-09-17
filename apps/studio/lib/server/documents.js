import mammoth from "mammoth";

export async function extractDocument(buffer, extension) {
  if (!buffer.length || buffer.length > 20 * 1024 * 1024)
    throw new Error("Documents must be between 1 byte and 20 MB.");
  let text;
  let warnings = [];
  let pages = null;
  if (extension === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({
      data: new Uint8Array(buffer),
      isEvalSupported: false,
    });
    try {
      const result = await parser.getText();
      if (!result.pages?.some((page) => page.text?.trim()))
        throw new Error(
          "This PDF has no readable text. Supply OCR text or a text export; the original remains available.",
        );
      text = result.text;
      pages = result.total;
      if (result.pages?.some((page) => !page.text?.trim()))
        warnings.push(
          "Some PDF pages have no extractable text. Images and scanned pages need a separate review.",
        );
    } finally {
      await parser.destroy();
    }
  } else if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
    warnings = result.messages.map((message) => message.message);
  } else text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  if (!text?.trim())
    throw new Error(
      "No readable text was found. Supply an OCR/text version or review the original with the crew.",
    );
  if (text.length > 500000)
    throw new Error(
      "This document exceeds 500,000 extracted characters. Split it into named parts; its original is preserved.",
    );
  return {
    text,
    pages,
    warnings,
    note: "Text extraction preserves readable text, not page design or embedded-image content. Completeness is not yet approved.",
  };
}
