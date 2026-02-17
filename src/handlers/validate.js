// Validation utilities

export function validateEmail(email) {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const valid = pattern.test(email);
  let reason = null;
  if (!valid) {
    if (!email.includes('@')) reason = 'Missing @ symbol';
    else if (email.startsWith('@')) reason = 'Missing local part';
    else if (email.endsWith('@')) reason = 'Missing domain';
    else if (!/\.[a-zA-Z]{2,}$/.test(email)) reason = 'Invalid TLD';
    else reason = 'Invalid format';
  }
  const parts = email.split('@');
  const local = parts[0] || null;
  const domain = parts[1] || null;

  // Build suggestion for common typos
  let suggestion = null;
  if (domain) {
    const typoMap = {
      'gmial.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmai.com': 'gmail.com',
      'gnail.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmaill.com': 'gmail.com',
      'hotmal.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'hotmil.com': 'hotmail.com',
      'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'outlool.com': 'outlook.com',
      'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yhaoo.com': 'yahoo.com',
      'ymail.com': 'yahoo.com',
    };
    const corrected = typoMap[domain.toLowerCase()];
    if (corrected) suggestion = `${local}@${corrected}`;
  }

  return {
    valid,
    reason,
    local,
    domain,
    disposable: isDisposable(domain),
    role: isRole(local),
    free: isFreeProvider(domain),
    suggestion,
  };
}

// 468 disposable email domains (curated from disposable-email-domains/disposable-email-domains)
const DISPOSABLE_DOMAINS = new Set([
  '0-mail.com', '0box.eu', '10minutemail.be', '10minutemail.cf', '10minutemail.co.uk', '10minutemail.co.za',
  '10minutemail.com', '10minutemail.de', '10minutemail.ga', '10minutemail.gq', '10minutemail.ml', '10minutemail.net',
  '10minutemail.nl', '10minutemail.pro', '10minutemail.us', '10minutemailbox.com', '10minutemails.in', '10minutenemail.de',
  '10minutenmail.xyz', '10minutesmail.com', '10minutesmail.fr', '1secmail.com', '1secmail.net', '1secmail.org',
  '20minutemail.com', '30minutemail.com', '60minutemail.com', 'anon-mail.de', 'anonbox.net', 'anonmail.top',
  'anonmails.de', 'anonymail.dk', 'anonymbox.com', 'anonymized.org', 'anonymousness.com', 'anthony-junkmail.com',
  'antispam.de', 'antispam.fr.nf', 'antispam24.de', 'antispammail.de', 'best-temp-mail.com', 'besttempmail.com',
  'blogspam.ro', 'bluedumpling.info', 'boxtemp.com.br', 'bspamfree.org', 'burnthespam.info', 'chumpstakingdumps.com',
  'cool.fr.nf', 'courriel.fr.nf', 'crazymailing.com', 'cust.in', 'dacoolest.com', 'dandikmail.com', 'deadfake.cf',
  'deadfake.ga', 'deadfake.ml', 'deadfake.tk', 'despam.it', 'despammed.com', 'devnullmail.com', 'dfgh.net',
  'discardmail.com', 'discardmail.de', 'disposable.cf', 'disposable.ga', 'disposable.ml', 'disposableaddress.com',
  'disposableemailaddresses.emailmiser.com', 'disposableinbox.com', 'dispose.it', 'dispostable.com', 'dm.w3internet.co.uk',
  'dodgeit.com', 'dodgit.com', 'dontreg.com', 'dontsendmespam.de', 'drdrb.net', 'dump-email.info', 'dumpandjunk.com',
  'dumpmail.de', 'dumpyemail.com', 'e4ward.com', 'easytrashmail.com', 'einmalmail.de', 'einrot.com', 'eintagsmail.de',
  'email-fake.cf', 'email-fake.com', 'email-fake.ga', 'email-fake.gq', 'email-fake.ml', 'email-fake.tk',
  'email60.com', 'emaildienst.de', 'emailfake.com', 'emailgo.de', 'emailias.com', 'emailigo.de',
  'emailinfive.com', 'emaillime.com', 'emailmiser.com', 'emailondeck.com', 'emailproxsy.com', 'emails.ga',
  'emailsensei.com', 'emailspam.cf', 'emailspam.ga', 'emailspam.gq', 'emailspam.ml', 'emailspam.tk',
  'emailtemporario.com.br', 'emailthe.net', 'emailtmp.com', 'emailto.de', 'emailwarden.com', 'emailx.at.hm',
  'emailz.cf', 'emailz.ga', 'emailz.gq', 'emailz.ml', 'emz.net', 'enterto.com', 'ephemail.net',
  'etranquil.com', 'etranquil.net', 'etranquil.org', 'evopo.com', 'explodemail.com', 'express.net.ua',
  'eyepaste.com', 'fakeinbox.cf', 'fakeinbox.com', 'fakeinbox.ga', 'fakeinbox.gq', 'fakeinbox.ml', 'fakeinbox.tk',
  'fakemail.fr', 'fakemail.net', 'fakemailgenerator.com', 'fakemailz.com', 'fammix.com', 'fastacura.com',
  'filzmail.com', 'fixmail.tk', 'flyspam.com', 'fr33mail.info', 'frapmail.com', 'freundin.ru',
  'garliclife.com', 'get-mail.cf', 'get-mail.ga', 'get-mail.ml', 'get-mail.tk', 'get1mail.com',
  'get2mail.fr', 'getairmail.cf', 'getairmail.com', 'getairmail.ga', 'getairmail.gq', 'getairmail.ml', 'getairmail.tk',
  'getnada.com', 'gishpuppy.com', 'goemailgo.com', 'gotmail.net', 'gotmail.org', 'gowikibooks.com',
  'great-host.in', 'greensloth.com', 'grr.la', 'gsrv.co.uk', 'guerrilla-mail.biz', 'guerrilla-mail.com',
  'guerrilla-mail.de', 'guerrilla-mail.info', 'guerrilla-mail.net', 'guerrilla-mail.org', 'guerrillamail.biz',
  'guerrillamail.com', 'guerrillamail.de', 'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamailblock.com', 'harakirimail.com', 'hat-gansen.de', 'hidemail.de', 'hidzz.com',
  'hmamail.com', 'hopemail.biz', 'ieh-mail.de', 'imails.info', 'inboxalias.com', 'inboxbear.com',
  'inboxclean.com', 'inboxclean.org', 'inboxkitten.com', 'incognitomail.com', 'incognitomail.net',
  'incognitomail.org', 'insorg-mail.info', 'instant-mail.de', 'ipoo.org', 'irish2me.com',
  'iwi.net', 'jetable.com', 'jetable.fr.nf', 'jetable.net', 'jetable.org', 'jnxjn.com',
  'jourrapide.com', 'junkmail.ga', 'junkmail.gq', 'kasmail.com', 'kaspop.com', 'keepmymail.com',
  'killmail.com', 'killmail.net', 'kingsq.ga', 'klzlk.com', 'koszmail.pl', 'kurzepost.de',
  'lawlita.com', 'letthemeatspam.com', 'lhsdv.com', 'lifebyfood.com', 'link2mail.net',
  'litedrop.com', 'lol.ovpn.to', 'lroid.com', 'lukop.dk', 'mail-temporaire.fr',
  'mail.tm', 'mail.zp.ua', 'mail4trash.com', 'mailbidon.com', 'mailblocks.com', 'mailbox52.ga',
  'mailcatch.com', 'mailde.de', 'mailde.info', 'maildrop.cc', 'maildrop.cf', 'maildrop.ga',
  'maildrop.gq', 'maildrop.ml', 'maildx.com', 'maileater.com', 'mailed.in', 'mailexpire.com',
  'mailfa.tk', 'mailforspam.com', 'mailfree.ga', 'mailfree.gq', 'mailfree.ml', 'mailfreeonline.com',
  'mailguard.me', 'mailhazard.com', 'mailhazard.us', 'mailhz.me', 'mailimate.com',
  'mailin8r.com', 'mailinater.com', 'mailinator.com', 'mailinator.gq', 'mailinator.net',
  'mailinator.org', 'mailinator.us', 'mailinator2.com', 'mailinbox.cf', 'mailinbox.co',
  'mailinbox.ga', 'mailinbox.gq', 'mailinbox.ml', 'mailismagic.com', 'mailjunk.cf', 'mailjunk.ga',
  'mailjunk.gq', 'mailjunk.ml', 'mailjunk.tk', 'mailmate.com', 'mailme.gq', 'mailme.ir',
  'mailme.lv', 'mailmetrash.com', 'mailmoat.com', 'mailnator.com', 'mailnesia.com',
  'mailnull.com', 'mailorg.org', 'mailpick.biz', 'mailproxsy.com', 'mailquack.com',
  'mailrock.biz', 'mailsac.com', 'mailscrap.com', 'mailshell.com', 'mailsiphon.com',
  'mailslapping.com', 'mailslite.com', 'mailtemp.info', 'mailtothis.com', 'mailtrash.net',
  'mailtv.net', 'mailtv.tv', 'mailzilla.com', 'mailzilla.org', 'mailzilla.orgmbx.cc',
  'makemetheking.com', 'manifestgenerator.com', 'meltmail.com', 'mezimages.net',
  'ministry-of-silly-walks.de', 'mintemail.com', 'minuteinbox.com', 'miodonski.ch',
  'moakt.com', 'mobi.web.id', 'mohmal.com', 'mohmal.im', 'mohmal.in', 'mohmal.tech',
  'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf', 'mt2015.com', 'mx0.wwwnew.eu',
  'myalias.pw', 'mynetstore.de', 'mypartyclip.de', 'myrx.in', 'myspamless.com',
  'mytemp.email', 'mytempemail.com', 'mytrashmail.com', 'nabala.com', 'neverbox.com',
  'no-spam.ws', 'nobulk.com', 'noclickemail.com', 'nogmailspam.info', 'nomail.ch',
  'nomail.xl.cx', 'nomorespamemails.com', 'nonspam.eu', 'nonspammer.de', 'noref.in',
  'nospam.wins.com.br', 'nospam.ze.tc', 'nospam4.us', 'nospamfor.us', 'nospammail.net',
  'nospamthanks.info', 'nothingtoseehere.ca', 'nurfuerspam.de', 'nwldx.com',
  'objectmail.com', 'obobbo.com', 'onewaymail.com', 'oopi.org', 'ordinaryamerican.net',
  'otherinbox.com', 'ourklips.com', 'outlawspam.com', 'ovpn.to', 'owlpic.com',
  'pancakemail.com', 'pimpedupmyspace.com', 'plexolan.de', 'pookmail.com', 'privacy.net',
  'privy-mail.com', 'privymail.de', 'promailtorg.com', 'punkass.com', 'putthisinyouremail.com',
  'quickinbox.com', 'rcpt.at', 'reallymymail.com', 'recode.me', 'recursor.net',
  'recyclemail.dk', 'regbypass.com', 'rhyta.com', 'rklips.com', 'rmqkr.net',
  'royal.net', 'rppkn.com', 'rtrtr.com', 's0ny.net', 'safe-mail.net',
  'safersignup.de', 'safetymail.info', 'sandelf.de', 'scatmail.com', 'schafmail.de',
  'selfdestructingmail.com', 'sendspamhere.com', 'sharklasers.com', 'shieldedmail.com',
  'shiftmail.com', 'shitmail.me', 'shitware.nl', 'shortmail.net', 'sibmail.com',
  'skeefmail.com', 'slaskpost.se', 'slipry.net', 'slopsbox.com', 'smashmail.de',
  'smellfear.com', 'snakemail.com', 'sneakemail.com', 'snkmail.com', 'sofimail.com',
  'sofort-mail.de', 'softpls.asia', 'sogetthis.com', 'soodonims.com', 'spam.la',
  'spam.su', 'spam4.me', 'spamavert.com', 'spambob.com', 'spambob.net', 'spambob.org',
  'spambog.com', 'spambog.de', 'spambog.ru', 'spambox.info', 'spambox.irishspringrealty.com',
  'spambox.us', 'spamcannon.com', 'spamcannon.net', 'spamcero.com', 'spamcon.org',
  'spamcorptastic.com', 'spamcowboy.com', 'spamcowboy.net', 'spamcowboy.org',
  'spamday.com', 'spamex.com', 'spamfighter.cf', 'spamfighter.ga', 'spamfighter.gq',
  'spamfighter.ml', 'spamfighter.tk', 'spamfree.eu', 'spamfree24.com', 'spamfree24.de',
  'spamfree24.eu', 'spamfree24.info', 'spamfree24.net', 'spamfree24.org', 'spamgoes.in',
  'spamherelots.com', 'spamhereplease.com', 'spamhole.com', 'spamify.com', 'spaminator.de',
  'spamkill.info', 'spaml.com', 'spaml.de', 'spammotel.com', 'spamobox.com',
  'spamoff.de', 'spamslicer.com', 'spamspot.com', 'spamstack.net', 'spamtrail.com',
  'spamtrap.ro', 'speed.1s.fr', 'spoofmail.de', 'squizzy.de', 'sry.li',
  'supermailer.jp', 'superrito.com', 'superstachel.de', 'suremail.info',
  'tafmail.com', 'tagyoureit.com', 'tapi.re', 'teewars.org', 'temp-mail.de',
  'temp-mail.org', 'temp-mail.ru', 'tempalias.com', 'tempe4mail.com', 'tempinbox.co.uk',
  'tempinbox.com', 'tempmail.co', 'tempmail.com', 'tempmail.de', 'tempmail.eu',
  'tempmail.io', 'tempmail.it', 'tempmail.us', 'tempmail2.com', 'tempmaildemo.com',
  'tempmailer.com', 'tempmailer.de', 'tempmailid.com', 'templiq.com', 'tempomail.fr',
  'temporarily.de', 'temporarioemail.com.br', 'temporaryemail.net', 'temporaryemail.us',
  'temporaryforwarding.com', 'temporaryinbox.com', 'temporarymailaddress.com',
  'tempthe.net', 'thankyou2010.com', 'thecloudindex.com', 'thinktempmail.com',
  'thismail.net', 'throwam.com', 'throwaway.email', 'throwawayemailaddress.com',
  'throwawaymail.com', 'tmail.ws', 'tmailinator.com', 'tmpmail.net', 'tmpmail.org',
  'toiea.com', 'toomail.biz', 'trash-amil.com', 'trash-mail.at', 'trash-mail.cf',
  'trash-mail.com', 'trash-mail.de', 'trash-mail.ga', 'trash-mail.gq', 'trash-mail.ml',
  'trash-mail.tk', 'trash-me.com', 'trash2009.com', 'trashdevil.com', 'trashdevil.de',
  'trashemail.de', 'trashmail.at', 'trashmail.com', 'trashmail.de', 'trashmail.ga',
  'trashmail.gq', 'trashmail.io', 'trashmail.me', 'trashmail.ml', 'trashmail.net',
  'trashmail.org', 'trashmail.tk', 'trashmail.ws', 'trashmailer.com', 'trashymail.com',
  'trashymail.net', 'trbvm.com', 'turual.com', 'twinmail.de', 'tyldd.com',
  'uggsrock.com', 'upliftnow.com', 'urlgenrator.com', 'veryrealemail.com',
  'vomvos.com', 'vpn.st', 'vsimcard.com', 'vubby.com', 'wasteland.rfc822.org',
  'wetrainbayarea.com', 'wetrainbayarea.org', 'wh4f.org', 'whatiaas.com',
  'whatpaas.com', 'widaryanto.info', 'wimsg.com', 'wollan.info', 'wronghead.com',
  'wuzup.net', 'wuzupmail.net', 'xagloo.com', 'xemaps.com', 'xjoi.com',
  'xoxy.net', 'yapped.net', 'yep.it', 'yogamaven.com', 'yomail.info',
  'yopmail.com', 'yopmail.fr', 'yopmail.gq', 'yopmail.net', 'yordanmail.cf',
  'you-spam.com', 'youmailr.com', 'ypmail.webarnak.fr.eu.org', 'yui.it',
  'zehnminutenmail.de', 'zippymail.info', 'zoaxe.com', 'zoemail.org',
]);

// Common role-based email prefixes (not personal accounts)
const ROLE_PREFIXES = new Set([
  'admin', 'administrator', 'webmaster', 'postmaster', 'hostmaster', 'info', 'support',
  'sales', 'marketing', 'abuse', 'noc', 'security', 'devnull', 'noreply', 'no-reply',
  'mailer-daemon', 'nobody', 'www', 'uucp', 'ftp', 'news', 'usenet', 'billing',
  'help', 'contact', 'feedback', 'office', 'hr', 'jobs', 'careers', 'press', 'media',
  'team', 'hello', 'enquiries', 'enquiry', 'compliance', 'legal', 'privacy',
]);

// Well-known free email providers
const FREE_PROVIDERS = new Set([
  'gmail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.co.jp', 'yahoo.fr', 'yahoo.de',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.it',
  'outlook.com', 'outlook.co.uk', 'live.com', 'live.co.uk', 'msn.com',
  'aol.com', 'mail.com', 'email.com', 'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'pm.me', 'tutanota.com', 'tuta.io',
  'zoho.com', 'yandex.com', 'yandex.ru', 'mail.ru', 'gmx.com', 'gmx.de', 'gmx.net',
  'web.de', 'fastmail.com', 'hey.com', 'naver.com', 'daum.net', 'hanmail.net',
]);

function isDisposable(domain) {
  if (!domain) return false;
  const d = domain.toLowerCase();
  if (DISPOSABLE_DOMAINS.has(d)) return true;
  // Pattern match for common disposable naming conventions
  if (/^(temp|tmp|trash|fake|spam|junk|throw|disposable|burner|anon)\w*mail/i.test(d)) return true;
  if (/^\d+minute(s)?mail/i.test(d)) return true;
  return false;
}

function isRole(local) {
  if (!local) return false;
  return ROLE_PREFIXES.has(local.toLowerCase());
}

function isFreeProvider(domain) {
  if (!domain) return false;
  return FREE_PROVIDERS.has(domain.toLowerCase());
}

export function validateURL(url) {
  try {
    const parsed = new URL(url);
    return {
      valid: true,
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      port: parsed.port || null,
      path: parsed.pathname,
      query: parsed.search || null,
      hash: parsed.hash || null,
      isHTTPS: parsed.protocol === 'https:',
    };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

export function validateJSON(input) {
  try {
    const parsed = JSON.parse(input);
    const type = Array.isArray(parsed) ? 'array' : typeof parsed;
    return {
      valid: true,
      type,
      keyCount: type === 'object' ? Object.keys(parsed).length : null,
      length: type === 'array' ? parsed.length : null,
      pretty: JSON.stringify(parsed, null, 2),
    };
  } catch (e) {
    return { valid: false, reason: e.message };
  }
}

export function validateCreditCard(number) {
  const cleaned = number.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) return { valid: false, reason: 'Invalid length or characters' };

  // Luhn algorithm
  let sum = 0;
  let alternate = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let n = parseInt(cleaned[i], 10);
    if (alternate) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alternate = !alternate;
  }
  const luhnValid = sum % 10 === 0;

  let brand = 'unknown';
  if (/^4/.test(cleaned)) brand = 'visa';
  else if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) brand = 'mastercard';
  else if (/^3[47]/.test(cleaned)) brand = 'amex';
  else if (/^6(?:011|5)/.test(cleaned)) brand = 'discover';

  return { valid: luhnValid, brand, lastFour: cleaned.slice(-4) };
}

// VIN (Vehicle Identification Number) validation - ISO 3779
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const VIN_TRANSLITERATION = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};

const WMI_REGIONS = {
  A: 'Africa', B: 'Africa', C: 'Africa', D: 'Africa', E: 'Africa', F: 'Africa',
  G: 'Africa', H: 'Africa', J: 'Asia', K: 'Asia', L: 'Asia', M: 'Asia',
  N: 'Asia', P: 'Asia', R: 'Asia', S: 'Europe', T: 'Europe', U: 'Europe',
  V: 'Europe', W: 'Europe', X: 'Europe', Y: 'Europe', Z: 'Europe',
  1: 'North America', 2: 'North America', 3: 'North America', 4: 'North America', 5: 'North America',
  6: 'Oceania', 7: 'Oceania', 8: 'South America', 9: 'South America',
};

const WMI_COUNTRIES = {
  JA: 'Japan', JB: 'Japan', JC: 'Japan', JD: 'Japan', JE: 'Japan', JF: 'Japan',
  JG: 'Japan', JH: 'Japan', JK: 'Japan', JL: 'Japan', JM: 'Japan', JN: 'Japan',
  JP: 'Japan', JR: 'Japan', JS: 'Japan', JT: 'Japan', JU: 'Japan', JV: 'Japan',
  JW: 'Japan', JX: 'Japan', JY: 'Japan', JZ: 'Japan',
  KL: 'South Korea', KM: 'South Korea', KN: 'South Korea', KP: 'South Korea', KR: 'South Korea',
  LA: 'China', LB: 'China', LC: 'China', LD: 'China', LE: 'China', LF: 'China',
  LG: 'China', LH: 'China', LJ: 'China', LK: 'China', LL: 'China',
  MA: 'India', MB: 'India', MC: 'India', MD: 'India', ME: 'India',
  SA: 'United Kingdom', SB: 'United Kingdom', SC: 'United Kingdom', SD: 'United Kingdom', SE: 'United Kingdom', SF: 'United Kingdom', SG: 'United Kingdom', SH: 'United Kingdom', SJ: 'United Kingdom', SK: 'United Kingdom', SL: 'United Kingdom', SM: 'United Kingdom',
  VF: 'France', VG: 'France', VH: 'France', VJ: 'France', VK: 'France', VL: 'France', VM: 'France', VN: 'France', VR: 'France', VS: 'France',
  WA: 'Germany', WB: 'Germany', WC: 'Germany', WD: 'Germany', WE: 'Germany', WF: 'Germany', WG: 'Germany', WH: 'Germany', WJ: 'Germany', WK: 'Germany', WL: 'Germany', WM: 'Germany', WN: 'Germany', WP: 'Germany', WR: 'Germany', WS: 'Germany', WT: 'Germany', WU: 'Germany', WV: 'Germany', WW: 'Germany', WX: 'Germany', WY: 'Germany', WZ: 'Germany',
  YV: 'Sweden', YW: 'Sweden',
  ZA: 'Italy', ZB: 'Italy', ZC: 'Italy', ZD: 'Italy', ZE: 'Italy', ZF: 'Italy', ZG: 'Italy', ZH: 'Italy', ZJ: 'Italy', ZK: 'Italy', ZL: 'Italy', ZM: 'Italy', ZN: 'Italy', ZP: 'Italy', ZR: 'Italy',
  '1A': 'United States', '1B': 'United States', '1C': 'United States', '1D': 'United States', '1E': 'United States', '1F': 'United States', '1G': 'United States', '1H': 'United States', '1J': 'United States', '1K': 'United States', '1L': 'United States', '1M': 'United States', '1N': 'United States', '1P': 'United States', '1R': 'United States', '1S': 'United States', '1T': 'United States', '1U': 'United States', '1V': 'United States', '1W': 'United States', '1X': 'United States', '1Y': 'United States', '1Z': 'United States',
  '2A': 'Canada', '2B': 'Canada', '2C': 'Canada', '2D': 'Canada', '2E': 'Canada', '2F': 'Canada', '2G': 'Canada', '2H': 'Canada', '2J': 'Canada', '2K': 'Canada', '2L': 'Canada', '2M': 'Canada', '2N': 'Canada', '2P': 'Canada', '2R': 'Canada', '2S': 'Canada', '2T': 'Canada', '2U': 'Canada', '2V': 'Canada', '2W': 'Canada',
  '3A': 'Mexico', '3B': 'Mexico', '3C': 'Mexico', '3D': 'Mexico', '3E': 'Mexico', '3F': 'Mexico', '3G': 'Mexico', '3H': 'Mexico', '3J': 'Mexico', '3K': 'Mexico', '3L': 'Mexico', '3M': 'Mexico', '3N': 'Mexico', '3P': 'Mexico', '3R': 'Mexico',
  '9A': 'Brazil', '9B': 'Brazil', '9C': 'Brazil', '9D': 'Brazil', '9E': 'Brazil', '9F': 'Brazil',
};

export function validateVIN(vin) {
  if (!vin || typeof vin !== 'string') {
    return { valid: false, reason: 'VIN is required' };
  }

  const cleaned = vin.replace(/[\s-]/g, '').toUpperCase();

  // Must be 17 characters
  if (cleaned.length !== 17) {
    return { valid: false, reason: `VIN must be 17 characters, got ${cleaned.length}` };
  }

  // Must not contain I, O, Q
  if (/[IOQ]/.test(cleaned)) {
    return { valid: false, reason: 'VIN cannot contain I, O, or Q' };
  }

  // Must be alphanumeric
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned)) {
    return { valid: false, reason: 'Invalid characters in VIN' };
  }

  // Check digit (position 9) validation
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = cleaned[i];
    const value = ch >= '0' && ch <= '9' ? parseInt(ch, 10) : VIN_TRANSLITERATION[ch];
    if (value === undefined) {
      return { valid: false, reason: `Invalid character at position ${i + 1}: ${ch}` };
    }
    sum += value * VIN_WEIGHTS[i];
  }
  const remainder = sum % 11;
  const expectedCheck = remainder === 10 ? 'X' : String(remainder);
  const actualCheck = cleaned[8];
  const checkValid = expectedCheck === actualCheck;

  // Parse WMI (World Manufacturer Identifier)
  const wmi = cleaned.slice(0, 3);
  const vds = cleaned.slice(3, 9);
  const vis = cleaned.slice(9);
  const region = WMI_REGIONS[cleaned[0]] || 'Unknown';
  const country = WMI_COUNTRIES[cleaned.slice(0, 2)] || null;

  // Model year (position 10)
  const yearCode = cleaned[9];
  const modelYear = decodeModelYear(yearCode);

  return {
    valid: checkValid,
    reason: checkValid ? null : `Check digit mismatch: expected ${expectedCheck}, got ${actualCheck}`,
    vin: cleaned,
    wmi,
    vds,
    vis,
    checkDigit: actualCheck,
    expectedCheckDigit: expectedCheck,
    region,
    country,
    modelYear,
    plantCode: cleaned[10],
  };
}

function decodeModelYear(code) {
  const yearMap = {
    A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017,
    J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025,
    T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
    1: 2001, 2: 2002, 3: 2003, 4: 2004, 5: 2005, 6: 2006, 7: 2007, 8: 2008, 9: 2009,
  };
  return yearMap[code] || null;
}
