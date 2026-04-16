export type ParsedRow = {
  sku: string;
  barcode: string | undefined;
  productProfile: 'accessories' | 'parts';
  nameRu: string;
  nameUz: string;
};

export type RowError = {
  row: number;
  message: string;
};

export type ParseResult = {
  valid: ParsedRow[];
  errors: RowError[];
};

function splitLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let value = '';
      i++;
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          value += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++;
          break;
        } else {
          value += line[i++];
        }
      }
      fields.push(value);
      if (line[i] === ',') i++;
    } else {
      const start = i;
      while (i < line.length && line[i] !== ',') i++;
      fields.push(line.slice(start, i));
      if (line[i] === ',') i++;
    }
  }
  return fields;
}

export function parseCsvImport(csvText: string): ParseResult {
  const lines = csvText.split('\n').map(l => l.trimEnd());
  const valid: ParsedRow[] = [];
  const errors: RowError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const rowNum = i + 1;
    const fields = splitLine(line);

    const [rawSku, rawBarcode, rawProfile, rawNameRu, rawNameUz] = fields;

    const sku = rawSku?.trim() ?? '';
    const barcode = rawBarcode?.trim() || undefined;
    const profile = rawProfile?.trim() ?? '';
    const nameRu = rawNameRu?.trim() ?? '';
    const nameUz = rawNameUz?.trim() ?? '';

    if (!sku) {
      errors.push({ row: rowNum, message: 'sku is required' });
      continue;
    }
    if (profile !== 'accessories' && profile !== 'parts') {
      errors.push({ row: rowNum, message: `productProfile must be 'accessories' or 'parts', got '${profile}'` });
      continue;
    }
    if (!nameRu) {
      errors.push({ row: rowNum, message: 'nameRu is required' });
      continue;
    }
    if (!nameUz) {
      errors.push({ row: rowNum, message: 'nameUz is required' });
      continue;
    }

    valid.push({ sku, barcode, productProfile: profile, nameRu, nameUz });
  }

  return { valid, errors };
}
