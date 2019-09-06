const {Buffer} = require('buffer');
const {Transform} = require('stream');

const CHAR_CODE_RECORD_SEPARATOR = 30;
const CHAR_CODE_NEWLINE = 10;

/**
 * Invalid event.
 *
 * Emitted when the content between the start and end characters isn't valid JSON.
 *
 * @event invalid
 * @type {string}
 */

/**
 * Truncated event.
 *
 * Emitted when a record isn't terminated by an end character
 * before the next start character is encountered.
 *
 * @event truncated
 * @type {string}
 */

/**
 * Parse Stream
 *
 * @fires invalid
 * @fires truncated
 */
class ParseStream extends Transform {
  /**
   * @param options
   * @param options.charCodeStart Character code that marks the start of a record (defaults to RS)
   * @param options.charCodeEnd   Character code that marks the end of a record (default to newline)
   */
  constructor(options) {
    const mergedOptions = {
      charCodeStart: CHAR_CODE_RECORD_SEPARATOR,
      charCodeEnd: CHAR_CODE_NEWLINE,
      readableObjectMode: true,
      ...options,
    };
    super(mergedOptions);

    this.charCodeStart = mergedOptions.charCodeStart;
    this.charCodeEnd = mergedOptions.charCodeEnd;

    this.buffer = [];
  }

  _bufferContent(content, startIndex = 0, endIndex = undefined) {
    this.buffer.push(content.slice(startIndex, endIndex));
  }

  _transform(chunk, encoding, callback) {
    let chunkIndexStart = undefined;

    for (let chunkIndex = 0; chunkIndex < chunk.length; ++chunkIndex) {
      const char = chunk[chunkIndex];

      if (char === this.charCodeStart) {
        if (this.buffer.length) {
          this.emit('truncated', Buffer.concat(this.buffer).toString('utf8'));

          this.buffer = [];
        }

        chunkIndexStart = chunkIndex + 1;
      } else if (char === this.charCodeEnd) {
        if (chunkIndexStart === undefined && !this.buffer.length) {
          continue;
        }

        const newContentStartIndex =
          chunkIndexStart !== undefined ? chunkIndexStart : 0;
        if (chunkIndex > newContentStartIndex) {
          this._bufferContent(chunk, newContentStartIndex, chunkIndex);
        }

        const string = Buffer.concat(this.buffer).toString('utf8');
        let data;
        try {
          data = JSON.parse(string);
        } catch (err) {
          this.emit('invalid', string);
        }
        if (data !== undefined) {
          this.push(data);
        }

        this.buffer = [];
        chunkIndexStart = undefined;
      }
    }

    if (chunkIndexStart !== undefined) {
      this._bufferContent(chunk, chunkIndexStart);
    } else if (this.buffer.length) {
      this._bufferContent(chunk);
    }

    callback();
  }
}

/**
 * Stringify Stream
 */
class StringifyStream extends Transform {
  /**
   * @param options
   * @param options.charCodeStart Character code that marks the start of a record (defaults to RS)
   * @param options.charCodeEnd   Character code that marks the end of a record (default to newline)
   */
  constructor(options) {
    const mergedOptions = {
      charCodeStart: CHAR_CODE_RECORD_SEPARATOR,
      charCodeEnd: CHAR_CODE_NEWLINE,
      writeableObjectMode: true,
      ...options,
    };
    super(mergedOptions);

    this.charCodeStart = mergedOptions.charCodeStart;
    this.charCodeEnd = mergedOptions.charCodeEnd;
  }

  _transform(chunk, encoding, callback) {
    try {
      const string = JSON.stringify(chunk);

      if (this.charCodeStart) {
        this.push(this.charCodeStart);
      }
      this.push(string);
      if (this.charCodeEnd) {
        this.push(this.charCodeEnd);
      }

      callback();
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = {
  ParseStream,
  StringifyStream,
};
