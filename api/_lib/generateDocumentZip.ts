import { ZipArchive } from "archiver";

export async function buildZipFromEntries(
  entries: { filename: string; data: Buffer }[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    archive.on("data", (c: Buffer) => chunks.push(c));
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(chunks)));

    for (const e of entries) {
      archive.append(e.data, { name: e.filename });
    }
    void archive.finalize();
  });
}
