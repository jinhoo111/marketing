/* 로컬 데이터 암호화 — Web Crypto (AES-GCM 256 + PBKDF2-SHA256)
   PIN은 어디에도 저장하지 않고, 키 유도에만 사용합니다.
   외부 전송은 없습니다. 모든 계산은 브라우저 안에서 끝납니다. */
'use strict';

var CryptoBox = (function () {
  var ITERATIONS = 250000;
  var encoder = new TextEncoder();
  var decoder = new TextDecoder();

  function available() {
    return !!(window.crypto && window.crypto.subtle && window.TextEncoder && window.TextDecoder && window.btoa && window.atob);
  }

  function randomBytes(n) {
    var a = new Uint8Array(n);
    window.crypto.getRandomValues(a);
    return a;
  }

  function toB64(buffer) {
    var bytes = new Uint8Array(buffer);
    var binary = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return window.btoa(binary);
  }

  function fromB64(text) {
    var binary = window.atob(String(text || ''));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function deriveKey(pin, saltBytes, iterations) {
    var base = await window.crypto.subtle.importKey(
      'raw', encoder.encode(String(pin)), 'PBKDF2', false, ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBytes, iterations: iterations, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptWithKey(data, key, meta) {
    var iv = randomBytes(12);
    var cipher = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(JSON.stringify(data))
    );
    return {
      v: 2,
      enc: true,
      alg: 'AES-GCM-256',
      kdf: 'PBKDF2-SHA256',
      iterations: meta.iterations,
      salt: meta.salt,
      iv: toB64(iv),
      ciphertext: toB64(cipher),
      createdAt: new Date().toISOString()
    };
  }

  async function encryptNew(data, pin) {
    var salt = toB64(randomBytes(16));
    var iterations = ITERATIONS;
    var key = await deriveKey(pin, fromB64(salt), iterations);
    var envelope = await encryptWithKey(data, key, { salt: salt, iterations: iterations });
    return { envelope: envelope, key: key, salt: salt, iterations: iterations };
  }

  async function decrypt(envelope, pin) {
    if (!envelope || typeof envelope !== 'object' || !envelope.ciphertext || !envelope.salt || !envelope.iv) {
      throw new Error('암호화된 데이터 형식이 아닙니다.');
    }
    var iterations = Number(envelope.iterations) || ITERATIONS;
    if (iterations < 10000 || iterations > 2000000) throw new Error('암호화 설정이 올바르지 않습니다.');
    var key = await deriveKey(pin, fromB64(envelope.salt), iterations);
    var plain = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(envelope.iv) },
      key,
      fromB64(envelope.ciphertext)
    );
    var text = decoder.decode(plain);
    var data = JSON.parse(text);
    return { data: data, key: key, salt: envelope.salt, iterations: iterations };
  }

  return {
    available: available,
    encryptNew: encryptNew,
    encryptWithKey: encryptWithKey,
    decrypt: decrypt,
    ITERATIONS: ITERATIONS,
    toB64: toB64,
    fromB64: fromB64
  };
})();
