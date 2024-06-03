/* eslint-disable no-param-reassign */
class CsvFile {
  charCode10 = 0x0A;

  charCode13 = 0x0D;

  charCode20 = 0x20;

  charCode7F = 0x7f;

  charCodeA0 = 0xa0;

  charCodeFF = 0xff;

  isValidCsvFile(content) {
    for (let n = 0; n < content.length; n += 1) {
      const charCode = content.charCodeAt(n);
      if (!(charCode === this.charCode10 || charCode === this.charCode13 ||
        (charCode >= this.charCode20 && charCode <= this.charCode7F) ||
        (charCode >= this.charCodeA0 && charCode <= this.charCodeFF)
      )) {
        return false;
      }
    }

    return true;
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
