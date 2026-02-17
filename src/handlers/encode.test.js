import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  urlEncode, urlDecode, htmlEncode, htmlDecode, rot13,
  toBase, fromBase, baseConvert,
  textToBinary, binaryToText, textToHex, hexToText,
  morseEncode, morseDecode
} from './encode.js';

describe('encode', () => {
  describe('urlEncode / urlDecode', () => {
    it('encodes special characters', () => {
      assert.equal(urlEncode('hello world'), 'hello%20world');
      assert.equal(urlEncode('a&b=c'), 'a%26b%3Dc');
    });
    it('decodes back', () => {
      assert.equal(urlDecode('hello%20world'), 'hello world');
      assert.equal(urlDecode('a%26b%3Dc'), 'a&b=c');
    });
    it('roundtrips unicode', () => {
      const text = '한글 テスト';
      assert.equal(urlDecode(urlEncode(text)), text);
    });
    it('throws on invalid input', () => {
      assert.throws(() => urlDecode('%ZZ'), /Invalid/);
    });
  });

  describe('htmlEncode / htmlDecode', () => {
    it('encodes HTML entities', () => {
      assert.equal(htmlEncode('<div class="test">a & b</div>'), '&lt;div class=&quot;test&quot;&gt;a &amp; b&lt;/div&gt;');
    });
    it('decodes HTML entities', () => {
      assert.equal(htmlDecode('&lt;b&gt;bold&lt;/b&gt;'), '<b>bold</b>');
      assert.equal(htmlDecode('&amp; &quot; &#39;'), '& " \'');
    });
    it('handles numeric entities', () => {
      assert.equal(htmlDecode('&#65;'), 'A');
      assert.equal(htmlDecode('&#x41;'), 'A');
    });
  });

  describe('rot13', () => {
    it('rotates letters', () => {
      assert.equal(rot13('Hello'), 'Uryyb');
      assert.equal(rot13('ABCabc'), 'NOPnop');
    });
    it('is its own inverse', () => {
      assert.equal(rot13(rot13('Secret Message!')), 'Secret Message!');
    });
    it('preserves non-alpha', () => {
      assert.equal(rot13('123 !@#'), '123 !@#');
    });
  });

  describe('toBase / fromBase', () => {
    it('converts decimal to binary', () => {
      assert.equal(toBase(42, 2), '101010');
    });
    it('converts decimal to hex', () => {
      assert.equal(toBase(255, 16), 'ff');
    });
    it('converts decimal to octal', () => {
      assert.equal(toBase(8, 8), '10');
    });
    it('converts from binary to decimal', () => {
      assert.equal(fromBase('101010', 2), 42);
    });
    it('converts from hex to decimal', () => {
      assert.equal(fromBase('ff', 16), 255);
    });
    it('handles negative numbers', () => {
      assert.equal(toBase(-10, 2), '-1010');
    });
    it('throws on invalid base', () => {
      assert.throws(() => toBase(10, 37), /Base must be/);
      assert.throws(() => fromBase('10', 1), /Base must be/);
    });
  });

  describe('baseConvert', () => {
    it('converts binary to hex', () => {
      const result = baseConvert('11111111', 2, 16);
      assert.equal(result.result, 'ff');
      assert.equal(result.decimal, 255);
    });
  });

  describe('textToBinary / binaryToText', () => {
    it('converts text to binary', () => {
      assert.equal(textToBinary('A'), '01000001');
      assert.equal(textToBinary('Hi'), '01001000 01101001');
    });
    it('converts binary back to text', () => {
      assert.equal(binaryToText('01001000 01101001'), 'Hi');
    });
    it('roundtrips', () => {
      const text = 'Hello!';
      assert.equal(binaryToText(textToBinary(text)), text);
    });
  });

  describe('textToHex / hexToText', () => {
    it('converts text to hex', () => {
      assert.equal(textToHex('A'), '41');
      assert.equal(textToHex('Hi'), '48 69');
    });
    it('converts hex back to text', () => {
      assert.equal(hexToText('48 65 6c 6c 6f'), 'Hello');
    });
    it('roundtrips', () => {
      const text = 'Test 123';
      assert.equal(hexToText(textToHex(text)), text);
    });
  });

  describe('morseEncode / morseDecode', () => {
    it('encodes text to morse', () => {
      assert.equal(morseEncode('SOS'), '... --- ...');
    });
    it('decodes morse to text', () => {
      assert.equal(morseDecode('... --- ...'), 'SOS');
    });
    it('handles spaces', () => {
      assert.equal(morseEncode('HI THERE'), '.... .. / - .... . .-. .');
    });
    it('handles numbers', () => {
      assert.equal(morseEncode('123'), '.---- ..--- ...--');
    });
    it('is case insensitive', () => {
      assert.equal(morseEncode('abc'), morseEncode('ABC'));
    });
  });
});
