import Papa from 'papaparse';

/* eslint-disable no-param-reassign */
class CsvFile {
  rows = [];

  rowCount = 0;

  fieldCount = 0;

  charCode10 = 0x0a;

  charCode13 = 0x0d;

  charCode20 = 0x20;

  charCode7F = 0x7f;

  charCodeA0 = 0xa0;

  charCodeFF = 0xff;

  lineRegEx = /\n|\r\n/;

  isValidCsvFile(content) {
    for (let n = 0; n < content.length; n += 1) {
      const charCode = content.charCodeAt(n);
      if (
        !(
          charCode === this.charCode10 ||
          charCode === this.charCode13 ||
          (charCode >= this.charCode20 && charCode <= this.charCode7F) ||
          (charCode >= this.charCodeA0 && charCode <= this.charCodeFF)
        )
      ) {
        return false;
      }
    }

    return true;
  }

  read(content) {
    this.reset();

    const {data} = Papa.parse(content);
    this.rows = data;

    this.rowCount = this.rows.length;
    if (this.rowCount) {
      this.fieldCount = this.rows.at(0).length;
    }
  }

  reset() {
    this.rows = [];
    this.rowCount = 0;
    this.fieldCount = 0;
  }
}

const csvfile = new CsvFile();

const CsvFilePlugin = {
  csvfile,
};

export function useCsvFile() {
  return csvfile;
}

export default CsvFilePlugin;
