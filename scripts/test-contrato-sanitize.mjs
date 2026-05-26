import fs from "node:fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { sanitizeContratoDocumentXml } from "../api/_lib/contratoDocxSanitize.ts";

const data = {
  nome_cliente: "Augusto (ADMIN)",
  profissao: "x",
  cpf: "111.111.111-11",
  rg: "1",
  data_nascimento: "01/01/1990",
  endereco: "Rua X",
  telefone: "11999999999",
  produtos_lista:
    "• Produto 1: iPhone 13 White Marca/Modelo: iPhone 13; Cor: White; Número de Série: SN1; IMEI: 111; Estado do Bem (novo/usado): Novo; Acessórios Inclusos: Capa\n" +
    "• Produto 2: iPhone 14 Black Marca/Modelo: iPhone 14; Cor: Black; Número de Série: SN2; IMEI: 222; Estado do Bem (novo/usado): Novo; Acessórios Inclusos: Nenhum",
  valor_total: "5.000,00",
  valor_total_extenso: "cinco mil reais",
  num_parcelas: "12",
  valor_parcela: "416,67",
  valor_parcela_extenso: "quatrocentos reais",
  primeiro_vencimento: "10/05/2026",
  numero_contrato: "44-2028",
  data_local_assinatura: "[Goiânia GO], 26 de maio de 2026",
  nome_cliente_assinatura: "Augusto (ADMIN)",
};

const zip = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"));
const doc = new Docxtemplater(zip, {
  paragraphLoop: false,
  linebreaks: true,
  delimiters: { start: "{", end: "}" },
  nullGetter: () => "",
});
doc.render(data);
const rendered = doc.getZip().file("word/document.xml").asText();
const sanitized = sanitizeContratoDocumentXml(rendered);

function stats(label, xml) {
  const paras = (xml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/)?.[1] ?? "").match(
    /<w:p[\s\S]*?<\/w:p>/g,
  ) ?? [];
  console.log(label, {
    breaks: (xml.match(/lastRenderedPageBreak/g) || []).length,
    borders: (xml.match(/7562850" cy="10696575/g) || []).length,
    paras: paras.length,
    p126: paras.length >= 127,
    graphic35: xml.includes("Graphic 35"),
    image27: (xml.match(/name="Image 27"/g) || []).length,
    logoBottom: xml.includes('align>bottom</wp:align><wp:posOffset>200000'),
    compradorLine: xml.includes("Graphic 35"),
  });
}

stats("rendered", rendered);
stats("sanitized", sanitized);

doc.getZip().file("word/document.xml", sanitized);
fs.writeFileSync("_test_contrato_fixed.docx", doc.getZip().generate({ type: "nodebuffer" }));
console.log("\nWrote _test_contrato_fixed.docx");
