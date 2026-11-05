import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from '../csv';

describe('csvCell', () => {
  it('leaves plain text and numbers alone', () => {
    expect(csvCell('Kasun')).toBe('Kasun');
    expect(csvCell(2500)).toBe('2500');
    expect(csvCell(-5)).toBe('-5');
  });

  it('renders empty values as empty fields', () => {
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
  });

  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('Perera, Kasun')).toBe('"Perera, Kasun"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('neutralises spreadsheet formulas in text', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+94771234567')).toBe("'+94771234567");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
  });

  it('keeps Sinhala text intact', () => {
    expect(csvCell('ගිණුම්කරණ')).toBe('ගිණුම්කරණ');
  });
});

describe('toCsv', () => {
  it('joins header and rows with CRLF', () => {
    expect(toCsv(['Name', 'Score'], [['Kasun', 90], ['Nimal', null]])).toBe('Name,Score\r\nKasun,90\r\nNimal,');
  });
});
