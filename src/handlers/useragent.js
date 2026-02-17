// User-Agent parser — zero dependencies, regex-based detection

/**
 * Parse a user-agent string into structured components.
 * @param {string} ua — user-agent string
 */
export function parseUserAgent(ua) {
  if (!ua) throw new Error('"ua" (user-agent string) is required');

  const browser = detectBrowser(ua);
  const os = detectOS(ua);
  const device = detectDevice(ua);
  const engine = detectEngine(ua);
  const isBot = detectBot(ua);

  return {
    ua,
    browser,
    os,
    device,
    engine,
    isBot: isBot.isBot,
    bot: isBot.isBot ? isBot : undefined,
  };
}

/**
 * Check if a user-agent is a known bot/crawler.
 * @param {string} ua — user-agent string
 */
export function isBot(ua) {
  if (!ua) throw new Error('"ua" (user-agent string) is required');
  return detectBot(ua);
}

/**
 * Compare two user-agent strings.
 * @param {string} ua1 — first user-agent
 * @param {string} ua2 — second user-agent
 */
export function compareUserAgents(ua1, ua2) {
  if (!ua1 || !ua2) throw new Error('Both "ua1" and "ua2" are required');
  const parsed1 = parseUserAgent(ua1);
  const parsed2 = parseUserAgent(ua2);

  return {
    ua1: parsed1,
    ua2: parsed2,
    sameBrowser: parsed1.browser.name === parsed2.browser.name,
    sameOS: parsed1.os.name === parsed2.os.name,
    sameDevice: parsed1.device.type === parsed2.device.type,
    sameEngine: parsed1.engine.name === parsed2.engine.name,
  };
}

// --- Internal detection functions ---

function detectBrowser(ua) {
  // Order matters — more specific patterns first
  const browsers = [
    // Chromium-based browsers (before Chrome)
    { name: 'Edge', pattern: /Edg(?:e|A|iOS)?\/(\d+[\d.]*)/ },
    { name: 'Opera', pattern: /(?:OPR|Opera)\/(\d+[\d.]*)/ },
    { name: 'Brave', pattern: /Brave\/(\d+[\d.]*)/ },
    { name: 'Vivaldi', pattern: /Vivaldi\/(\d+[\d.]*)/ },
    { name: 'Samsung Internet', pattern: /SamsungBrowser\/(\d+[\d.]*)/ },
    { name: 'UC Browser', pattern: /UCBrowser\/(\d+[\d.]*)/ },
    { name: 'Yandex', pattern: /YaBrowser\/(\d+[\d.]*)/ },
    // Firefox variants
    { name: 'Firefox Focus', pattern: /Focus\/(\d+[\d.]*)/ },
    { name: 'Firefox', pattern: /Firefox\/(\d+[\d.]*)/ },
    // Safari (before Chrome, since Chrome also has Safari in UA)
    { name: 'Safari', pattern: /Version\/(\d+[\d.]*).*Safari/, test: (ua) => !ua.includes('Chrome') && !ua.includes('Chromium') },
    // Chrome last (most generic Chromium-based match)
    { name: 'Chrome', pattern: /(?:Chrome|CriOS)\/(\d+[\d.]*)/ },
    // IE
    { name: 'IE', pattern: /(?:MSIE |Trident.*rv:)(\d+[\d.]*)/ },
  ];

  for (const { name, pattern, test } of browsers) {
    if (test && !test(ua)) continue;
    const match = ua.match(pattern);
    if (match) {
      return { name, version: match[1], major: parseInt(match[1], 10) };
    }
  }

  return { name: 'Unknown', version: null, major: null };
}

function detectOS(ua) {
  const osPatterns = [
    { name: 'iOS', pattern: /(?:iPhone|iPad|iPod).*OS (\d+[_\d]*)/, normalize: v => v.replace(/_/g, '.') },
    { name: 'macOS', pattern: /Mac OS X (\d+[_\d.]*)/, normalize: v => v.replace(/_/g, '.') },
    { name: 'Android', pattern: /Android (\d+[\d.]*)/ },
    { name: 'Windows', pattern: /Windows NT (\d+\.\d+)/, versionMap: {
      '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': 'Vista', '5.1': 'XP',
    }},
    { name: 'Chrome OS', pattern: /CrOS \w+ (\d+[\d.]*)/ },
    { name: 'Linux', pattern: /Linux/, version: null },
    { name: 'Ubuntu', pattern: /Ubuntu/ },
    { name: 'Fedora', pattern: /Fedora/ },
  ];

  for (const { name, pattern, normalize, versionMap, version } of osPatterns) {
    const match = ua.match(pattern);
    if (match) {
      let ver = version !== undefined ? version : (match[1] || null);
      if (ver && normalize) ver = normalize(ver);
      const displayVer = (versionMap && ver) ? (versionMap[ver] || ver) : ver;
      return { name, version: displayVer };
    }
  }

  return { name: 'Unknown', version: null };
}

function detectDevice(ua) {
  // Tablets first (before mobile, since some tablets have "Mobile" in UA)
  if (/iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    return { type: 'tablet', brand: detectBrand(ua) };
  }
  if (/iPhone|iPod/i.test(ua) || (/Android/i.test(ua) && /Mobile/i.test(ua)) || /Windows Phone/i.test(ua) || /BlackBerry/i.test(ua)) {
    return { type: 'mobile', brand: detectBrand(ua) };
  }
  if (/Smart-?TV|BRAVIA|webOS|Tizen|Roku|AppleTV|FireTV/i.test(ua)) {
    return { type: 'tv', brand: detectBrand(ua) };
  }
  if (/bot|crawler|spider|scraper|headless/i.test(ua)) {
    return { type: 'bot', brand: null };
  }
  return { type: 'desktop', brand: detectBrand(ua) };
}

function detectBrand(ua) {
  if (/iPhone|iPad|iPod|Macintosh/i.test(ua)) return 'Apple';
  if (/Samsung/i.test(ua)) return 'Samsung';
  if (/Huawei|HONOR/i.test(ua)) return 'Huawei';
  if (/Xiaomi|Redmi|POCO/i.test(ua)) return 'Xiaomi';
  if (/OPPO/i.test(ua)) return 'OPPO';
  if (/vivo/i.test(ua)) return 'Vivo';
  if (/OnePlus/i.test(ua)) return 'OnePlus';
  if (/Pixel/i.test(ua)) return 'Google';
  if (/LG/i.test(ua)) return 'LG';
  if (/Sony/i.test(ua)) return 'Sony';
  if (/Nokia/i.test(ua)) return 'Nokia';
  return null;
}

function detectEngine(ua) {
  const engines = [
    { name: 'Blink', pattern: /Chrome\/(\d+)/, test: (ua) => !ua.includes('Edge/') },
    { name: 'EdgeHTML', pattern: /Edge\/(\d+)/ },
    { name: 'Gecko', pattern: /Gecko\/(\d+)/ },
    { name: 'WebKit', pattern: /AppleWebKit\/(\d+[\d.]*)/ },
    { name: 'Trident', pattern: /Trident\/(\d+[\d.]*)/ },
    { name: 'Presto', pattern: /Presto\/(\d+[\d.]*)/ },
  ];

  for (const { name, pattern, test } of engines) {
    if (test && !test(ua)) continue;
    const match = ua.match(pattern);
    if (match) {
      return { name, version: match[1] };
    }
  }

  return { name: 'Unknown', version: null };
}

function detectBot(ua) {
  const bots = [
    { name: 'Googlebot', pattern: /Googlebot\/(\d+[\d.]*)/ },
    { name: 'Googlebot Images', pattern: /Googlebot-Image/ },
    { name: 'Googlebot Video', pattern: /Googlebot-Video/ },
    { name: 'Google AdsBot', pattern: /AdsBot-Google/ },
    { name: 'Bingbot', pattern: /bingbot\/(\d+[\d.]*)/ },
    { name: 'Slurp', pattern: /Slurp/ },
    { name: 'DuckDuckBot', pattern: /DuckDuckBot/ },
    { name: 'Baiduspider', pattern: /Baiduspider/ },
    { name: 'YandexBot', pattern: /YandexBot\/(\d+[\d.]*)/ },
    { name: 'Sogou', pattern: /Sogou/ },
    { name: 'Facebook', pattern: /facebookexternalhit/ },
    { name: 'Twitter', pattern: /Twitterbot/ },
    { name: 'LinkedIn', pattern: /LinkedInBot/ },
    { name: 'WhatsApp', pattern: /WhatsApp/ },
    { name: 'Telegram', pattern: /TelegramBot/ },
    { name: 'Discord', pattern: /Discordbot/ },
    { name: 'Slack', pattern: /Slackbot/ },
    { name: 'Pinterest', pattern: /Pinterest/ },
    { name: 'Applebot', pattern: /Applebot/ },
    { name: 'Archive.org', pattern: /archive\.org_bot/ },
    { name: 'Screaming Frog', pattern: /Screaming Frog/ },
    { name: 'SEMrush', pattern: /SemrushBot/ },
    { name: 'Ahrefs', pattern: /AhrefsBot/ },
    { name: 'Majestic', pattern: /MJ12bot/ },
    { name: 'Moz', pattern: /DotBot/ },
    { name: 'Uptimerobot', pattern: /UptimeRobot/ },
    { name: 'Pingdom', pattern: /Pingdom/ },
    { name: 'Lighthouse', pattern: /Chrome-Lighthouse/ },
    { name: 'PageSpeed', pattern: /Google Page Speed/ },
    { name: 'GTmetrix', pattern: /GTmetrix/ },
    { name: 'ChatGPT', pattern: /ChatGPT-User|GPTBot/ },
    { name: 'Claude', pattern: /ClaudeBot|Claude-Web/ },
    { name: 'Perplexity', pattern: /PerplexityBot/ },
    { name: 'Common Crawl', pattern: /CCBot/ },
  ];

  // Generic bot detection
  const genericBot = /bot|crawler|spider|scraper|headless|phantom|selenium|puppeteer|playwright|wget|curl|fetch|http|crawl/i;

  for (const { name, pattern } of bots) {
    const match = ua.match(pattern);
    if (match) {
      return {
        isBot: true,
        name,
        category: categorizBot(name),
      };
    }
  }

  if (genericBot.test(ua)) {
    return { isBot: true, name: 'Unknown Bot', category: 'other' };
  }

  return { isBot: false };
}

function categorizBot(name) {
  const search = ['Googlebot', 'Googlebot Images', 'Googlebot Video', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot', 'Sogou', 'Applebot'];
  const social = ['Facebook', 'Twitter', 'LinkedIn', 'WhatsApp', 'Telegram', 'Discord', 'Slack', 'Pinterest'];
  const seo = ['Screaming Frog', 'SEMrush', 'Ahrefs', 'Majestic', 'Moz'];
  const monitoring = ['Uptimerobot', 'Pingdom', 'Lighthouse', 'PageSpeed', 'GTmetrix'];
  const ai = ['ChatGPT', 'Claude', 'Perplexity', 'Common Crawl'];
  const ads = ['Google AdsBot'];

  if (search.includes(name)) return 'search';
  if (social.includes(name)) return 'social';
  if (seo.includes(name)) return 'seo';
  if (monitoring.includes(name)) return 'monitoring';
  if (ai.includes(name)) return 'ai';
  if (ads.includes(name)) return 'ads';
  return 'other';
}
