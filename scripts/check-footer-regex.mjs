import fs from "node:fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const z = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"));
const d = new Docxtemplater(z, {
  paragraphLoop: false,
  linebreaks: true,
  delimiters: { start: "{", end: "}" },
  nullGetter: () => "",
});
d.render({
  nome_cliente: "A",
  cpf: "1",
  produtos_lista: "x",
  valor_total: "1",
  valor_total_extenso: "u",
  num_parcelas: "1",
  valor_parcela: "1",
  valor_parcela_extenso: "u",
  primeiro_vencimento: "1",
  numero_contrato: "1",
  data_local_assinatura: "d",
  nome_cliente_assinatura: "A",
  profissao: "",
  rg: "",
  data_nascimento: "",
  endereco: "",
  telefone: "",
});
const x = d.getZip().file("word/document.xml").asText();
const re =
  /(<wp:positionV relativeFrom=")paragraph("><wp:posOffset>)(\d{7,})(<\/wp:posOffset><\/wp:positionV>)([\s\S]*?name="Image 27")/g;
let m;
let n = 0;
while ((m = re.exec(x))) {
  n++;
  console.log("match", n, "at", m.index, "offset", m[3], "gap", m[5].length);
}
