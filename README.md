# json-seq
Tools for working with json-seq (RFC 7464)

## Stream Options

Both of the Stream types are instance of [stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform) and pass through all stream.Transform options.

They additionally support charCodeStart and charCodeEnd parameters which can be used to override the default RFC 7464 record start and end characters.

## ParseStream

```javascript
import jsonSeq from 'json-seq';

const parseStream = new jsonSeq.ParseStream();
parseStream.on('data', record => {
  console.log('Value of "foo"', record.foo);
});
parseStream.on('invalid', string => {
  console.log('Invalid record encountered. Record string: ', string);
});
parseStream.on('truncated', string => {
  console.log('Truncated record encountered. Record string: ', string);
});

parseStream.write('{"foo": "bar"}\n');

```

## StringifyStream

```javascript
import jsonSeq from 'json-seq';

const stringifyStream = new jsonSeq.StringifyStream();
stringifyStream.pipe(process.stdout);

stringifyStream.write({foo: "bar"});
```
