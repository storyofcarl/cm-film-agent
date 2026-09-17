/** @jest-environment node */
import { extractDocument } from "../apps/studio/lib/server/documents";
import { applyCommand, createProject } from "../apps/studio/lib/domain";
import JSZip from "jszip";
import { execFileSync } from "node:child_process";

function parsePdfInNode(buffer) {
  // PDF.js loads its worker dynamically; verify it in the actual Node runtime,
  // outside Jest's isolated module VM, just as the hosted API runs it.
  const script = `import fs from 'node:fs'; import { extractDocument } from './apps/studio/lib/server/documents.js'; const buffer = Buffer.from(fs.readFileSync(0, 'utf8'), 'base64'); try { console.log(JSON.stringify(await extractDocument(buffer, 'pdf'))); } catch (error) { console.log(JSON.stringify({error:error.message})); }`;
  const result = JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      input: buffer.toString("base64"),
      encoding: "utf8",
      windowsHide: true,
    }),
  );
  if (result.error) throw new Error(result.error);
  return result;
}

function pdf(text) {
  const stream = `BT /F1 12 Tf 50 700 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let value = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(value.length);
    value += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const start = value.length;
  value += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return Buffer.from(value);
}

test("real PDF and Word extraction preserve script text; empty or oversized work is not silently accepted", async () => {
  const result = parsePdfInNode(pdf("INT. STATION - NIGHT. The keeper waits."));
  expect(result.text).toContain("The keeper waits.");
  expect(result.pages).toBe(1);
  expect(() => parsePdfInNode(pdf(" "))).toThrow("no readable text");
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    "_rels/.rels",
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    "word/document.xml",
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>The keeper receives a signal.</w:t></w:r></w:p></w:body></w:document>',
  );
  expect(
    (
      await extractDocument(
        await zip.generateAsync({ type: "nodebuffer" }),
        "docx",
      )
    ).text,
  ).toContain("The keeper receives a signal.");
  await expect(
    extractDocument(Buffer.from("x".repeat(500001)), "txt"),
  ).rejects.toThrow("500,000");
});

test("inbox assignment preserves supplied media and unknown provenance, stays pending and is idempotent", () => {
  let project = createProject();
  project = applyCommand(project, {
    type: "item.add",
    payload: { kind: "asset", title: "Keeper", assetType: "character" },
  });
  project.inbox = [
    {
      id: "upload",
      title: "Keeper.png",
      status: "ready",
      media: { url: "/api/film/media?key=aaaaaaaaaaaaaaaa.png", type: "image" },
      assignments: [],
    },
  ];
  const payload = {
    inboxId: "upload",
    targetId: project.assets[0].id,
    purpose: "version",
  };
  project = applyCommand(project, { type: "inbox.assign", payload });
  project = applyCommand(project, { type: "inbox.assign", payload });
  expect(project.assets[0].versions).toHaveLength(1);
  expect(project.assets[0].versions[0]).toMatchObject({
    sourceInboxId: "upload",
    origin: "imported",
    review: "pending",
    prompt: null,
    model: null,
    seed: null,
  });
  expect(project.inbox[0].code).toBe("IN-001");
  expect(() =>
    applyCommand(project, {
      type: "inbox.assign",
      payload: { ...payload, purpose: "previs" },
    }),
  ).toThrow("requires video");
});
