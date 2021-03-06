/*
PDFReference - represents a reference to another object in the PDF object heirarchy
By Devon Govett
*/

import zlib from 'zlib';
import PDFAbstractReference from './abstract_reference';
import PDFObject from './object';

class PDFReference extends PDFAbstractReference {
  constructor(document, id, data) {
    super();    
    this.document = document;
    this.id = id;
    if (data == null) { data = {}; }
    this.data = data;
    this.gen = 0;
    this.compress = this.document.compress && !this.data.Filter;
    this.uncompressedLength = 0;
    this.buffer = [];
  }

  write(chunk) {
    if (!Buffer.isBuffer(chunk)) {
      chunk = new Buffer(chunk + '\n', 'binary');
    }

    this.uncompressedLength += chunk.length;
    if (this.data.Length == null) { this.data.Length = 0; }
    this.buffer.push(chunk);
    this.data.Length += chunk.length;
    if (this.compress) {
      return this.data.Filter = 'FlateDecode';
    }
  }

  end(chunk) {
    if (chunk) {
      this.write(chunk);
    }
    return this.finalize();
  }

  finalize() {
    return setTimeout(() => {
      this.offset = this.document._offset;

      this.document._write(`${this.id} ${this.gen} obj`);
      this.document._write(PDFObject.convert(this.data));

      if (this.buffer.length) {
        this.buffer = Buffer.concat(this.buffer);
        if (this.compress) {
          this.buffer = zlib.deflateSync(this.buffer);
          this.data.Length = this.buffer.length;
        }
        this.document._write('stream');
        this.document._write(this.buffer);

        this.buffer = []; // free up memory
        this.document._write('\nendstream');
      }

      this.document._write('endobj');
      return this.document._refEnd(this);
    }
    , 0);
  }
  toString() {
    return `${this.id} ${this.gen} R`;
  }
}

export default PDFReference;
