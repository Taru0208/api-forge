import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseUserAgent, isBot, compareUserAgents } from './useragent.js';

describe('User-Agent Parser', () => {
  describe('parseUserAgent', () => {
    it('throws on missing input', () => {
      assert.throws(() => parseUserAgent(''), /required/);
      assert.throws(() => parseUserAgent(null), /required/);
    });

    it('parses Chrome on Windows', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const result = parseUserAgent(ua);
      assert.equal(result.browser.name, 'Chrome');
      assert.equal(result.browser.major, 120);
      assert.equal(result.os.name, 'Windows');
      assert.equal(result.device.type, 'desktop');
      assert.equal(result.engine.name, 'Blink');
      assert.equal(result.isBot, false);
    });

    it('parses Firefox on Linux', () => {
      const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0';
      const result = parseUserAgent(ua);
      assert.equal(result.browser.name, 'Firefox');
      assert.equal(result.browser.major, 119);
      assert.equal(result.os.name, 'Linux');
      assert.equal(result.device.type, 'desktop');
      assert.equal(result.engine.name, 'Gecko');
    });

    it('parses Safari on macOS', () => {
      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15';
      const result = parseUserAgent(ua);
      assert.equal(result.browser.name, 'Safari');
      assert.equal(result.browser.major, 17);
      assert.equal(result.os.name, 'macOS');
      assert.equal(result.os.version, '10.15.7');
      assert.equal(result.device.type, 'desktop');
      assert.equal(result.device.brand, 'Apple');
    });

    it('parses Edge on Windows', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91';
      const result = parseUserAgent(ua);
      assert.equal(result.browser.name, 'Edge');
      assert.equal(result.os.name, 'Windows');
    });

    it('parses Chrome on Android mobile', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36';
      const result = parseUserAgent(ua);
      assert.equal(result.browser.name, 'Chrome');
      assert.equal(result.os.name, 'Android');
      assert.equal(result.os.version, '14');
      assert.equal(result.device.type, 'mobile');
      assert.equal(result.device.brand, 'Google');
    });

    it('parses Safari on iPhone', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';
      const result = parseUserAgent(ua);
      assert.equal(result.browser.name, 'Safari');
      assert.equal(result.os.name, 'iOS');
      assert.equal(result.os.version, '17.1.2');
      assert.equal(result.device.type, 'mobile');
      assert.equal(result.device.brand, 'Apple');
    });

    it('parses iPad as tablet', () => {
      const ua = 'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';
      const result = parseUserAgent(ua);
      assert.equal(result.device.type, 'tablet');
      assert.equal(result.device.brand, 'Apple');
      assert.equal(result.os.name, 'iOS');
    });

    it('parses Android tablet (no Mobile keyword)', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const result = parseUserAgent(ua);
      assert.equal(result.device.type, 'tablet');
    });

    it('parses Samsung Internet', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36';
      const result = parseUserAgent(ua);
      assert.equal(result.browser.name, 'Samsung Internet');
      assert.equal(result.device.brand, 'Samsung');
    });

    it('parses Opera', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0';
      const result = parseUserAgent(ua);
      assert.equal(result.browser.name, 'Opera');
    });

    it('parses Internet Explorer 11', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko';
      const result = parseUserAgent(ua);
      assert.equal(result.browser.name, 'IE');
      assert.equal(result.browser.major, 11);
      assert.equal(result.engine.name, 'Trident');
    });

    it('parses Vivaldi', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Vivaldi/6.4.3160.47';
      const result = parseUserAgent(ua);
      assert.equal(result.browser.name, 'Vivaldi');
    });

    it('parses Yandex Browser', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 YaBrowser/24.1.0.0 Safari/537.36';
      const result = parseUserAgent(ua);
      assert.equal(result.browser.name, 'Yandex');
    });

    it('detects Chrome OS', () => {
      const ua = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const result = parseUserAgent(ua);
      assert.equal(result.os.name, 'Chrome OS');
    });

    it('returns Unknown for unrecognized UA', () => {
      const result = parseUserAgent('SomeRandomAgent/1.0');
      assert.equal(result.browser.name, 'Unknown');
      assert.equal(result.os.name, 'Unknown');
    });

    it('detects Xiaomi brand', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 13; Redmi Note 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
      const result = parseUserAgent(ua);
      assert.equal(result.device.brand, 'Xiaomi');
    });
  });

  describe('isBot', () => {
    it('throws on missing input', () => {
      assert.throws(() => isBot(''), /required/);
    });

    it('detects Googlebot', () => {
      const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      const result = isBot(ua);
      assert.equal(result.isBot, true);
      assert.equal(result.name, 'Googlebot');
      assert.equal(result.category, 'search');
    });

    it('detects Bingbot', () => {
      const ua = 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';
      const result = isBot(ua);
      assert.equal(result.isBot, true);
      assert.equal(result.name, 'Bingbot');
      assert.equal(result.category, 'search');
    });

    it('detects GPTBot', () => {
      const ua = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)';
      const result = isBot(ua);
      assert.equal(result.isBot, true);
      assert.equal(result.name, 'ChatGPT');
      assert.equal(result.category, 'ai');
    });

    it('detects ClaudeBot', () => {
      const ua = 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +https://anthropic.com/claude-bot)';
      const result = isBot(ua);
      assert.equal(result.isBot, true);
      assert.equal(result.name, 'Claude');
      assert.equal(result.category, 'ai');
    });

    it('detects Facebook crawler', () => {
      const ua = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
      const result = isBot(ua);
      assert.equal(result.isBot, true);
      assert.equal(result.name, 'Facebook');
      assert.equal(result.category, 'social');
    });

    it('detects SEMrush', () => {
      const ua = 'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)';
      const result = isBot(ua);
      assert.equal(result.isBot, true);
      assert.equal(result.name, 'SEMrush');
      assert.equal(result.category, 'seo');
    });

    it('detects generic bot patterns', () => {
      const ua = 'my-custom-crawler/1.0';
      const result = isBot(ua);
      assert.equal(result.isBot, true);
      assert.equal(result.name, 'Unknown Bot');
    });

    it('identifies normal browsers as not bot', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const result = isBot(ua);
      assert.equal(result.isBot, false);
    });

    it('detects Lighthouse', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome-Lighthouse Chrome/98.0.4695.0 Mobile Safari/537.36';
      const result = isBot(ua);
      assert.equal(result.isBot, true);
      assert.equal(result.name, 'Lighthouse');
      assert.equal(result.category, 'monitoring');
    });

    it('detects Discord bot', () => {
      const ua = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';
      const result = isBot(ua);
      assert.equal(result.isBot, true);
      assert.equal(result.name, 'Discord');
      assert.equal(result.category, 'social');
    });

    it('detects Ahrefs', () => {
      const ua = 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)';
      const result = isBot(ua);
      assert.equal(result.isBot, true);
      assert.equal(result.name, 'Ahrefs');
      assert.equal(result.category, 'seo');
    });
  });

  describe('compareUserAgents', () => {
    it('throws on missing input', () => {
      assert.throws(() => compareUserAgents('', 'test'), /required/);
      assert.throws(() => compareUserAgents('test', ''), /required/);
    });

    it('compares same browser different OS', () => {
      const ua1 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
      const ua2 = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
      const result = compareUserAgents(ua1, ua2);
      assert.equal(result.sameBrowser, true);
      assert.equal(result.sameOS, false);
      assert.equal(result.sameDevice, true); // both desktop
    });

    it('compares desktop vs mobile', () => {
      const ua1 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
      const ua2 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 Version/17.1 Mobile/15E148 Safari/604.1';
      const result = compareUserAgents(ua1, ua2);
      assert.equal(result.sameBrowser, false);
      assert.equal(result.sameDevice, false);
    });
  });
});
