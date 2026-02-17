#!/usr/bin/env node
/**
 * update-openapi.js
 *
 * Reads the existing openapi.json, adds missing endpoint definitions
 * for encode/decode, faker, and security categories, then writes back.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPEC_PATH = path.resolve(__dirname, '..', 'openapi.json');

// ---------------------------------------------------------------------------
// Helper: build a simple POST endpoint with { text: string } -> { result: string }
// ---------------------------------------------------------------------------
function textToResult(summary, operationId, inputExample, outputField, outputExample) {
  return {
    post: {
      summary,
      operationId,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['text'],
              properties: {
                text: { type: 'string', example: inputExample }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: summary,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  [outputField]: { type: 'string', example: outputExample }
                }
              }
            }
          }
        }
      }
    }
  };
}

// ---------------------------------------------------------------------------
// New paths to add
// ---------------------------------------------------------------------------
function buildNewPaths() {
  const paths = {};

  // ======= ENCODE / DECODE =======

  paths['/encode/url'] = textToResult(
    'URL-encode text',
    'urlEncode',
    'hello world & foo=bar',
    'result',
    'hello%20world%20%26%20foo%3Dbar'
  );

  paths['/decode/url'] = textToResult(
    'URL-decode text',
    'urlDecode',
    'hello%20world%20%26%20foo%3Dbar',
    'result',
    'hello world & foo=bar'
  );

  paths['/encode/html'] = textToResult(
    'HTML-encode text (escape special characters)',
    'htmlEncode',
    '<script>alert("xss")</script>',
    'result',
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
  );

  paths['/decode/html'] = textToResult(
    'HTML-decode text (unescape entities)',
    'htmlDecode',
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    'result',
    '<script>alert("xss")</script>'
  );

  paths['/encode/rot13'] = textToResult(
    'Apply ROT13 cipher to text',
    'rot13Encode',
    'Hello World',
    'result',
    'Uryyb Jbeyq'
  );

  paths['/encode/morse'] = textToResult(
    'Encode text to Morse code',
    'morseEncode',
    'HELLO',
    'result',
    '.... . .-.. .-.. ---'
  );

  paths['/decode/morse'] = textToResult(
    'Decode Morse code to text',
    'morseDecode',
    '.... . .-.. .-.. ---',
    'result',
    'HELLO'
  );

  paths['/encode/binary'] = textToResult(
    'Convert text to binary representation',
    'binaryEncode',
    'Hi',
    'result',
    '01001000 01101001'
  );

  paths['/decode/binary'] = textToResult(
    'Convert binary representation to text',
    'binaryDecode',
    '01001000 01101001',
    'result',
    'Hi'
  );

  paths['/encode/hex'] = textToResult(
    'Convert text to hexadecimal',
    'hexEncode',
    'Hi',
    'result',
    '4869'
  );

  paths['/decode/hex'] = textToResult(
    'Convert hexadecimal to text',
    'hexDecode',
    '4869',
    'result',
    'Hi'
  );

  paths['/convert/base'] = {
    post: {
      summary: 'Convert a number between bases (2-36)',
      operationId: 'convertBase',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                value: { type: 'string', description: 'Number as string in source base', example: '255' },
                from: { type: 'integer', description: 'Source base (2-36)', example: 10 },
                to: { type: 'integer', description: 'Target base (2-36)', example: 16 },
                number: { type: 'integer', description: 'Alternative: decimal number to convert', example: 255 },
                base: { type: 'integer', description: 'Alternative: target base', example: 16 }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Converted number',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  result: { type: 'string', example: 'ff' },
                  decimal: { type: 'integer', example: 255 }
                }
              }
            }
          }
        }
      }
    }
  };

  // ======= FAKER (TEST DATA) =======

  paths['/faker/person'] = {
    get: {
      summary: 'Generate fake person data',
      operationId: 'getFakerPerson',
      responses: {
        '200': {
          description: 'Random person data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string', example: 'James' },
                  lastName: { type: 'string', example: 'Smith' },
                  fullName: { type: 'string', example: 'James Smith' },
                  email: { type: 'string', example: 'james.smith@example.com' },
                  phone: { type: 'string', example: '(555) 123-4567' },
                  age: { type: 'integer', example: 34 },
                  gender: { type: 'string', example: 'male' }
                }
              }
            }
          }
        }
      }
    }
  };

  paths['/faker/address'] = {
    get: {
      summary: 'Generate fake US address',
      operationId: 'getFakerAddress',
      responses: {
        '200': {
          description: 'Random US address',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  street: { type: 'string', example: '742 Evergreen Terrace' },
                  city: { type: 'string', example: 'Springfield' },
                  state: { type: 'string', example: 'Illinois' },
                  stateAbbr: { type: 'string', example: 'IL' },
                  zip: { type: 'string', example: '62704' },
                  country: { type: 'string', example: 'US' }
                }
              }
            }
          }
        }
      }
    }
  };

  paths['/faker/company'] = {
    get: {
      summary: 'Generate fake company data',
      operationId: 'getFakerCompany',
      responses: {
        '200': {
          description: 'Random company data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Acme Corp' },
                  domain: { type: 'string', example: 'acmecorp.com' },
                  email: { type: 'string', example: 'contact@acmecorp.com' },
                  phone: { type: 'string', example: '(555) 987-6543' },
                  industry: { type: 'string', example: 'Technology' },
                  catchPhrase: { type: 'string', example: 'Innovative solutions for modern challenges' }
                }
              }
            }
          }
        }
      }
    }
  };

  paths['/faker/credit-card'] = {
    get: {
      summary: 'Generate Luhn-valid test credit card number',
      operationId: 'getFakerCreditCard',
      responses: {
        '200': {
          description: 'Random test credit card data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', example: 'Visa' },
                  number: { type: 'string', example: '4532015112830366' },
                  expiry: { type: 'string', example: '09/28' },
                  cvv: { type: 'string', example: '123' }
                }
              }
            }
          }
        }
      }
    }
  };

  paths['/faker/product'] = {
    get: {
      summary: 'Generate fake product data',
      operationId: 'getFakerProduct',
      responses: {
        '200': {
          description: 'Random product data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Ergonomic Wireless Mouse' },
                  category: { type: 'string', example: 'Electronics' },
                  price: { type: 'number', example: 29.99 },
                  currency: { type: 'string', example: 'USD' },
                  sku: { type: 'string', example: 'SKU-8A3F2B' },
                  inStock: { type: 'boolean', example: true },
                  rating: { type: 'number', example: 4.5 }
                }
              }
            }
          }
        }
      }
    }
  };

  // /faker/date supports both GET and POST
  const fakerDateResponseSchema = {
    type: 'object',
    properties: {
      iso: { type: 'string', example: '2025-06-15T08:30:00.000Z' },
      unix: { type: 'integer', example: 1750062600 },
      year: { type: 'integer', example: 2025 },
      month: { type: 'integer', example: 6 },
      day: { type: 'integer', example: 15 },
      dayOfWeek: { type: 'string', example: 'Sunday' }
    }
  };

  paths['/faker/date'] = {
    get: {
      summary: 'Generate a random date',
      operationId: 'getFakerDate',
      responses: {
        '200': {
          description: 'Random date',
          content: {
            'application/json': {
              schema: fakerDateResponseSchema
            }
          }
        }
      }
    },
    post: {
      summary: 'Generate a random date within a range',
      operationId: 'postFakerDate',
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                from: { type: 'string', description: 'Start date (ISO 8601)', example: '2020-01-01' },
                to: { type: 'string', description: 'End date (ISO 8601)', example: '2025-12-31' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Random date within range',
          content: {
            'application/json': {
              schema: fakerDateResponseSchema
            }
          }
        }
      }
    }
  };

  // /faker/profile supports both GET and POST
  const profileSchema = {
    type: 'object',
    properties: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      fullName: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' },
      age: { type: 'integer' },
      gender: { type: 'string' },
      address: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zip: { type: 'string' },
          country: { type: 'string' }
        }
      },
      company: { type: 'string' },
      jobTitle: { type: 'string' }
    }
  };

  paths['/faker/profile'] = {
    get: {
      summary: 'Generate a full fake profile',
      operationId: 'getFakerProfile',
      responses: {
        '200': {
          description: 'Random full profile',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: profileSchema
                }
              }
            }
          }
        }
      }
    },
    post: {
      summary: 'Generate one or more full fake profiles',
      operationId: 'postFakerProfile',
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: { type: 'integer', minimum: 1, maximum: 100, default: 1, description: 'Number of profiles to generate (1-100)' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Generated profile(s)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    oneOf: [
                      profileSchema,
                      { type: 'array', items: profileSchema }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  // ======= SECURITY =======

  paths['/security/hmac'] = {
    post: {
      summary: 'Generate HMAC signature for text',
      operationId: 'hmacSign',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['text', 'key'],
              properties: {
                text: { type: 'string', example: 'Hello World' },
                key: { type: 'string', example: 'my-secret-key' },
                algorithm: {
                  type: 'string',
                  enum: ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'],
                  default: 'SHA-256',
                  example: 'SHA-256'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'HMAC signature',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  signature: { type: 'string', example: 'a4b93e...' },
                  algorithm: { type: 'string', example: 'SHA-256' }
                }
              }
            }
          }
        }
      }
    }
  };

  paths['/security/hmac-verify'] = {
    post: {
      summary: 'Verify an HMAC signature',
      operationId: 'hmacVerify',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['text', 'key', 'signature'],
              properties: {
                text: { type: 'string', example: 'Hello World' },
                key: { type: 'string', example: 'my-secret-key' },
                signature: { type: 'string', example: 'a4b93e...' },
                algorithm: {
                  type: 'string',
                  enum: ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'],
                  default: 'SHA-256'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Verification result',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  valid: { type: 'boolean', example: true }
                }
              }
            }
          }
        }
      }
    }
  };

  paths['/security/password-strength'] = {
    post: {
      summary: 'Analyze password strength',
      operationId: 'passwordStrength',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['password'],
              properties: {
                password: { type: 'string', example: 'MyP@ssw0rd!2026' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Password strength analysis',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  score: { type: 'integer', example: 4 },
                  level: { type: 'string', example: 'strong' },
                  entropy: { type: 'integer', example: 78 },
                  checks: {
                    type: 'object',
                    properties: {
                      length: { type: 'boolean' },
                      uppercase: { type: 'boolean' },
                      lowercase: { type: 'boolean' },
                      numbers: { type: 'boolean' },
                      symbols: { type: 'boolean' }
                    }
                  },
                  suggestions: {
                    type: 'array',
                    items: { type: 'string' },
                    example: []
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  paths['/security/csp'] = {
    post: {
      summary: 'Generate a Content-Security-Policy header',
      operationId: 'generateCsp',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                defaultSrc: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ["'self'"]
                },
                scriptSrc: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ["'self'", "https://cdn.example.com"]
                },
                styleSrc: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ["'self'", "'unsafe-inline'"]
                },
                imgSrc: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ["*"]
                },
                fontSrc: {
                  type: 'array',
                  items: { type: 'string' }
                },
                connectSrc: {
                  type: 'array',
                  items: { type: 'string' }
                },
                mediaSrc: {
                  type: 'array',
                  items: { type: 'string' }
                },
                objectSrc: {
                  type: 'array',
                  items: { type: 'string' }
                },
                frameSrc: {
                  type: 'array',
                  items: { type: 'string' }
                },
                baseUri: {
                  type: 'array',
                  items: { type: 'string' }
                },
                formAction: {
                  type: 'array',
                  items: { type: 'string' }
                },
                frameAncestors: {
                  type: 'array',
                  items: { type: 'string' }
                },
                upgradeInsecureRequests: {
                  type: 'boolean'
                },
                blockAllMixedContent: {
                  type: 'boolean'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Generated CSP header',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  header: { type: 'string', example: 'Content-Security-Policy' },
                  value: { type: 'string', example: "default-src 'self'; script-src 'self' https://cdn.example.com" },
                  directives: { type: 'object' }
                }
              }
            }
          }
        }
      }
    }
  };

  paths['/security/analyze-headers'] = {
    post: {
      summary: 'Analyze HTTP security headers',
      operationId: 'analyzeSecurityHeaders',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['headers'],
              properties: {
                headers: {
                  type: 'object',
                  description: 'HTTP response headers to analyze',
                  example: {
                    'Content-Security-Policy': "default-src 'self'",
                    'X-Frame-Options': 'DENY',
                    'X-Content-Type-Options': 'nosniff',
                    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Security header analysis',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  score: { type: 'integer', example: 70 },
                  total: { type: 'integer', example: 100 },
                  grade: { type: 'string', example: 'B' },
                  results: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        header: { type: 'string' },
                        present: { type: 'boolean' },
                        value: { type: 'string' },
                        score: { type: 'integer' },
                        recommendation: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  return paths;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const raw = fs.readFileSync(SPEC_PATH, 'utf-8');
  const spec = JSON.parse(raw);

  // Update description to include new categories
  spec.info.description =
    'All-in-one developer toolkit API: text processing, string case conversion, JSON utilities, ' +
    'color manipulation, number formatting, unit conversion, data transformation, validation, ' +
    'encoding/decoding (URL, HTML, ROT13, Morse, binary, hex, base conversion), ' +
    'fake test data generation, security utilities (HMAC, password strength, CSP, header analysis), ' +
    'random data generation, date/time, regex, and IP/network utilities.';

  // Merge new paths
  const newPaths = buildNewPaths();
  let added = 0;
  for (const [pathKey, pathDef] of Object.entries(newPaths)) {
    if (spec.paths[pathKey]) {
      // If the path already exists, merge methods (e.g., add GET to existing POST)
      for (const [method, methodDef] of Object.entries(pathDef)) {
        if (!spec.paths[pathKey][method]) {
          spec.paths[pathKey][method] = methodDef;
          console.log('  Added ' + method.toUpperCase() + ' to existing path: ' + pathKey);
          added++;
        } else {
          console.log('  Skipped (already exists): ' + method.toUpperCase() + ' ' + pathKey);
        }
      }
    } else {
      spec.paths[pathKey] = pathDef;
      const methods = Object.keys(pathDef).map(m => m.toUpperCase()).join(', ');
      console.log('  Added new path: ' + pathKey + ' [' + methods + ']');
      added++;
    }
  }

  // Write back
  const output = JSON.stringify(spec, null, 2) + '\n';
  fs.writeFileSync(SPEC_PATH, output, 'utf-8');

  // Count paths (excluding /health, /, /openapi.json)
  const excludePaths = new Set(['/health', '/', '/openapi.json']);
  const allPaths = Object.keys(spec.paths).filter(p => !excludePaths.has(p));

  console.log('\nDone. Added ' + added + ' new path entries.');
  console.log('Total paths in spec (excluding /health, /, /openapi.json): ' + allPaths.length);
  console.log('Total paths in spec (all): ' + Object.keys(spec.paths).length);
}

main();
