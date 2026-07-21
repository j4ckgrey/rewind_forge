import{fileURLToPath as __sdk_f}from'node:url';import{dirname as __sdk_d}from'node:path';const __filename=__sdk_f(import.meta.url);const __dirname=__sdk_d(__filename);
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/host.ts
function setForgeHost(host2) {
  _host = host2;
}
function getForgeHost() {
  if (!_host) {
    throw new Error(
      "Forge host not configured \u2014 call setForgeHost() before using the pipeline"
    );
  }
  return _host;
}
function hasForgeHost() {
  return _host !== null;
}
var _host;
var init_host = __esm({
  "src/host.ts"() {
    "use strict";
    _host = null;
  }
});

// src/log.ts
function sink() {
  return hasForgeHost() ? getForgeHost().logger : consoleLogger;
}
var consoleLogger, logger;
var init_log = __esm({
  "src/log.ts"() {
    "use strict";
    init_host();
    consoleLogger = {
      info: (c, m) => console.log(`[${c}] ${m}`),
      success: (c, m) => console.log(`[${c}] ${m}`),
      warn: (c, m) => console.warn(`[${c}] ${m}`),
      error: (c, m, e) => console.error(`[${c}] ${m}`, e ?? "")
    };
    logger = {
      info: (c, m) => sink().info(c, m),
      success: (c, m) => sink().success(c, m),
      warn: (c, m) => sink().warn(c, m),
      error: (c, m, e) => sink().error(c, m, e)
    };
  }
});

// node_modules/@viren070/parse-torrent-title/dist/types.js
var ValueSet;
var init_types = __esm({
  "node_modules/@viren070/parse-torrent-title/dist/types.js"() {
    "use strict";
    ValueSet = class {
      constructor() {
        this.existMap = /* @__PURE__ */ new Map();
        this._values = [];
      }
      append(v) {
        if (!this.existMap.has(v)) {
          this.existMap.set(v, true);
          this._values.push(v);
        }
        return this;
      }
      exists(v) {
        return this.existMap.has(v);
      }
      get values() {
        return this._values;
      }
    };
  }
});

// node_modules/@viren070/parse-torrent-title/dist/utils.js
function cleanTitle(rawTitle) {
  let title = rawTitle.trim();
  title = title.replace(/_/g, " ");
  title = title.replace(movieIndicatorRegex, "");
  title = title.replace(notAllowedSymbolsAtStartAndEndRegex, "");
  const russianMatches = title.match(russianCastRegex);
  if (russianMatches) {
    for (let i = 1; i < russianMatches.length; i++) {
      if (russianMatches[i]) {
        title = title.replace(russianMatches[i], "");
      }
    }
  }
  title = title.replace(releaseGroupMarkingAtStartRegex, "$1");
  title = title.replace(releaseGroupMarkingAtEndRegex, "$1");
  title = title.replace(altTitlesRegex, "");
  const notOnlyNonEnglishMatch = title.match(notOnlyNonEnglishRegex);
  if (notOnlyNonEnglishMatch) {
    for (let i = 1; i < notOnlyNonEnglishMatch.length; i++) {
      if (notOnlyNonEnglishMatch[i]) {
        title = title.replace(notOnlyNonEnglishMatch[i], "");
        break;
      }
    }
  }
  title = title.replace(remainingNotAllowedSymbolsAtStartAndEndRegex, "");
  if (!title.includes(" ") && title.includes(".")) {
    title = title.replace(/\./g, " ");
  }
  for (const [open, close] of brackets) {
    const openCount = (title.match(new RegExp("\\" + open, "g")) || []).length;
    const closeCount = (title.match(new RegExp("\\" + close, "g")) || []).length;
    if (openCount !== closeCount) {
      title = title.replace(new RegExp("\\" + open, "g"), "").replace(new RegExp("\\" + close, "g"), "");
    }
  }
  title = title.replace(redundantSymbolsAtEnd, "");
  title = title.replace(whitespacesRegex, " ");
  return title.trim();
}
function getMatchIndices(regex, str) {
  const match = regex.exec(str);
  if (!match)
    return [];
  const indices = [];
  indices.push(match.index, match.index + match[0].length);
  for (let i = 1; i < match.length; i++) {
    if (match[i] !== void 0) {
      const captureIndex = str.indexOf(match[i], match.index);
      indices.push(captureIndex, captureIndex + match[i].length);
    } else {
      indices.push(-1, -1);
    }
  }
  return indices;
}
var NON_ENGLISH_CHARS, russianCastRegex, altTitlesRegex, notOnlyNonEnglishRegex, notAllowedSymbolsAtStartAndEndRegex, remainingNotAllowedSymbolsAtStartAndEndRegex, movieIndicatorRegex, releaseGroupMarkingAtStartRegex, releaseGroupMarkingAtEndRegex, beforeTitleRegex, nonDigitsRegex, nonAlphasRegex, underscoresRegex, whitespacesRegex, redundantSymbolsAtEnd, trailingEpisodePattern, curlyBrackets, squareBrackets, parentheses, brackets;
var init_utils = __esm({
  "node_modules/@viren070/parse-torrent-title/dist/utils.js"() {
    "use strict";
    NON_ENGLISH_CHARS = "\\u3040-\\u309F\\u30A0-\\u30FF\\u4E00-\\u9FFF\\u0400-\\u04FF";
    russianCastRegex = new RegExp(`(\\([^)]*[${NON_ENGLISH_CHARS}][^)]*\\))$|(?:\\/.*?)(\\(.*\\))$`, "u");
    altTitlesRegex = new RegExp(`[^/|(]*[${NON_ENGLISH_CHARS}][^/|]*[/|]|[/|][^/|(]*[${NON_ENGLISH_CHARS}][^/|]*`, "gu");
    notOnlyNonEnglishRegex = new RegExp(`(?:[a-zA-Z][^${NON_ENGLISH_CHARS}]+)([${NON_ENGLISH_CHARS}].*[${NON_ENGLISH_CHARS}])|([${NON_ENGLISH_CHARS}].*[${NON_ENGLISH_CHARS}])(?:[^${NON_ENGLISH_CHARS}]+[a-zA-Z])`, "u");
    notAllowedSymbolsAtStartAndEndRegex = new RegExp(`^[^\\w${NON_ENGLISH_CHARS}#[\u3010\u2605]+|[ \\-:/\\\\[|{(#$&^]+$`, "gu");
    remainingNotAllowedSymbolsAtStartAndEndRegex = new RegExp(`^[^\\w${NON_ENGLISH_CHARS}#]+|[\\[\\]({} ]+$`, "gu");
    movieIndicatorRegex = /[[(]movie[)\]]/gi;
    releaseGroupMarkingAtStartRegex = /^[[【★].*[\]】★][ .]?(.+)/;
    releaseGroupMarkingAtEndRegex = /(.+)[ .]?[[【★].*[\]】★]$/;
    beforeTitleRegex = /^\[([^[\]]+)]/;
    nonDigitsRegex = /\D+/g;
    nonAlphasRegex = /\W+/g;
    underscoresRegex = /_+/g;
    whitespacesRegex = /\s+/g;
    redundantSymbolsAtEnd = /[ \-:./\\]+$/;
    trailingEpisodePattern = /[ .]+-[ .]*\d{1,4}[ .]*$/;
    curlyBrackets = ["{", "}"];
    squareBrackets = ["[", "]"];
    parentheses = ["(", ")"];
    brackets = [curlyBrackets, squareBrackets, parentheses];
  }
});

// node_modules/@viren070/parse-torrent-title/dist/parser.js
function hasValueSet(field) {
  return VALUE_SET_FIELDS.has(field);
}
function parse(title, handlers2) {
  const result = /* @__PURE__ */ new Map();
  title = title.replace(whitespacesRegex, " ");
  title = title.replace(underscoresRegex, " ");
  let endOfTitle = title.length;
  for (const handler of handlers2) {
    const field = handler.field;
    let skipFromTitle = handler.skipFromTitle ?? false;
    let m = result.get(field);
    const mFound = m !== void 0;
    if (handler.pattern) {
      if (mFound && !handler.keepMatching) {
        continue;
      }
      const idxs = getMatchIndices(handler.pattern, title);
      if (idxs.length === 0) {
        continue;
      }
      if (handler.validateMatch && !handler.validateMatch(title, idxs)) {
        continue;
      }
      let shouldSkip = false;
      if (handler.skipIfFirst) {
        let hasOther = false;
        let hasBefore = false;
        for (const [f, fm] of result) {
          if (f !== field && fm.mValue) {
            hasOther = true;
            if (idxs[0] >= fm.mIndex) {
              hasBefore = true;
              break;
            }
          }
        }
        shouldSkip = hasOther && !hasBefore;
      }
      if (shouldSkip) {
        continue;
      }
      if (handler.skipIfBefore && handler.skipIfBefore.length > 0) {
        for (const skipField of handler.skipIfBefore) {
          const fm = result.get(skipField);
          if (fm && idxs[0] < fm.mIndex) {
            shouldSkip = true;
            break;
          }
        }
        if (shouldSkip) {
          continue;
        }
      }
      const rawMatchedPart = title.substring(idxs[0], idxs[1]);
      let matchedPart = rawMatchedPart;
      if (idxs.length > 2) {
        if (handler.valueGroup === void 0 || handler.valueGroup === 0) {
          matchedPart = title.substring(idxs[2], idxs[3]);
        } else if (idxs.length > handler.valueGroup * 2) {
          matchedPart = title.substring(idxs[handler.valueGroup * 2], idxs[handler.valueGroup * 2 + 1]);
        }
      }
      const beforeTitleMatch = beforeTitleRegex.exec(title);
      if (beforeTitleMatch && beforeTitleMatch[0].includes(rawMatchedPart)) {
        skipFromTitle = true;
      }
      if (!mFound) {
        m = {
          mIndex: 0,
          mValue: "",
          value: hasValueSet(field) ? new ValueSet() : null,
          remove: false,
          processed: false
        };
        result.set(field, m);
      }
      if (m) {
        m.mIndex = idxs[0];
        m.mValue = rawMatchedPart;
        if (!hasValueSet(field)) {
          m.value = matchedPart;
        }
        if (handler.matchGroup) {
          m.mIndex = idxs[handler.matchGroup * 2];
          m.mValue = title.substring(idxs[handler.matchGroup * 2], idxs[handler.matchGroup * 2 + 1]);
        }
      }
    }
    if (handler.process) {
      if (mFound && m) {
        m = handler.process(title, m, result);
      } else {
        const emptyMeta = {
          mIndex: 0,
          mValue: "",
          value: null,
          remove: false,
          processed: false
        };
        m = handler.process(title, emptyMeta, result);
        if (m.value !== null) {
          result.set(field, m);
        }
      }
    }
    if (!m) {
      continue;
    }
    if (m.value !== null && handler.transform) {
      handler.transform(title, m, result);
    }
    if (m.value === null) {
      result.delete(field);
      continue;
    }
    if (!result.has(field) || m.processed && !handler.keepMatching && !hasValueSet(field)) {
      continue;
    }
    if (handler.remove || m.remove) {
      m.remove = true;
      title = title.substring(0, m.mIndex) + title.substring(m.mIndex + m.mValue.length);
    }
    if (!skipFromTitle && m.mIndex !== 0 && m.mIndex < endOfTitle) {
      endOfTitle = m.mIndex;
    }
    if (m.remove && (skipFromTitle || m.mIndex === 0) && m.mIndex < endOfTitle) {
      endOfTitle -= m.mValue.length;
    }
    m.remove = false;
    m.processed = true;
  }
  const finalResult = {};
  for (const [field, fieldMeta] of result) {
    const v = fieldMeta.value;
    switch (field) {
      case "audio":
        if (v instanceof ValueSet) {
          finalResult.audio = v.values;
        }
        break;
      case "bitDepth":
        finalResult.bitDepth = v;
        break;
      case "channels":
        if (v instanceof ValueSet) {
          finalResult.channels = v.values;
        }
        break;
      case "codec":
        finalResult.codec = v;
        break;
      case "commentary":
        finalResult.commentary = v;
        break;
      case "complete":
        finalResult.complete = v;
        break;
      case "container":
        finalResult.container = v;
        break;
      case "convert":
        finalResult.convert = v;
        break;
      case "date":
        finalResult.date = v;
        break;
      case "documentary":
        finalResult.documentary = v;
        break;
      case "ppv":
        finalResult.ppv = v;
        break;
      case "dubbed":
        finalResult.dubbed = v;
        break;
      case "editions":
        if (v instanceof ValueSet) {
          finalResult.editions = v.values;
        }
        break;
      case "episodeCode":
        finalResult.episodeCode = v;
        break;
      case "episodes":
        finalResult.episodes = v;
        break;
      case "extended":
        finalResult.extended = v;
        break;
      case "extension":
        finalResult.extension = v;
        break;
      case "group":
        finalResult.group = v;
        break;
      case "hardcoded":
        finalResult.hardcoded = v;
        break;
      case "hdr":
        if (v instanceof ValueSet) {
          finalResult.hdr = v.values;
        }
        break;
      case "languages":
        if (v instanceof ValueSet) {
          const languages = v.values;
          if (languages.includes("es-419") && languages.includes("es")) {
            finalResult.languages = languages.filter((lang) => lang !== "es");
          } else {
            finalResult.languages = languages;
          }
        }
        break;
      case "network":
        finalResult.network = v;
        break;
      case "proper":
        finalResult.proper = v;
        break;
      case "region":
        finalResult.region = v;
        break;
      case "repack":
        finalResult.repack = v;
        break;
      case "resolution":
        finalResult.resolution = v;
        break;
      case "retail":
        finalResult.retail = v;
        break;
      case "seasons":
        finalResult.seasons = v;
        break;
      case "size":
        finalResult.size = v;
        break;
      case "site":
        finalResult.site = v;
        break;
      case "quality":
        finalResult.quality = v;
        break;
      case "releaseTypes":
        if (v instanceof ValueSet) {
          finalResult.releaseTypes = v.values;
        }
        break;
      case "subbed":
        finalResult.subbed = v;
        break;
      case "threeD":
        finalResult.threeD = v;
        break;
      case "uncensored":
        finalResult.uncensored = v;
        break;
      case "unrated":
        finalResult.unrated = v;
        break;
      case "regraded":
        finalResult.regraded = v;
        break;
      case "upscaled":
        finalResult.upscaled = v;
        break;
      case "volumes":
        finalResult.volumes = v;
        break;
      case "year":
        finalResult.year = v;
        break;
      default:
        finalResult[field] = v;
        break;
    }
  }
  const titleEnd = Math.max(Math.min(endOfTitle, title.length), 0);
  let rawTitle = title.substring(0, titleEnd);
  if (finalResult.episodes && finalResult.episodes.length > 0) {
    rawTitle = rawTitle.replace(trailingEpisodePattern, "");
  }
  finalResult.title = cleanTitle(rawTitle);
  return finalResult;
}
var VALUE_SET_FIELDS;
var init_parser = __esm({
  "node_modules/@viren070/parse-torrent-title/dist/parser.js"() {
    "use strict";
    init_types();
    init_utils();
    VALUE_SET_FIELDS = /* @__PURE__ */ new Set([
      "audio",
      "channels",
      "editions",
      "hdr",
      "languages",
      "releaseTypes"
    ]);
  }
});

// node_modules/@viren070/parse-torrent-title/dist/transforms.js
function toValue(value) {
  return (title, m) => {
    m.value = value;
  };
}
function toLowercase() {
  return (title, m) => {
    m.value = m.value.toLowerCase();
  };
}
function toUppercase() {
  return (title, m) => {
    m.value = m.value.toUpperCase();
  };
}
function toTrimmed() {
  return (title, m) => {
    m.value = m.value.trim();
  };
}
function toCleanDate() {
  const re = /(\d+)(?:st|nd|rd|th)/g;
  return (title, m) => {
    if (typeof m.value === "string") {
      m.value = m.value.replace(re, "$1");
    }
  };
}
function toCleanMonth() {
  const re = /(?:feb(?:ruary)?|jan(?:uary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/gi;
  return (title, m) => {
    if (typeof m.value === "string") {
      m.value = m.value.replace(re, (str) => str.substring(0, 3));
    }
  };
}
function toDate(format) {
  const separatorRe = /[.\-/\\]/g;
  return (title, m) => {
    if (typeof m.value === "string") {
      const normalized = m.value.replace(separatorRe, " ");
      const parsed = parseDate(normalized, format);
      m.value = parsed || "";
    }
  };
}
function parseDate(dateStr, format) {
  try {
    if (format === "20060102" && dateStr.length === 8) {
      const year2 = parseInt(dateStr.substring(0, 4));
      const month2 = parseInt(dateStr.substring(4, 6));
      const day2 = parseInt(dateStr.substring(6, 8));
      if (year2 && month2 && day2) {
        const date = new Date(Date.UTC(year2, month2 - 1, day2));
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
      }
      return null;
    }
    const parts = dateStr.trim().split(/\s+/);
    const formatParts = format.split(/\s+/);
    let year = 0, month = 0, day = 0;
    for (let i = 0; i < formatParts.length && i < parts.length; i++) {
      const fmt = formatParts[i];
      const val = parts[i];
      if (fmt === "2006" || fmt === "YYYY") {
        year = parseInt(val);
      } else if (fmt === "06" || fmt === "YY") {
        year = 2e3 + parseInt(val);
        if (year > 2069)
          year -= 100;
      } else if (fmt === "01" || fmt === "MM") {
        month = parseInt(val);
      } else if (fmt === "02" || fmt === "DD" || fmt === "_2") {
        day = parseInt(val);
      } else if (fmt === "Jan" || fmt === "MMM") {
        const months = [
          "jan",
          "feb",
          "mar",
          "apr",
          "may",
          "jun",
          "jul",
          "aug",
          "sep",
          "oct",
          "nov",
          "dec"
        ];
        month = months.indexOf(val.toLowerCase().substring(0, 3)) + 1;
      } else if (fmt === "YYYYMMDD") {
        year = parseInt(val.substring(0, 4));
        month = parseInt(val.substring(4, 6));
        day = parseInt(val.substring(6, 8));
      }
    }
    if (year && month && day) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    }
    return null;
  } catch {
    return null;
  }
}
function toYear() {
  return (title, m) => {
    if (typeof m.value !== "string") {
      m.value = "";
      return;
    }
    const parts = m.value.split(nonDigitsRegex).filter((p) => p);
    if (parts.length === 1) {
      m.value = parts[0];
      return;
    }
    const start = parts[0];
    const end = parts[1];
    let endYear = parseInt(end);
    if (isNaN(endYear)) {
      m.value = start;
      return;
    }
    const startYear = parseInt(start);
    if (isNaN(startYear)) {
      m.value = "";
      return;
    }
    if (endYear < 100) {
      endYear = endYear + startYear - startYear % 100;
    }
    if (endYear <= startYear) {
      m.value = "";
      return;
    }
    m.value = `${startYear}-${endYear}`;
  };
}
function toIntRange() {
  return (title, m) => {
    if (typeof m.value !== "string") {
      m.value = null;
      return;
    }
    const parts = m.value.replace(nonDigitsRegex, " ").trim().split(" ").filter((p) => p);
    const nums = parts.map((p) => parseInt(p)).filter((n) => !isNaN(n));
    if (nums.length === 2 && nums[0] < nums[1]) {
      const seq = [];
      for (let i = nums[0]; i <= nums[1]; i++) {
        seq.push(i);
      }
      m.value = seq;
      return;
    }
    for (let i = 0; i < nums.length - 1; i++) {
      if (nums[i] + 1 !== nums[i + 1]) {
        m.value = null;
        return;
      }
    }
    m.value = nums;
  };
}
function toWithSuffix(suffix) {
  return (title, m) => {
    if (typeof m.value === "string") {
      m.value = m.value + suffix;
    } else {
      m.value = "";
    }
  };
}
function toBoolean() {
  return (title, m) => {
    m.value = true;
  };
}
function toValueSet(v) {
  return (title, m) => {
    if (m.value instanceof ValueSet) {
      m.value.append(v);
    }
  };
}
function toValueSetWithTransform(toV) {
  return (title, m) => {
    if (m.value instanceof ValueSet) {
      m.value.append(toV(m.mValue));
    }
  };
}
function toValueSetMultiWithTransform(toV) {
  return (title, m) => {
    if (m.value instanceof ValueSet) {
      const values = toV(m.mValue);
      for (const val of values) {
        m.value.append(val);
      }
    }
  };
}
function toIntArray() {
  return (title, m) => {
    if (typeof m.value === "string") {
      const num = parseInt(m.value);
      m.value = !isNaN(num) ? [num] : [];
    } else {
      m.value = [];
    }
  };
}
function toIntRangeTill() {
  return (title, m) => {
    if (typeof m.value !== "string") {
      m.value = null;
      return;
    }
    const parts = m.value.replace(nonDigitsRegex, " ").trim().split(" ").filter((p) => p);
    if (parts.length === 0) {
      m.value = null;
      return;
    }
    const num = parseInt(parts[0]);
    if (!isNaN(num)) {
      const nums = [];
      for (let i = 1; i <= num; i++) {
        nums.push(i);
      }
      m.value = nums;
      return;
    }
    m.value = null;
  };
}
var init_transforms = __esm({
  "node_modules/@viren070/parse-torrent-title/dist/transforms.js"() {
    "use strict";
    init_types();
    init_utils();
  }
});

// node_modules/@viren070/parse-torrent-title/dist/validators.js
function validateOr(...validators) {
  return (input, idxs) => {
    return validators.some((v) => v(input, idxs));
  };
}
function validateAnd(...validators) {
  return (input, idxs) => {
    return validators.every((v) => v(input, idxs));
  };
}
function validateLookbehind(pattern, flags, polarity) {
  const flagStr = flags.toLowerCase().replace(/[^gimsuy]/g, "");
  const re = new RegExp(pattern + "$", flagStr);
  return (input, match) => {
    const rv = input.substring(0, match[0]);
    if (polarity) {
      return re.test(rv);
    }
    return !re.test(rv);
  };
}
function validateLookahead(pattern, flags, polarity) {
  const flagStr = flags.toLowerCase().replace(/[^gimsuy]/g, "");
  const re = new RegExp("^" + pattern, flagStr);
  return (input, match) => {
    const rv = input.substring(match[1]);
    if (polarity) {
      return re.test(rv);
    }
    return !re.test(rv);
  };
}
function validateNotAtStart() {
  return (input, match) => {
    return match[0] !== 0;
  };
}
function validateNotAtEnd() {
  return (input, match) => {
    return match[1] !== input.length;
  };
}
function validateNotStartSpaced() {
  return (input, match) => {
    if (match[0] !== 0)
      return true;
    return !/\s$/.test(input.substring(match[0], match[1]));
  };
}
function validateNotMatch(re) {
  return (input, match) => {
    const rv = input.substring(match[0], match[1]);
    return !re.test(rv);
  };
}
function validateMatch(re) {
  return (input, match) => {
    const rv = input.substring(match[0], match[1]);
    return re.test(rv);
  };
}
function validateMatchedGroupsAreSame(...indices) {
  return (input, match) => {
    const first = input.substring(match[indices[0] * 2], match[indices[0] * 2 + 1]);
    for (let i = 1; i < indices.length; i++) {
      const index = indices[i];
      const other = input.substring(match[index * 2], match[index * 2 + 1]);
      if (other !== first) {
        return false;
      }
    }
    return true;
  };
}
var init_validators = __esm({
  "node_modules/@viren070/parse-torrent-title/dist/validators.js"() {
    "use strict";
  }
});

// node_modules/@viren070/parse-torrent-title/dist/processors.js
function removeFromValue(re) {
  return (title, m) => {
    if (typeof m.value === "string" && m.value !== "") {
      m.value = m.value.replace(re, "");
    }
    return m;
  };
}
function regexMatchUntilValid(re, validator) {
  return (title, m) => {
    let offset = 0;
    while (offset < title.length) {
      const substring = title.substring(offset);
      const idxs = getMatchIndices(re, substring);
      if (idxs.length === 0) {
        return m;
      }
      for (let i = 0; i < idxs.length; i++) {
        if (idxs[i] >= 0) {
          idxs[i] += offset;
        }
      }
      if (validator(title, idxs)) {
        m.mIndex = idxs[0];
        m.mValue = title.substring(idxs[0], idxs[1]);
        if (idxs.length >= 4 && idxs[2] >= 0 && idxs[3] >= 0) {
          m.value = title.substring(idxs[2], idxs[3]);
        } else {
          m.value = m.mValue;
        }
        return m;
      }
      offset = idxs[1];
      if (offset === idxs[0]) {
        offset++;
      }
    }
    return m;
  };
}
var init_processors = __esm({
  "node_modules/@viren070/parse-torrent-title/dist/processors.js"() {
    "use strict";
    init_utils();
  }
});

// node_modules/@viren070/parse-torrent-title/dist/handlers.js
var handlers;
var init_handlers = __esm({
  "node_modules/@viren070/parse-torrent-title/dist/handlers.js"() {
    "use strict";
    init_types();
    init_utils();
    init_transforms();
    init_validators();
    init_processors();
    handlers = [
      // Title handlers (lines 285-292 in handlers.go)
      {
        field: "title",
        pattern: /360.Degrees.of.Vision.The.Byakugan'?s.Blind.Spot/i,
        remove: true
      },
      {
        field: "title",
        pattern: /\b(?:INTERNAL|HFR)\b/i,
        remove: true
      },
      {
        field: "title",
        pattern: /413 Days/i,
        remove: true
      },
      // PPV handlers (lines 294-300 in handlers.go)
      {
        field: "ppv",
        pattern: /\bPPV(?:HD)?\b/i,
        transform: toBoolean(),
        remove: true,
        skipFromTitle: true
      },
      {
        field: "ppv",
        pattern: /\b\W?Fight.?Nights?\W?\b/i,
        transform: toBoolean(),
        skipFromTitle: true
      },
      // Site handlers (lines 302-317 in handlers.go)
      {
        field: "site",
        pattern: /^(www?[., ][\w-]+[. ][\w-]+(?:[. ][\w-]+)?)\s+-\s*/i,
        keepMatching: true,
        skipFromTitle: true,
        remove: true
      },
      {
        field: "site",
        pattern: /\bwww[., ][\w-]+[., ](?:rodeo|hair)\b/i,
        remove: true,
        skipFromTitle: true
      },
      // 20-40 group handler, placed before episode handlers to prevent matching as episodes
      {
        field: "group",
        pattern: /\b(20-40)\b$/,
        transform: toValue("20-40"),
        remove: true
      },
      // Episode Code handlers (lines 319-328 in handlers.go)
      {
        field: "episodeCode",
        pattern: /([\[(]([a-z0-9]{8}|[A-Z0-9]{8})[\])])(?:\.[a-zA-Z0-9]{1,5}$|$)/,
        transform: toUppercase(),
        remove: true,
        matchGroup: 1,
        valueGroup: 2
      },
      {
        field: "episodeCode",
        pattern: /\[([A-Z0-9]{8})]/,
        validateMatch: validateMatch(/(?:[A-Z]+\d|\d+[A-Z])/),
        transform: toUppercase(),
        remove: true
      },
      // Resolution handlers (lines 330-378 in handlers.go)
      {
        field: "resolution",
        pattern: /\b(?:4k|2160p|1080p|720p|480p)\b.+\b(4k|2160p|1080p|720p|480p)\b/i,
        transform: toLowercase(),
        remove: true,
        matchGroup: 1
      },
      {
        field: "resolution",
        pattern: /\b[(\[]?4k[)\]]?\b/i,
        transform: toValue("4k"),
        remove: true
      },
      {
        field: "resolution",
        pattern: /21600?[pi]/i,
        transform: toValue("4k"),
        remove: true,
        keepMatching: true
      },
      {
        field: "resolution",
        pattern: /[(\[]?3840x\d{4}[)\]]?/i,
        transform: toValue("4k"),
        remove: true
      },
      {
        field: "resolution",
        pattern: /[(\[]?1920x\d{3,4}[)\]]?/i,
        transform: toValue("1080p"),
        remove: true
      },
      {
        field: "resolution",
        pattern: /[(\[]?1280x\d{3}[)\]]?/i,
        transform: toValue("720p"),
        remove: true
      },
      {
        field: "resolution",
        pattern: /[(\[]?\d{3,4}x(\d{3,4})[)\]]?/i,
        transform: toWithSuffix("p"),
        remove: true
      },
      {
        field: "resolution",
        pattern: /(480|720|1080)0[pi]/i,
        transform: toWithSuffix("p"),
        remove: true
      },
      {
        field: "resolution",
        pattern: /(?:BD|HD|M)(720|1080|2160)/i,
        transform: toWithSuffix("p"),
        remove: true
      },
      {
        field: "resolution",
        pattern: /(480|576|720|1080|2160)[pi]/i,
        transform: toWithSuffix("p"),
        remove: true
      },
      {
        field: "resolution",
        pattern: /(?:^|\D)(\d{3,4})[pi]/i,
        transform: toWithSuffix("p"),
        remove: true
      },
      // Date handlers (lines 380-451 in handlers.go)
      {
        field: "date",
        pattern: /(?:\W|^)([(\[]?((?:19[6-9]|20[012])[0-9]([. \-/\\])(?:0[1-9]|1[012])([. \-/\\])(?:0[1-9]|[12][0-9]|3[01]))[)\]]?)(?:\W|$)/,
        validateMatch: validateMatchedGroupsAreSame(3, 4),
        transform: toDate("2006 01 02"),
        remove: true,
        valueGroup: 2,
        matchGroup: 1
      },
      {
        field: "date",
        pattern: /(?:\W|^)[(\[]?((?:0[1-9]|[12][0-9]|3[01])([. \-/\\])(?:0[1-9]|1[012])([. \-/\\])(?:19[6-9]|20[012])[0-9])[)\]]?(?:\W|$)/,
        validateMatch: validateMatchedGroupsAreSame(2, 3),
        transform: toDate("02 01 2006"),
        remove: true
      },
      {
        field: "date",
        pattern: /(?:\W)[(\[]?((?:0[1-9]|1[012])([. \-/\\])(?:0[1-9]|[12][0-9]|3[01])([. \-/\\])(?:19[6-9]|20[012])[0-9])[)\]]?(?:\W|$)/,
        validateMatch: validateMatchedGroupsAreSame(2, 3),
        transform: toDate("01 02 2006"),
        remove: true
      },
      {
        field: "date",
        pattern: /(?:\W)[(\[]?((?:0[1-9]|1[012])([. \-/\\])(?:0[1-9]|[12][0-9]|3[01])([. \-/\\])(?:[0][1-9]|[0126789][0-9]))[)\]]?(?:\W|$)/,
        validateMatch: validateMatchedGroupsAreSame(2, 3),
        transform: toDate("01 02 06"),
        remove: true
      },
      {
        field: "date",
        pattern: /(?:\W)[(\[]?((?:0[1-9]|[12][0-9]|3[01])([. \-/\\])(?:0[1-9]|1[012])([. \-/\\])(?:[0][1-9]|[0126789][0-9]))[)\]]?(?:\W|$)/,
        validateMatch: validateMatchedGroupsAreSame(2, 3),
        transform: toDate("02 01 06"),
        matchGroup: 1,
        remove: true
      },
      {
        field: "date",
        pattern: /(?:\W|^)[(\[]?((?:0?[1-9]|[12][0-9]|3[01])[. ]?(?:st|nd|rd|th)?([. \-/\\])(?:feb(?:ruary)?|jan(?:uary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)([. \-/\\])(?:19[7-9]|20[012])[0-9])[)\]]?(?:\W|$)/i,
        validateMatch: validateMatchedGroupsAreSame(2, 3),
        transform: (title, m, result) => {
          toCleanDate()(title, m, result);
          toCleanMonth()(title, m, result);
          toDate("_2 Jan 2006")(title, m, result);
        },
        remove: true
      },
      {
        field: "date",
        pattern: /(?:\W|^)[(\[]?((?:0?[1-9]|[12][0-9]|3[01])[. ]?(?:st|nd|rd|th)?([. \-/\\])(?:feb(?:ruary)?|jan(?:uary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)([. \-/\\])(?:0[1-9]|[0126789][0-9]))[)\]]?(?:\W|$)/i,
        validateMatch: validateMatchedGroupsAreSame(2, 3),
        transform: (title, m, result) => {
          toCleanDate()(title, m, result);
          toCleanMonth()(title, m, result);
          toDate("_2 Jan 06")(title, m, result);
        },
        remove: true
      },
      {
        field: "date",
        pattern: /(?:\W|^)[(\[]?(20[012][0-9](?:0[1-9]|1[012])(?:0[1-9]|[12][0-9]|3[01]))[)\]]?(?:\W|$)/,
        transform: toDate("20060102"),
        remove: true
      },
      // Year handlers (lines 456-542 in handlers.go)
      {
        field: "year",
        pattern: /[ .]?([(\[*]?((?:19\d|20[012])\d[ .]?-[ .]?(?:19\d|20[012])\d)[*)\]]?)[ .]?/,
        transform: (title, m, result) => {
          toYear()(title, m, result);
          if (!result.has("complete") && typeof m.value === "string" && m.value.includes("-")) {
            result.set("complete", {
              mIndex: m.mIndex,
              mValue: m.mValue,
              value: true,
              remove: false,
              processed: false
            });
          }
        },
        matchGroup: 1,
        valueGroup: 2,
        remove: true
      },
      {
        field: "year",
        pattern: /[(\[*][ .]?((?:19\d|20[012])\d[ .]?-[ .]?\d{2})(?:\s?[*)\]])?/,
        transform: (title, m, result) => {
          toYear()(title, m, result);
          if (!result.has("complete") && typeof m.value === "string" && m.value.includes("-")) {
            result.set("complete", {
              mIndex: m.mIndex,
              mValue: m.mValue,
              value: true,
              remove: false,
              processed: false
            });
          }
        },
        remove: true
      },
      {
        field: "year",
        pattern: /[(\[*]?\b(20[0-9]{2}|2100)[*\])]?/i,
        validateMatch: validateLookahead("(?:\\D*\\d{4}\\b)", "", false),
        transform: toYear(),
        remove: true
      },
      {
        field: "year",
        pattern: /(?:[(\[*]|.)((?:\d|[SE]|Cap[. ]?)?(?:19\d|20[012])\d(?:\d|kbps)?)[*)\]]?/i,
        validateMatch: (input, match) => {
          if (match[0] < 2) {
            return false;
          }
          return input.substring(match[2], match[3]).length === 4;
        },
        transform: toYear(),
        remove: true,
        matchGroup: 1
      },
      {
        field: "year",
        pattern: /^[(\[]?((?:19\d|20[012])\d)(?:\d|kbps)?[)\]]?/,
        validateMatch: (input, match) => {
          const mValue = input.substring(match[0], match[1]);
          if (mValue.length === 4) {
            return match[0] !== 0;
          }
          return mValue.replace(/[()[\]]/g, "").length === 4;
        },
        transform: toYear(),
        remove: true
      },
      // Extended handlers (lines 544-549 in handlers.go)
      {
        field: "extended",
        pattern: /EXTENDED/,
        transform: toBoolean()
      },
      {
        field: "extended",
        pattern: /- Extended/i,
        transform: toBoolean()
      },
      // Edition handlers (lines 551-606 in handlers.go)
      {
        field: "editions",
        pattern: /\b\d{2,3}(?:th)?[\.\s\-\+_\/(),]Anniversary[\.\s\-\+_\/(),](?:Edition|Ed)?\b/i,
        transform: toValueSet("Anniversary Edition"),
        keepMatching: true,
        remove: true,
        skipIfBefore: ["year"]
      },
      {
        field: "editions",
        pattern: /\b(?:D(ragon)?[\.\s\-\+_\/(),]?Box)\b/i,
        transform: toValueSet("Dragon Box"),
        keepMatching: true,
        remove: true
      },
      {
        field: "editions",
        pattern: /\bCC\b|\bcolou?r[.\s-]?corrected\b/i,
        transform: toValueSet("Color Corrected"),
        keepMatching: true,
        remove: true
      },
      {
        field: "editions",
        pattern: /\bUltimate[\.\s\-\+_\/(),]Edition\b/i,
        transform: toValueSet("Ultimate Edition"),
        keepMatching: true,
        remove: true
      },
      {
        field: "editions",
        pattern: /\bExtended[\.\s\-\+_\/(),]Director\W?s\b/i,
        transform: toValueSet("Director's Cut"),
        keepMatching: true,
        remove: true
      },
      {
        field: "editions",
        pattern: /\b(?:custom.?)?Extended\b/i,
        transform: toValueSet("Extended Edition"),
        keepMatching: true,
        remove: true
      },
      {
        // criterion collection
        field: "editions",
        pattern: /\bCriterion\.Collection\b/i,
        transform: toValueSet("Criterion Collection"),
        keepMatching: true,
        remove: true
      },
      {
        field: "editions",
        pattern: /\bDirector\W?s.?Cut\b/i,
        transform: toValueSet("Director's Cut"),
        keepMatching: true,
        remove: true
      },
      {
        field: "editions",
        pattern: /\bCollector\W?s\b/i,
        transform: toValueSet("Collector's Edition"),
        keepMatching: true,
        remove: true
      },
      {
        field: "editions",
        pattern: /\bTheatrical\b/i,
        transform: toValueSet("Theatrical"),
        keepMatching: true,
        remove: true
      },
      {
        field: "editions",
        pattern: /\buncut(?:.gems)?\b/i,
        validateMatch: validateNotMatch(/(?:.gems)/i),
        transform: toValueSet("Uncut"),
        keepMatching: true,
        remove: true
      },
      {
        field: "editions",
        pattern: /\bIMAX\b/i,
        transform: toValueSet("IMAX"),
        keepMatching: true,
        remove: true,
        skipFromTitle: true
      },
      {
        field: "editions",
        pattern: /\bDiamond[\s.]Edition\b/i,
        transform: toValueSet("Diamond Edition"),
        keepMatching: true,
        remove: true
      },
      {
        field: "editions",
        pattern: /\b\.Diamond\.\b/i,
        transform: toValueSet("Diamond Edition"),
        keepMatching: true,
        remove: true
      },
      {
        field: "editions",
        pattern: /\bRemaster(?:ed)?\b|\b[\[(]?REKONSTRUKCJA[\])]?\b/i,
        transform: toValueSet("Remastered"),
        keepMatching: true,
        remove: true
      },
      {
        field: "editions",
        pattern: /\bDC\b/,
        transform: toValueSet("Director's Cut"),
        keepMatching: true,
        remove: true,
        skipIfBefore: ["year"]
      },
      // Release Types handlers (lines 608-623 in handlers.go)
      {
        field: "releaseTypes",
        pattern: /\b((?:OAD|OAV|ODA|ONA|OVA)\b(?:[+&]\b(?:OAD|OAV|ODA|ONA|OVA)\b)?)/i,
        transform: toValueSetMultiWithTransform((v) => {
          const values = [];
          for (const part of v.split(nonAlphasRegex)) {
            if (part) {
              values.push(part.toUpperCase());
            }
          }
          return values;
        }),
        remove: true,
        matchGroup: 1
      },
      {
        field: "releaseTypes",
        pattern: /\b(OAD|OAV|ODA|ONA|OVA)(?:[ .-]*\d{1,3})?(?:v\d)?\b/i,
        transform: toValueSetWithTransform((v) => v.toUpperCase()),
        remove: true,
        matchGroup: 1
      },
      // Upscaled handlers (lines 625-636 in handlers.go)
      {
        field: "regraded",
        pattern: /\bRegraded?\b/i,
        transform: toBoolean(),
        remove: true
      },
      {
        field: "upscaled",
        pattern: /\b(?:AI.?)?(Upscal(ed?|ing)|Enhanced?)\b/i,
        transform: toBoolean()
      },
      {
        field: "upscaled",
        pattern: /\b(?:iris2|ups(?:uhd|fhd|hd|4k))\b/i,
        transform: toBoolean()
      },
      {
        field: "upscaled",
        pattern: /\bups\b/i,
        transform: toBoolean(),
        skipIfFirst: true
      },
      {
        field: "upscaled",
        pattern: /\b\.AI\.\b/i,
        transform: toBoolean()
      },
      // Convert handler (lines 638-643 in handlers.go)
      {
        field: "convert",
        pattern: /\bCONVERT\b/,
        transform: toBoolean(),
        remove: true
      },
      // Hardcoded handler (lines 645-650 in handlers.go)
      {
        field: "hardcoded",
        pattern: /\bHC|HARDCODED\b/,
        transform: toBoolean(),
        remove: true
      },
      // Proper handler (lines 652-657 in handlers.go)
      {
        field: "proper",
        pattern: /\b(?:REAL.)?PROPER\b/i,
        transform: toBoolean(),
        remove: true
      },
      // Repack handler (lines 659-664 in handlers.go)
      {
        field: "repack",
        pattern: /\bREPACK|RERIP\b/i,
        transform: toBoolean(),
        remove: true
      },
      // Retail handler (lines 666-670 in handlers.go)
      {
        field: "retail",
        pattern: /\bRetail\b/i,
        transform: toBoolean()
      },
      // Documentary handler (lines 672-677 in handlers.go)
      {
        field: "documentary",
        pattern: /\bDOCU(?:menta?ry)?\b/i,
        transform: toBoolean(),
        skipFromTitle: true
      },
      // Unrated handler (lines 679-684 in handlers.go)
      {
        field: "unrated",
        pattern: /\bunrated\b/i,
        transform: toBoolean(),
        remove: true
      },
      // Uncensored handler (lines 686-691 in handlers.go)
      {
        field: "uncensored",
        pattern: /\buncensored\b/i,
        transform: toBoolean(),
        remove: true
      },
      // Commentary handler (lines 693-698 in handlers.go)
      {
        field: "commentary",
        pattern: /\bcommentary\b/i,
        transform: toBoolean(),
        remove: true
      },
      // Region handlers (lines 700-710 in handlers.go)
      {
        field: "region",
        pattern: /R\dJ?\b/,
        remove: true,
        skipIfFirst: true
      },
      {
        field: "region",
        pattern: /\b(PAL|NTSC|SECAM)\b/,
        transform: toUppercase(),
        remove: true
      },
      // Quality/Source handlers (lines 712-1054 in handlers.go)
      {
        field: "quality",
        pattern: /\b(?:H[DQ][ .-]*)?CAM(?:H[DQ])?(?:[ .-]*Rip)?\b/i,
        transform: toValue("CAM"),
        skipIfFirst: true,
        remove: true
      },
      {
        field: "quality",
        pattern: /\b(?:H[DQ][ .-]*)?S[ .-]+print/i,
        transform: toValue("CAM"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\b(?:HD[ .-]*)?T(?:ELE)?S(?:YNC)?(?:Rip)?\b/i,
        transform: toValue("TeleSync"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\b(?:HD[ .-]*)?T(?:ELE)?C(?:INE)?(?:Rip)?\b/,
        transform: toValue("TeleCine"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\b(?:DVD?|BD|BR|HD)?[ .-]*Scr(?:eener)?\b/i,
        transform: toValue("SCR"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bP(?:RE)?-?(HD|DVD)(?:Rip)?\b/i,
        transform: toValue("SCR"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\b(Blu[ .-]*Ray)\b(?:.*remux)/i,
        transform: toValue("BluRay REMUX"),
        remove: true,
        matchGroup: 1
      },
      {
        field: "quality",
        pattern: /(?:BD|BR|UHD)[- ]?remux/i,
        transform: toValue("BluRay REMUX"),
        remove: true
      },
      {
        field: "quality",
        pattern: /(?:remux.*)\bBlu[ .-]*Ray\b/i,
        transform: toValue("BluRay REMUX"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bremux\b/i,
        transform: toValue("REMUX"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bBlu[ .-]*Ray\b(?:[ .-]*Rip)?/i,
        validateMatch: (input, match) => {
          return !input.substring(match[0], match[1]).toLowerCase().endsWith("rip");
        },
        transform: toValue("BluRay"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bUHD[ .-]*Rip\b/i,
        transform: toValue("UHDRip"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bHD[ .-]*Rip\b/i,
        transform: toValue("HDRip"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bMicro[ .-]*HD\b/i,
        transform: toValue("HDRip"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\b(?:BR|Blu[ .-]*Ray)[ .-]*Rip\b/i,
        transform: toValue("BRRip"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bBD[ .-]*Rip\b|\bBDR\b|\bBD-RM\b|[\[(]BD[\]) .,-]/i,
        transform: toValue("BDRip"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bVOD[ .-]*Rip\b/i,
        transform: toValue("VODR"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\b(?:HD[ .-]*)?DVD[ .-]*Rip\b/i,
        transform: toValue("DVDRip"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bVHS[ .-]*Rip\b/i,
        transform: toValue("VHSRip"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\b(?:R\d?)?DVD(?:R\d?)?\b/i,
        transform: toValue("DVD"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bVHS\b/i,
        transform: toValue("DVD"),
        remove: true,
        skipIfFirst: true
      },
      {
        field: "quality",
        pattern: /\bPPV[ .-]*HD\b/i,
        transform: toValue("PPV"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bPPVRip\b/i,
        transform: toValue("PPVRip"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bHD.?TV.?Rip\b/i,
        transform: toValue("HDTVRip"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bDVB[ .-]*(?:Rip)?\b/i,
        transform: toValue("HDTV"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bSAT[ .-]*Rips?\b/i,
        transform: toValue("SATRip"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bTVRips?\b/i,
        transform: toValue("TVRip"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bR5\b/i,
        transform: toValue("R5"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bWEB[ .-]*Rip\b/i,
        transform: toValue("WEBRip"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bWEB[ .-]?Cap\b/i,
        transform: toValue("WEBCap"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bWEB[ .-]?DL[ .-]?Rip\b/i,
        transform: toValue("WEB-DLRip"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bWEB[ .-]*(DL|.BDrip|.DLRIP)\b/i,
        transform: toValue("WEB-DL"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\b(?:DL|WEB|BD|BR)MUX\b/i,
        remove: true
      },
      {
        field: "quality",
        pattern: /\b(W(?:ORK)P(?:RINT))\b/,
        transform: toValue("WORKPRINT"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\b(?:\w.)?WEB\b|\bWEB(?:(?:[ \.\-\(\],]+\d))?\b/i,
        validateMatch: validateNotMatch(/\b(?:\w.)WEB\b|\bWEB(?:(?:[ \.\-\(\],]+\d))\b/i),
        transform: toValue("WEB"),
        remove: true,
        skipFromTitle: true
      },
      {
        field: "quality",
        pattern: /\bPDTV\b/i,
        transform: toValue("PDTV"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bHD(?:.?TV)?\b(?!-ELITE\.NET)/i,
        transform: toValue("HDTV"),
        remove: true
      },
      {
        field: "quality",
        pattern: /\bSD(?:.?TV)?\b/i,
        transform: toValue("SDTV"),
        remove: true
      },
      // Bit Depth handlers (lines 1056-1077 in handlers.go)
      {
        field: "bitDepth",
        pattern: /(?:8|10|12)[-.]?bit\b/i,
        transform: toLowercase(),
        remove: true
      },
      {
        field: "bitDepth",
        pattern: /\bhevc\s?10\b/i,
        transform: toValue("10bit")
      },
      {
        field: "bitDepth",
        pattern: /\bhdr10(?:\+|plus)?\b/i,
        transform: toValue("10bit")
      },
      {
        field: "bitDepth",
        pattern: /\bhi10\b/i,
        transform: toValue("10bit")
      },
      {
        field: "bitDepth",
        process: removeFromValue(/[ -]/)
      },
      // HDR handlers (lines 1079-1101 in handlers.go)
      {
        field: "hdr",
        pattern: /\bDV\b|dolby.?vision|\bDoVi\b/i,
        transform: toValueSet("DV"),
        remove: true,
        keepMatching: true
      },
      {
        field: "hdr",
        pattern: /HDR10(?:\+|plus)/i,
        transform: toValueSet("HDR10+"),
        remove: true,
        keepMatching: true
      },
      {
        field: "hdr",
        pattern: /\bHDR(?:10)?\b/i,
        transform: toValueSet("HDR"),
        remove: true,
        keepMatching: true
      },
      {
        field: "hdr",
        pattern: /\bSDR\b/i,
        transform: toValueSet("SDR"),
        remove: true,
        keepMatching: true
      },
      // 3D handlers (lines 1103-1138 in handlers.go)
      {
        field: "threeD",
        pattern: /\b(3D)\b.*\b(Half-?SBS|H[-\\/]?SBS)\b/i,
        transform: toValue("3D HSBS")
      },
      {
        field: "threeD",
        pattern: /\bHalf.Side.?By.?Side\b/i,
        transform: toValue("3D HSBS")
      },
      {
        field: "threeD",
        pattern: /\b(3D)\b.*\b(Full-?SBS|SBS)\b/i,
        transform: toValue("3D SBS")
      },
      {
        field: "threeD",
        pattern: /\bSide.?By.?Side\b/i,
        transform: toValue("3D SBS")
      },
      {
        field: "threeD",
        pattern: /\b(3D)\b.*\b(Half-?OU|H[-\\/]?OU)\b/i,
        transform: toValue("3D HOU")
      },
      {
        field: "threeD",
        pattern: /\bHalf.?Over.?Under\b/i,
        transform: toValue("3D HOU")
      },
      {
        field: "threeD",
        pattern: /\b(3D)\b.*\b(OU)\b/i,
        transform: toValue("3D OU")
      },
      {
        field: "threeD",
        pattern: /\bOver.?Under\b/i,
        transform: toValue("3D OU")
      },
      {
        field: "threeD",
        pattern: /\b((?:BD)?3D)\b/i,
        transform: toValue("3D"),
        skipIfFirst: true
      },
      // Codec handlers (lines 1140-1167 in handlers.go)
      {
        field: "codec",
        pattern: /\b[xh][-. ]?26[45]/i,
        transform: toLowercase(),
        remove: true
      },
      {
        field: "codec",
        pattern: /\bhevc(?:\s?10)?\b/i,
        transform: toValue("hevc"),
        remove: true,
        keepMatching: true
      },
      {
        field: "codec",
        pattern: /\b(?:dvix|mpeg2|divx|xvid|avc)\b/i,
        transform: toLowercase(),
        remove: true,
        keepMatching: true
      },
      {
        field: "codec",
        pattern: /\bvp[89]\b/i,
        transform: toLowercase(),
        remove: true,
        keepMatching: true
      },
      {
        field: "codec",
        pattern: /\bAV1\b/i,
        transform: toValue("av1"),
        remove: true,
        keepMatching: true
      },
      {
        field: "codec",
        process: removeFromValue(/[ .-]/)
      },
      // Channels handlers (lines 1169-1199 in handlers.go)
      {
        field: "channels",
        pattern: /5[.\s]1(?:ch|-S\d+)?\b/i,
        transform: toValueSet("5.1"),
        keepMatching: true,
        remove: true
      },
      {
        field: "channels",
        pattern: /\b(?:x[2-4]|5[\W]1(?:x[2-4])?)\b/i,
        transform: toValueSet("5.1"),
        keepMatching: true,
        remove: true
      },
      {
        field: "channels",
        pattern: /\b7[.\- ]1(?:.?ch(?:annel)?)?\b/i,
        transform: toValueSet("7.1"),
        keepMatching: true,
        remove: true
      },
      {
        field: "channels",
        pattern: /(?:\b|AAC|DDP)\+?(2[.\s]0)(?:x[2-4])?\b/i,
        transform: toValueSet("2.0"),
        keepMatching: true,
        remove: true,
        matchGroup: 1
      },
      {
        field: "channels",
        pattern: /\b2\.0\b/i,
        transform: toValueSet("2.0"),
        keepMatching: true,
        remove: true
      },
      {
        field: "channels",
        pattern: /\bstereo\b/i,
        transform: toValueSet("stereo"),
        keepMatching: true
      },
      {
        field: "channels",
        pattern: /\bmono\b/i,
        transform: toValueSet("mono"),
        keepMatching: true
      },
      // Audio handlers (lines 1201-1251 in handlers.go)
      {
        field: "audio",
        pattern: /\b(?:.+HR)?(?:DTS.?HD.?Ma(?:ster)?|DTS.?X)\b/i,
        validateMatch: validateNotMatch(/(?:.+HR)/i),
        transform: toValueSet("DTS Lossless"),
        remove: true,
        keepMatching: true
      },
      {
        field: "audio",
        pattern: /\bDTS(?:(?:.?HD.?Ma(?:ster)?|.X))?.?(?:HD.?HR|HD)?\b/i,
        validateMatch: validateNotMatch(/DTS(?:.?HD.?Ma(?:ster)?|.X)/i),
        transform: toValueSet("DTS Lossy"),
        remove: true,
        keepMatching: true
      },
      {
        field: "audio",
        pattern: /\b(?:Dolby.?)?Atmos\b/i,
        transform: toValueSet("Atmos"),
        remove: true,
        keepMatching: true
      },
      {
        field: "audio",
        pattern: /\bTrue[ .-]?HD\b/i,
        transform: toValueSet("TrueHD"),
        keepMatching: true,
        remove: true,
        skipFromTitle: true
      },
      {
        field: "audio",
        pattern: /\bTRUE\b/,
        transform: toValueSet("TrueHD"),
        keepMatching: true,
        remove: true,
        skipFromTitle: true,
        skipIfBefore: ["year", "seasons", "episodes"]
      },
      // More Audio handlers (lines 1253-1521 in handlers.go)
      {
        field: "audio",
        pattern: /\bFLAC(?:\d\.\d)?(?:x\d+)?\b/i,
        transform: toValueSet("FLAC"),
        keepMatching: true,
        remove: true
      },
      {
        field: "audio",
        pattern: /\bDD2?[+p]|DD Plus|Dolby Digital Plus|DDP5[ ._]1/i,
        transform: toValueSet("DDP"),
        keepMatching: true,
        remove: true
      },
      {
        field: "audio",
        pattern: /E-?AC-?3(?:-S\d+)?/i,
        transform: toValueSet("EAC3"),
        keepMatching: true,
        remove: true
      },
      {
        field: "audio",
        pattern: /\b(DD|Dolby.?Digital|DolbyD)\b/i,
        transform: toValueSet("DD"),
        keepMatching: true,
        remove: true
      },
      {
        field: "audio",
        pattern: /\b(AC-?3(?:x2)?(?:-S\d+)?)\b/i,
        transform: toValueSet("AC3"),
        keepMatching: true,
        remove: true
      },
      {
        field: "audio",
        pattern: /\bQ?AAC(?:[. ]?2[. ]0|x2)?\b/,
        transform: toValueSet("AAC"),
        keepMatching: true,
        remove: true
      },
      {
        field: "audio",
        pattern: /\bL?PCM\b/i,
        transform: toValueSet("PCM"),
        keepMatching: true,
        remove: true
      },
      {
        field: "audio",
        pattern: /\bOPUS(?:\b|\d)(?:.*[ ._-](?:\d{3,4}p))?/i,
        validateMatch: validateNotMatch(/OPUS(?:\b|\d)(?:.*[ ._-](?:\d{3,4}p))/i),
        transform: toValueSet("OPUS"),
        keepMatching: true,
        remove: true
      },
      {
        field: "audio",
        pattern: /\b(?:H[DQ])?.?(?:Clean.?Aud(?:io)?)\b/i,
        transform: toValueSet("HQ"),
        remove: true,
        keepMatching: true
      },
      {
        field: "channels",
        pattern: /\[([257][.-][01])]/,
        transform: toValueSetWithTransform((v) => v.toLowerCase()),
        remove: true,
        keepMatching: true
      },
      // Group handler (lines 1523-1528 in handlers.go)
      {
        field: "group",
        process: regexMatchUntilValid(/- ?([^\-. \[]+[^\-. \[)\]E\d][^\-. \[)\]]*)(?:\[[\w.-]+])?/i, validateAnd(validateNotMatch(/- ?(?:\d+$|S\d+|\d+x|ep?\d+|[^[]+]$)/i), validateLookahead("(?:[ .]\\w{2,4}$|$)", "i", true)))
      },
      // Size handler
      {
        field: "size",
        pattern: /\b(\d+((\.|,)\d+)?\s?(MB|GB|TB))\b/i,
        remove: true
      },
      // Container handler (lines 1530-1534 in handlers.go)
      {
        field: "container",
        pattern: /\.?[\[(]?\b(MKV|AVI|MP4|WMV|MPG|MPEG)\b[\])]?/i,
        transform: toLowercase()
      },
      // Batch 6: Volumes, Languages, Complete handlers (lines 1536-1749 in handlers.go)
      // Volumes handlers (lines 1548-1591 in handlers.go)
      {
        field: "volumes",
        pattern: /\bvol(?:s|umes?)?[. -]*(?:\d{1,3}[., +/\\&-]+)+\d{1,3}\b/i,
        transform: toIntRange(),
        remove: true
      },
      {
        field: "volumes",
        process: (title, m, result) => {
          const re = /\bvol(?:ume)?[. -]*(\d{1,3})/i;
          let startIndex = 0;
          if (result.has("year")) {
            const yr = result.get("year");
            startIndex = Math.min(yr.mIndex, title.length);
          }
          const match = title.substring(startIndex).match(re);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num)) {
              m.mIndex = startIndex + match.index;
              m.mValue = match[0];
              m.value = [num];
              m.remove = true;
            }
          }
          return m;
        }
      },
      // Country handler (lines 1593-1597 in handlers.go)
      {
        field: "country",
        pattern: /\b(US|UK|AU|NZ)\b/
      },
      // Languages handlers (lines 1599-1612 in handlers.go)
      {
        field: "languages",
        pattern: /\b(temporadas?|completa)\b/i,
        transform: toValueSet("es"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(?:INT[EÉ]GRALE?)\b/i,
        transform: toValueSet("fr"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(?:Saison)\b/i,
        transform: toValueSet("fr"),
        keepMatching: true
      },
      // Complete handlers (lines 1614-1725 in handlers.go)
      {
        field: "complete",
        pattern: /\b(?:INTEGRALE?|INTÉGRALE?)\b/i,
        transform: toBoolean(),
        keepMatching: true,
        remove: true
      },
      {
        field: "complete",
        pattern: /(?:\bthe\W)?(?:\bcomplete|collection|dvd)?\b[ .]?\bbox[ .-]?set\b/i,
        transform: toBoolean()
      },
      {
        field: "complete",
        pattern: /(?:\bthe\W)?(?:\bcomplete|collection|dvd)?\b[ .]?\bmini[ .-]?series\b/i,
        transform: toBoolean()
      },
      {
        field: "complete",
        pattern: /(?:\bthe\W)?(?:\bcomplete|full|\ball)\b.*\b(?:series|seasons|collection|episodes|set|pack|movies)\b/i,
        transform: toBoolean()
      },
      {
        field: "complete",
        pattern: /\b(?:series|seasons|movies?)\b.*\b(?:complete|collection)\b/i,
        transform: toBoolean()
      },
      {
        field: "complete",
        pattern: /(?:\bthe\W)?\bultimate\b[ .]\bcollection\b/i,
        transform: toBoolean(),
        keepMatching: true
      },
      {
        field: "complete",
        pattern: /\bcollection\b.*\b(?:set|pack|movies)\b/i,
        transform: toBoolean()
      },
      {
        field: "complete",
        pattern: /\bcollection(?:(\s\[|\s\())/i,
        transform: toBoolean(),
        remove: true
      },
      {
        field: "complete",
        pattern: /\bkolekcja\b(?:\Wfilm(?:y|ów|ow)?)?/i,
        transform: toBoolean(),
        remove: true
      },
      {
        field: "complete",
        pattern: /duology|trilogy|quadr[oi]logy|tetralogy|pentalogy|hexalogy|heptalogy|anthology/i,
        transform: toBoolean(),
        keepMatching: true
      },
      {
        field: "complete",
        pattern: /\bcompleta\b/i,
        transform: toBoolean(),
        remove: true
      },
      {
        field: "complete",
        pattern: /\bsaga\b/i,
        transform: toBoolean(),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "complete",
        pattern: /\b\[Complete\]\b/i,
        transform: toBoolean(),
        remove: true
      },
      {
        field: "complete",
        pattern: /(?:A.?|The.?)?\bComplete\b/i,
        validateMatch: validateNotMatch(/(?:A.?|The.?)\bComplete/i),
        transform: toBoolean(),
        remove: true
      },
      {
        field: "complete",
        pattern: /\bCOMPLETE\b/,
        transform: toBoolean(),
        remove: true
      },
      // Batch 7: Seasons handlers (lines 1727-1868 in handlers.go)
      {
        field: "seasons",
        pattern: /(?:complete\W|seasons?\W|\W|^)((?:s\d{1,2}[., +/\\&-]+)+s\d{1,2}\b)/i,
        transform: toIntRange(),
        remove: true
      },
      {
        field: "seasons",
        pattern: /(?:complete\W|seasons?\W|\W|^)[(\[]?(s\d{2,}-\d{2,}\b)[)\]]?/i,
        transform: toIntRange(),
        remove: true
      },
      {
        field: "seasons",
        pattern: /(?:complete\W|seasons?\W|\W|^)[(\[]?(s[1-9]-[2-9]\b)[)\]]?/i,
        transform: toIntRange(),
        remove: true
      },
      {
        field: "seasons",
        pattern: /\d+ª(?:.+)?(?:a.?)?\d+ª(?:(?:.+)?(?:temporadas?))/i,
        transform: toIntRange(),
        remove: true
      },
      {
        field: "seasons",
        pattern: /(?:(?:\bthe\W)?\bcomplete\W)?(?:seasons?|[Сс]езони?|sezon|temporadas?|stagioni)[. ]?[-:]?[. ]?[(\[]?((?:\d{1,2} ?(?:[,/\\&]+ ?)+)+\d{1,2}\b)[)\]]?/i,
        transform: toIntRange()
      },
      {
        field: "seasons",
        pattern: /(?:(?:\bthe\W)?\bcomplete\W)?(?:seasons|[Сс]езони?|sezon|temporadas?|stagioni)[. ]?[-:]?[. ]?[(\[]?((?:\d{1,2}[. -]+)+0?[1-9]\d?\b)[)\]]?/i,
        transform: toIntRange(),
        remove: true
      },
      {
        field: "seasons",
        pattern: /(?:(?:\bthe\W)?\bcomplete\W)?season[. ]?[(\[]?((?:\d{1,2}[. -]+)+0?\d{1,2}\b)[)\]]?(?:.*\.\w{2,4}$)?/i,
        validateMatch: (input, idxs) => {
          if (/(?:.*\.\w{2,4}$)/i.test(input)) {
            return false;
          }
          const capturedRange = input.substring(idxs[2], idxs[3]);
          if (/\s{2,}/.test(capturedRange)) {
            return false;
          }
          return true;
        },
        transform: toIntRange(),
        remove: true
      },
      {
        field: "seasons",
        pattern: /(?:(?:\bthe\W)?\bcomplete\W)?\bseasons?\b[. -]?(\d{1,2}[. -]?(?:to|thru|and|\+|:)[. -]?\d{1,2})\b/i,
        transform: toIntRange(),
        remove: true
      },
      {
        field: "seasons",
        pattern: /\bseason\b[ .-]?(\d{1,2}[ .-]?(?:to|thru|and|\+)[ .-]?\bseason\b[ .-]?\d{1,2})/i,
        transform: toIntRange()
      },
      {
        field: "seasons",
        pattern: new RegExp("(\\d{1,2})(?:-?\u0439)?[. _]?(?:[\u0421\u0441]\u0435\u0437\u043E\u043D|sez(?:on)?)(?:\\P{L}?\\D|$)", "iu"),
        transform: toIntArray(),
        remove: true
      },
      {
        field: "seasons",
        pattern: /(?:(?:\bthe\W)?\bcomplete\W)?(?:saison|seizoen|sezon(?:SO?)?|stagione|season|series|temp(?:orada)?):?[. ]?(\d{1,2})/i,
        transform: toIntArray()
      },
      {
        field: "seasons",
        pattern: /[Сс]езон:?[. _]?№?(\d{1,2})(?:\d)?/i,
        validateMatch: validateNotMatch(/\d{3}/i),
        transform: toIntArray(),
        remove: true
      },
      {
        field: "seasons",
        pattern: /(?:\D|^)(\d{1,2})Â?[°ºªa]?[. ]*temporada/i,
        transform: toIntArray(),
        remove: true
      },
      {
        field: "seasons",
        pattern: /t(\d{1,3})(?:[ex]+|$)/i,
        transform: toIntArray(),
        remove: true
      },
      {
        field: "seasons",
        pattern: /(?:(?:\bthe\W)?\bcomplete)?(?:\W|^)so?([01]?[0-5]?[1-9])(?:[\Wex]|\d{2}\b)/i,
        validateMatch: validateNotStartSpaced(),
        transform: toIntArray(),
        keepMatching: true
      },
      {
        field: "seasons",
        pattern: /(?:so?|t)(\d{1,4})[. ]?[xх-]?[. ]?(?:e|x|х|ep|-|\.)[. ]?\d{1,4}(?:[abc]|v0?[1-4]|\D|$)/i,
        transform: toIntArray()
      },
      {
        field: "seasons",
        pattern: /(?:(?:\bthe\W)?\bcomplete\W)?(?:\W|^)(\d{1,2})[. ]?(?:st|nd|rd|th)[. ]*season/i,
        transform: toIntArray()
      },
      {
        field: "seasons",
        pattern: /(?:\D|^)(\d{1,2})[Xxх]\d{1,3}(?:\D|$)/,
        transform: toIntArray()
      },
      {
        field: "seasons",
        pattern: /\bSn([1-9])(?:\D|$)/,
        transform: toIntArray()
      },
      {
        field: "seasons",
        pattern: /[\[(](\d{1,2})\.\d{1,3}[)\]]/,
        transform: toIntArray()
      },
      {
        field: "seasons",
        pattern: /-\s?(\d{1,2})\.\d{2,3}\s?-/,
        transform: toIntArray()
      },
      {
        field: "seasons",
        pattern: /^(\d{1,2})\.\d{2,3} - /,
        transform: toIntArray(),
        skipIfBefore: ["year", "source", "resolution"]
      },
      {
        field: "seasons",
        pattern: /(?:^|\/)(?:20-20)?(\d{1,2})-\d{2}\b(?:-\d)?/,
        validateMatch: validateNotMatch(/^(?:20-20)|(\d{1,2})-\d{2}\b(?:-\d)/),
        transform: toIntArray()
      },
      {
        field: "seasons",
        pattern: /[^\w-](\d{1,2})-\d{2}(?:\.\w{2,4}$)/,
        transform: toIntArray()
      },
      {
        field: "seasons",
        pattern: /(?:\bEp?(?:isode)? ?\d+\b.*)?\b(\d{2})[ ._]\d{2}(?:.F)?\.\w{2,4}$/,
        validateMatch: validateNotMatch(/(?:\bEp?(?:isode)? ?\d+\b.*)/),
        transform: toIntArray()
      },
      {
        field: "seasons",
        pattern: /\bEp(?:isode)?\W+(\d{1,2})\.\d{1,3}\b/i,
        transform: toIntArray()
      },
      {
        field: "seasons",
        pattern: /(?:(?:\bthe\W)?\bcomplete)?(?:[a-z])?\bs(\d{1,3})(?:[\Wex]|\d{2}\b|$)/i,
        validateMatch: validateAnd(validateNotMatch(/(?:[a-z])\bs\d{1,3}/i), validateNotStartSpaced()),
        transform: toIntArray(),
        keepMatching: true
      },
      {
        field: "seasons",
        pattern: /\bSeasons?\b.*\b(\d{1,2}-\d{1,2})\b/i,
        transform: toIntRange()
      },
      {
        field: "seasons",
        pattern: /(?:\W|^)(\d{1,2})(?:e|ep)\d{1,3}(?:\W|$)/i,
        transform: toIntArray()
      },
      /**
       * 	// ~ parser.add_handler("seasons", regex.compile(r"\bТВ-(\d{1,2})\b", regex.IGNORECASE), array(integer))
        {
            Field:     "seasons",
            Pattern:   regexp.MustCompile(`(?i)[\[\(]ТВ-(\d{1,2})[\)\]]`),
            Transform: to_int_array(),
        },
       */
      {
        field: "seasons",
        pattern: /[\[\(]ТВ-(\d{1,2})[\)\]]/i,
        transform: toIntArray()
      },
      // Batch 8: Episodes handlers (lines 1870-2125 in handlers.go)
      {
        field: "episodes",
        pattern: /(?:[\W\d]|^)e[ .]?[(\[]?(\d{1,3}(?:[à .-]*(?:[&+]|e){1,2}[ .]?\d{1,3})+)(?:\W|$)/i,
        transform: toIntRange()
      },
      {
        field: "episodes",
        pattern: /(?:[\W\d]|^)ep[ .]?[(\[]?(\d{1,3}(?:[ .-]*(?:[&+]|ep){1,2}[ .]?\d{1,3})+)(?:\W|$)/i,
        transform: toIntRange()
      },
      {
        field: "episodes",
        pattern: /(?:[\W\d]|^)\d+[xх][ .]?[(\[]?(\d{1,3}(?:[ .]?[xх][ .]?\d{1,3})+)(?:\W|$)/i,
        transform: toIntRange()
      },
      {
        field: "episodes",
        pattern: /(?:[\W\d]|^)(?:episodes?|[Сс]ерии:?)[ .]?[(\[]?(\d{1,3}(?:[ .+]*[&+][ .]?\d{1,3})+)(?:\W|$)/i,
        transform: toIntRange()
      },
      {
        field: "episodes",
        pattern: /[(\[]?(?:\D|^)(\d{1,3}[ .]?ao[ .]?\d{1,3})[)\]]?(?:\W|$)/i,
        transform: toIntRange()
      },
      {
        field: "episodes",
        pattern: /(?:[\W\d]|^)(?:e|eps?|episodes?|[Сс]ерии:?|\d+[xх])[ .]*[(\[]?(\d{1,3}(?:-\d{1,3})+)(?:\W|$)/i,
        transform: toIntRange()
      },
      {
        field: "episodes",
        pattern: /\bs\d{1,2}[ .]*-[ .]*\b(\d{1,3}(?:[ .]*~[ .]*\d{1,3})+)\b/i,
        transform: toIntRange()
      },
      {
        field: "episodes",
        pattern: /(?:so?|t)\d{1,4}[. ]?[xх-]?[. ]?(?:e|x|х|ep)[. ]?(\d{1,4})(?:[abc]|v0?[1-4]|\D|$)/i,
        remove: true,
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /(?:so?|t)\d{1,2}\s?[-.]\s?(\d{1,4})(?:[abc]|v0?[1-4]|\D|$)/i,
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /\b(?:so?|t)\d{2}(\d{2})\b/i,
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /(?:\W|^)(\d{1,3}(?:[ .]*~[ .]*\d{1,3})+)(?:\W|$)/i,
        transform: toIntRange()
      },
      {
        field: "episodes",
        pattern: /-\s(\d{1,3}[ .]*-[ .]*\d{1,3})(?:-\d*)?(?:\W|$)/i,
        validateMatch: validateNotMatch(/-\s(\d{1,3}[ .]*-[ .]*\d{1,3})(?:-\d*)/i),
        transform: toIntRange()
      },
      {
        field: "episodes",
        pattern: /s\d{1,2}\s?\((\d{1,3}[ .]*-[ .]*\d{1,3})\)/i,
        transform: toIntRange()
      },
      {
        field: "episodes",
        pattern: /(?:^|\/)(?:20-20)?\d{1,2}-(\d{2})\b(?:-\d)?/,
        validateMatch: validateNotMatch(/^(?:20-20)|\d{1,2}-(\d{2})\b(?:-\d)/),
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /(?:\d-)?\b\d{1,2}-(\d{2})(?:\.\w{2,4}$)/,
        validateMatch: validateNotMatch(/(?:\d-)\b\d{1,2}-(\d{2})/),
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /(?:^\[.+].+)([. ]+-[. ]*(\d{1,4})[. ]+)(?:\W)/i,
        transform: toIntArray(),
        valueGroup: 2,
        matchGroup: 1
      },
      {
        field: "episodes",
        pattern: new RegExp("(?:(?:seasons?|[\u0421\u0441]\u0435\u0437\u043E\u043D\u0438?)\\P{L}*)?(?:[ .(\\[-]|^)(\\d{1,3}(?:[ .]?[,&+~][ .]?\\d{1,3})+)(?:[ .)\\]-]|$)", "iu"),
        validateMatch: validateNotMatch(new RegExp("(?:(?:seasons?|[\u0421\u0441]\u0435\u0437\u043E\u043D\u0438?)\\P{L}*)", "iu")),
        transform: toIntRange()
      },
      {
        field: "episodes",
        pattern: new RegExp("(?:(?:seasons?|[\u0421\u0441]\u0435\u0437\u043E\u043D\u0438?)\\P{L}*)?(?:20-20)?(?:[ .(\\[-]|^)(\\d{1,4}(?:-\\d{1,4})+)(?:[ .)(\\]]|[+-]\\D|$)", "iu"),
        validateMatch: validateAnd(validateNotMatch(new RegExp("(?:seasons?|[\u0421\u0441]\u0435\u0437\u043E\u043D\u0438?)\\P{L}*|^(?:20-20)", "iu")), validateOr(validateLookbehind("Tatsuki[\\s._-]Fujimoto", "i", false), validateNotMatch(/\b17-26\b/))),
        transform: toIntRange()
      },
      {
        field: "episodes",
        pattern: /\bEp(?:isode)?\W+\d{1,2}\.(\d{1,3})\b/i,
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /Ep.\d+.-.\d+/i,
        transform: toIntRange(),
        remove: true
      },
      {
        field: "episodes",
        pattern: /(\d{1,3})[. ]?(?:of|из|iz)[. ]?\d{1,3}/i,
        validateMatch: validateAnd(validateLookbehind("(?:\\D|^)", "i", true), validateLookahead("(?:\\D|$)", "i", true)),
        transform: toIntRangeTill()
      },
      {
        field: "episodes",
        pattern: /(?:\b[ée]p?(?:isode)?|[Ээ]пизод|[Сс]ер(?:ии|ия|\.)?|caa?p(?:itulo)?|epis[oó]dio)[. ]?[-:#№]?[. ]?(\d{1,4})(?:[abc]|v0?[1-4]|\W|$)/i,
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /\b(\d{1,3})(?:-?я)?[ ._-]*(?:ser(?:i?[iyj]a|\b)|[Сс]ер(?:ии|ия|\.)?)/i,
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /(?:\D|^)\d{1,2}[. ]?[Xxх][. ]?(\d{1,3})(?:[abc]|v0?[1-4]|\D|$)/i,
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /[\[(]\d{1,2}\.(\d{1,3})[)\]]/i,
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /\b[Ss](?:eason\W?)?\d{1,2}[ .](\d{1,2})\b/,
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /-\s?\d{1,2}\.(\d{2,3})\s?-/i,
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /^\d{1,2}\.(\d{2,3}) - /,
        skipIfBefore: ["year", "source", "resolution"],
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /\b\d{2}[ ._-](\d{2})(?:.F)?\.\w{2,4}$/i,
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /(?:^)?\[(\d{2,3})](?:(?:\.\w{2,4})?$)?/i,
        validateMatch: validateAnd(validateNotAtStart(), validateNotAtEnd(), validateNotMatch(/(?:720|1080)|\[(\d{2,3})](?:(?:\.\w{2,4})$)/i)),
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /\bodc[. ]+(\d{1,3})\b/i,
        transform: toIntArray()
      },
      {
        field: "episodes",
        pattern: /\b264\b|\b265\b/i,
        validateMatch: (input, match) => {
          const re = /\b[xh]\b/i;
          return !re.test(input.substring(0, match[0]));
        },
        transform: toIntArray(),
        remove: true
      },
      {
        field: "episodes",
        pattern: /(?:\W|^)(?:\d+)?(?:e|ep)(\d{1,3})(?:\W|$)/i,
        transform: toIntArray(),
        remove: true
      },
      {
        field: "episodes",
        pattern: /\d+.-.\d+TV/i,
        transform: toIntRange(),
        remove: true
      },
      {
        field: "episodes",
        pattern: /season\s*\d{1,2}\s*(\d{1,4}\s*-\s*\d{1,4})/i,
        validateMatch: validateNotMatch(/season\s*\d{1,2}\s*-/i),
        transform: toIntRange()
      },
      {
        field: "episodes",
        process: (title, m, result) => {
          if (m.value !== null && m.value !== void 0) {
            return m;
          }
          const btRe = /(?:movie\W*|film\W*|^)?(?:[ .]+-[ .]+|[(\[][ .]*)(\d{1,4})(?:a|b|v\d|\.\d)?(?:\W|$)(?:movie|film|\d+)?/i;
          const btReNegBefore = /(?:movie\W*|film\W*)(?:[ .]+-[ .]+|[(\[][ .]*)(\d{1,4})/i;
          const btReNegAfter = /(?:movie|film)|(\d{1,4})(?:a|b|v\d|\.\d)(?:\W)(?:\d+)/i;
          const mtRe = /^(?:[(\[-][ .]?)?(\d{1,4})(?:a|b|v\d)?(?:\Wmovie|\Wfilm|-\d)?(?:\W|$)/i;
          const mtReNegAfter = /(\d{1,4})(?:a|b|v\d)?(?:\Wmovie|\Wfilm|-\d)/i;
          const commonResolutionNeg = /\[(?:480|720|1080)\]/;
          const commonFPSNeg = /\d+(?:fps|帧率?)/i;
          let startIndex = 0;
          for (const component of ["year", "seasons"]) {
            if (result.has(component)) {
              const cm = result.get(component);
              if (cm.mIndex > 0 && (startIndex === 0 || cm.mIndex < startIndex)) {
                startIndex = cm.mIndex;
              }
            }
          }
          let endIndex = title.length;
          for (const component of ["resolution", "quality", "codec", "audio"]) {
            if (result.has(component)) {
              const cm = result.get(component);
              if (cm.mIndex > 0 && cm.mIndex < endIndex) {
                endIndex = cm.mIndex;
              }
            }
          }
          const beginningTitle = title.substring(0, endIndex);
          startIndex = Math.min(startIndex, title.length);
          const middleTitle = title.substring(startIndex, Math.max(endIndex, startIndex));
          let match = beginningTitle.match(btRe);
          let mStr = "";
          if (match && match.index !== void 0) {
            mStr = match[0];
            const matchEndPos = match.index + match[0].length;
            const nextCharIsWordChar = matchEndPos >= beginningTitle.length && endIndex < title.length && /\w/.test(title[endIndex]);
            if (match.index === 0 || btReNegBefore.test(mStr) || btReNegAfter.test(mStr) || commonResolutionNeg.test(mStr) || commonFPSNeg.test(mStr) || nextCharIsWordChar) {
              match = null;
              mStr = "";
            } else if (match[1]) {
              mStr = match[1];
            }
          }
          if (!mStr && endIndex > 0 && endIndex < title.length) {
            const dotEpisodeRe = /[ ._](\d{2,3})(?:[ ._]?v\d)?[ ._(\[]*$/i;
            const endSection = title.substring(0, endIndex);
            const dotMatch = endSection.match(dotEpisodeRe);
            if (dotMatch && dotMatch[1]) {
              mStr = dotMatch[1];
            }
          }
          if (!mStr) {
            match = middleTitle.match(mtRe);
            if (match && match.index !== void 0 && match[1]) {
              const captureGroupIndex = match[0].indexOf(match[1]);
              const fromCaptureGroup = middleTitle.substring(match.index + captureGroupIndex);
              if (mtReNegAfter.test(fromCaptureGroup) || commonResolutionNeg.test(mStr)) {
                match = null;
                mStr = "";
              } else {
                mStr = match[1];
              }
            }
          }
          if (mStr) {
            mStr = mStr.replace(/\D/g, "");
            const ep = parseInt(mStr, 10);
            if (!isNaN(ep)) {
              m.mIndex = title.indexOf(mStr);
              m.mValue = mStr;
              m.value = [ep];
            }
          }
          return m;
        }
      },
      // Batch 9: Subbed, Dubbed, Multi-language detection (lines 2259-2290 in handlers.go)
      {
        field: "subbed",
        pattern: /\bSUB(?:FRENCH)\b|\b(?:DAN|E|FIN|PL|SLO|SWE)SUBS?\b/i,
        transform: toBoolean()
      },
      {
        field: "languages",
        pattern: /\bmulti(?:ple)?[ .-]*(?:su?$|sub\w*|dub\w*)\b|msub/i,
        transform: toValueSet("multi subs"),
        keepMatching: true,
        remove: true
      },
      {
        field: "languages",
        pattern: /\bmulti(?:ple)?[ .-]*(?:lang(?:uages?)?|audio|VF2)?\b/i,
        transform: toValueSet("multi audio"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\btri(?:ple)?[ .-]*(?:audio|dub\w*)\b/i,
        transform: toValueSet("multi audio"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bdual[ .-]*(?:au?$|[aá]udio|line)\b/i,
        transform: toValueSet("dual audio"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bdual\b(?:[ .-]*sub)?/i,
        validateMatch: validateNotMatch(/(?:[ .-]*sub)/i),
        transform: toValueSet("dual audio"),
        keepMatching: true
      },
      // Batch 10: Detailed language handlers, subbed/dubbed, network, size, group, extension (lines 2291-3592)
      // English language handlers
      {
        field: "languages",
        pattern: /\bengl?(?:sub[A-Z]*)?\b/i,
        transform: toValueSet("en"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\beng?sub[A-Z]*\b/i,
        transform: toValueSet("en"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bing(?:l[eéê]s)?\b/i,
        transform: toValueSet("en"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\besub\b/i,
        transform: toValueSet("en"),
        keepMatching: true,
        remove: true
      },
      {
        field: "languages",
        pattern: /\benglish\W+(?:subs?|sdh|hi)\b/i,
        transform: toValueSet("en"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bEN\b/i,
        transform: toValueSet("en"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\benglish?\b/i,
        transform: toValueSet("en"),
        keepMatching: true,
        skipIfFirst: true
      },
      // Japanese language handlers
      {
        field: "languages",
        pattern: /\b(?:JP|JAP|JPN)\b/i,
        transform: toValueSet("ja"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /(japanese|japon[eê]s)\b/i,
        transform: toValueSet("ja"),
        keepMatching: true,
        skipIfFirst: true
      },
      // Korean language handlers
      {
        field: "languages",
        pattern: /\b(?:KOR|kor[ .-]?sub)\b/i,
        transform: toValueSet("ko"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /(korean|coreano)\b/i,
        transform: toValueSet("ko"),
        keepMatching: true,
        skipIfFirst: true
      },
      // Chinese language handlers
      {
        field: "languages",
        pattern: /\b(?:traditional\W*chinese|chinese\W*traditional)(?:\Wchi)?\b/i,
        transform: toValueSet("zh-tw"),
        keepMatching: true,
        remove: true
      },
      {
        field: "languages",
        pattern: /\bzh-hant\b/i,
        transform: toValueSet("zh-tw"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(?:mand[ae]rin|ch[sn])\b/i,
        transform: toValueSet("zh"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /(?:shang-?)?\bCH(?:I|T)\b/i,
        validateMatch: validateNotMatch(/shang-?/i),
        transform: toValueSet("zh"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /(chinese|chin[eê]s)\b/i,
        transform: toValueSet("zh"),
        keepMatching: true,
        skipIfFirst: true
      },
      {
        field: "languages",
        pattern: /\bzh-hans\b/i,
        transform: toValueSet("zh"),
        keepMatching: true
      },
      // French language handlers
      {
        field: "languages",
        pattern: /\bFR(?:a|e|anc[eê]s|VF[FQIB2]?)\b/i,
        transform: toValueSet("fr"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\b(?:TRUE|SUB).?FRENCH\b|\bFRENCH\b|\bFre?\b/,
        transform: toValueSet("fr"),
        keepMatching: true,
        remove: true
      },
      {
        field: "languages",
        pattern: /\b\[?(?:VF[FQRIB2]?\]?\b|(?:VOST)?FR2?)\b/,
        transform: toValueSet("fr"),
        keepMatching: true,
        remove: true
      },
      {
        field: "languages",
        pattern: /\bVOST(?:FR?|A)?\b/i,
        transform: toValueSet("fr"),
        keepMatching: true
      },
      // Spanish/Latino language handlers
      {
        field: "languages",
        pattern: /\bspanish\W?latin|american\W*(?:spa|esp?)/i,
        transform: toValueSet("es-419"),
        keepMatching: true,
        remove: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\b(?:audio.)?lat(?:in?|ino)?\b/i,
        transform: toValueSet("es-419"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(?:audio.)?(?:ESP?|spa|(?:en[ .]+)?espa[nñ]ola?|castellano)\b/i,
        transform: toValueSet("es"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bes(?:\.(?:ass|ssa|srt|sub|idx)$)/i,
        transform: toValueSet("es"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bspanish\W+subs?\b/i,
        transform: toValueSet("es"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(spanish|espanhol)\b/i,
        transform: toValueSet("es"),
        keepMatching: true,
        skipIfFirst: true
      },
      {
        field: "languages",
        pattern: /\bSP\b/i,
        validateMatch: validateAnd(validateLookbehind("(?:w{3}\\.\\w+\\.)", "i", false), validateOr(validateLookahead("(?:[ .,/-]+(?:[A-Z]{2}[ .,/-]+){2,})", "i", true), validateLookbehind("(?:(?:[ .,/\\[-]+[A-Z]{2}){2,}[ .,/-]+)", "i", true), validateAnd(validateLookahead("(?:[ .,/-]+[A-Z]{2}(?:[ .,/-]|$))", "i", true), validateLookbehind("(?:[ .,/\\[-]+[A-Z]{2}[ .,/-]+)", "i", true)))),
        transform: toValueSet("es"),
        keepMatching: true,
        remove: true
      },
      // Portuguese language handlers
      {
        field: "languages",
        pattern: /\b(?:p[rt]|en|port)[. (\\/-]*BR\b/i,
        transform: toValueSet("pt"),
        keepMatching: true,
        remove: true
      },
      {
        field: "languages",
        pattern: /\bbr(?:a|azil|azilian)\W+(?:pt|por)\b/i,
        transform: toValueSet("pt"),
        keepMatching: true,
        remove: true
      },
      {
        field: "languages",
        pattern: /\b(?:leg(?:endado|endas?)?|dub(?:lado)?|portugu[eèê]se?)[. -]*BR\b/i,
        transform: toValueSet("pt"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bleg(?:endado|endas?)\b/i,
        transform: toValueSet("pt"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bportugu[eèê]s[ea]?\b/i,
        transform: toValueSet("pt"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bPT[. -]*(?:PT|ENG?|sub(?:s|titles?))\b/i,
        transform: toValueSet("pt"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bpt(?:\.(?:ass|ssa|srt|sub|idx)$)/i,
        transform: toValueSet("pt"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bpt\b/i,
        transform: toValueSet("pt"),
        keepMatching: true,
        remove: true
      },
      {
        field: "languages",
        pattern: /\bpor\b/i,
        transform: toValueSet("pt"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Italian language handlers
      {
        field: "languages",
        pattern: /\bITA\b/i,
        transform: toValueSet("it"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bIT\b/i,
        validateMatch: validateAnd(validateLookbehind("(?:w{3}\\.\\w+\\.)", "i", false), validateOr(validateLookahead("(?:[ .,/-]+(?:[A-Z]{2}[ .,/-]+){2,})", "i", true), validateLookbehind("(?:(?:[ .,/\\[-]+[A-Z]{2}){2,}[ .,/-]+)", "i", true))),
        transform: toValueSet("it"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bit/i,
        validateMatch: validateLookahead("(?:\\.(?:ass|ssa|srt|sub|idx)$)", "i", true),
        transform: toValueSet("it"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bitaliano?\b/i,
        transform: toValueSet("it"),
        keepMatching: true,
        skipIfFirst: true
      },
      // Greek language handlers
      {
        field: "languages",
        pattern: /\bgreek[ .-]*(?:audio|lang(?:uage)?|subs?(?:titles?)?)?\b/i,
        transform: toValueSet("el"),
        keepMatching: true,
        skipIfFirst: true
      },
      // German language handlers
      {
        field: "languages",
        pattern: /\b(?:GER|DEU)\b/i,
        transform: toValueSet("de"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bde\b/i,
        validateMatch: validateLookahead("(?:[ .,/-]+(?:[A-Z]{2}[ .,/-]+){2,})", "i", true),
        transform: toValueSet("de"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bde\b/i,
        transform: toValueSet("de"),
        validateMatch: validateLookbehind("(?:[ .,/-]+(?:[A-Z]{2}[ .,/-]+){2,})", "i", true),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bde\b/i,
        transform: toValueSet("de"),
        validateMatch: validateAnd(validateLookbehind("(?:[ .,/-]+[A-Z]{2}[ .,/-]+)", "i", true), validateLookahead("(?:[ .,/-]+[A-Z]{2}[ .,/-]+)", "i", true)),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bde(?:\.(?:ass|ssa|srt|sub|idx)$)/i,
        transform: toValueSet("de"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\b(german|alem[aã]o)\b/i,
        transform: toValueSet("de"),
        keepMatching: true,
        skipIfFirst: true
      },
      // Russian language handlers
      {
        field: "languages",
        pattern: /\bRUS?\b/i,
        transform: toValueSet("ru"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /(russian|russo)\b/i,
        transform: toValueSet("ru"),
        keepMatching: true,
        skipIfFirst: true
      },
      // Ukrainian language handlers
      {
        field: "languages",
        pattern: /\bUKR\b/i,
        transform: toValueSet("uk"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bukrainian\b/i,
        transform: toValueSet("uk"),
        keepMatching: true,
        skipIfFirst: true
      },
      // Indian language handlers
      {
        field: "languages",
        pattern: /\bhin(?:di)?\b/i,
        transform: toValueSet("hi"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(?:(?:w{3}\.\w+\.)?tel(?:\W*aviv)?|telugu)\b/i,
        validateMatch: validateNotMatch(/(?:(?:w{3}\.\w+\.)tel)|(?:tel(?:\W*aviv))/i),
        transform: toValueSet("te"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bt[aâ]m(?:il)?\b/i,
        transform: toValueSet("ta"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(?:(?:w{3}\.\w+\.)?MAL(?:ay)?|malayalam)\b/i,
        validateMatch: validateNotMatch(/\b(?:(?:w{3}\.\w+\.)MAL)\b/i),
        transform: toValueSet("ml"),
        keepMatching: true,
        remove: true,
        skipIfFirst: true
      },
      {
        field: "languages",
        pattern: /\b(?:(?:w{3}\.\w+\.)?KAN(?:nada)?|kannada)\b/i,
        validateMatch: validateNotMatch(/\b(?:(?:w{3}\.\w+\.)KAN)\b/i),
        transform: toValueSet("kn"),
        keepMatching: true,
        remove: true
      },
      {
        field: "languages",
        pattern: /\b(?:(?:w{3}\.\w+\.)?MAR(?:a(?:thi)?)?|marathi)\b/i,
        validateMatch: validateNotMatch(/\b(?:(?:w{3}\.\w+\.)MAR)\b/i),
        transform: toValueSet("mr"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(?:(?:w{3}\.\w+\.)?GUJ(?:arati)?|gujarati)\b/i,
        validateMatch: validateNotMatch(/\b(?:(?:w{3}\.\w+\.)GUJ)\b/i),
        transform: toValueSet("gu"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(?:(?:w{3}\.\w+\.)?PUN(?:jabi)?|punjabi)\b/i,
        validateMatch: validateNotMatch(/\b(?:(?:w{3}\.\w+\.)PUN)\b/i),
        transform: toValueSet("pa"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(?:(?:w{3}\.\w+\.)?BEN(?:.\bThe|and|of\b)?(?:gali)?|bengali)\b/i,
        validateMatch: validateNotMatch(/\b(?:(?:w{3}\.\w+\.)BEN)|(?:BEN)(?:.\bThe|and|of\b)\b/i),
        transform: toValueSet("bn"),
        keepMatching: true,
        skipIfFirst: true
      },
      // Baltic language handlers
      {
        field: "languages",
        pattern: /\b(?:YTS\.)?LT\b/i,
        validateMatch: validateNotMatch(/(?:YTS\.)/i),
        transform: toValueSet("lt"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\blithuanian\b/i,
        transform: toValueSet("lt"),
        keepMatching: true,
        skipIfFirst: true
      },
      {
        field: "languages",
        pattern: /\blatvian\b/i,
        transform: toValueSet("lv"),
        keepMatching: true,
        skipIfFirst: true
      },
      {
        field: "languages",
        pattern: /\bestonian\b/i,
        transform: toValueSet("et"),
        keepMatching: true,
        skipIfFirst: true
      },
      // Polish language handlers
      {
        field: "languages",
        pattern: /\b(?:PLDUB|Dub(?:bing.?)?PL|Lek(?:tor.?)?PL|Film.Polski)\b/i,
        transform: toValueSet("pl"),
        keepMatching: true,
        remove: true
      },
      {
        field: "languages",
        pattern: /\b(?:Napisy.PL|PLSUB(?:BED)?)\b/i,
        transform: toValueSet("pl"),
        keepMatching: true,
        remove: true
      },
      {
        field: "languages",
        pattern: /\b(?:(?:w{3}\.\w+\.)?PL|pol)\b/i,
        validateMatch: validateNotMatch(/(?:w{3}\.\w+\.)/i),
        transform: toValueSet("pl"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(polish|polon[eê]s|polaco)\b/i,
        transform: toValueSet("pl"),
        keepMatching: true,
        skipIfFirst: true
      },
      // Czech/Slovak language handlers
      {
        field: "languages",
        pattern: /\bCZ[EH]?\b/i,
        transform: toValueSet("cs"),
        keepMatching: true,
        skipIfFirst: true
      },
      {
        field: "languages",
        pattern: /\bczech\b/i,
        transform: toValueSet("cs"),
        keepMatching: true,
        skipIfFirst: true
      },
      {
        field: "languages",
        pattern: /\bslo(?:vak|vakian|subs|[\]_)]?\.\w{2,4}$)\b/i,
        transform: toValueSet("sk"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Hungarian language handlers
      {
        field: "languages",
        pattern: /\bHU\b/i,
        transform: toValueSet("hu"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bHUN(?:garian)?\b/i,
        transform: toValueSet("hu"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Romanian language handlers
      {
        field: "languages",
        pattern: /\bROM(?:anian)?\b/i,
        transform: toValueSet("ro"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bRO(?:[ .,/-]*(?:[A-Z]{2}[ .,/-]+)*sub)/i,
        transform: toValueSet("ro"),
        keepMatching: true
      },
      // Bulgarian language handlers
      {
        field: "languages",
        pattern: /\bbul(?:garian)?\b/i,
        transform: toValueSet("bg"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bBGAUDIO\b/i,
        transform: toValueSet("bg"),
        keepMatching: true,
        remove: true,
        skipFromTitle: true
      },
      // Serbian/Croatian/Slovenian language handlers
      {
        field: "languages",
        pattern: /\b(?:srp|serbian)\b/i,
        transform: toValueSet("sr"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(?:HRV|croatian)\b/i,
        transform: toValueSet("hr"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bHR(?:[ .,/-]*(?:[A-Z]{2}[ .,/-]+)*sub\w*)\b/i,
        transform: toValueSet("hr"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bslovenian\b/i,
        transform: toValueSet("sl"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Dutch language handlers
      {
        field: "languages",
        pattern: /\b(?:(?:w{3}\.\w+\.)?NL|dut|holand[eê]s)\b/i,
        validateMatch: validateNotMatch(/(?:w{3}\.\w+\.)NL/i),
        transform: toValueSet("nl"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bdutch\b/i,
        transform: toValueSet("nl"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bflemish\b/i,
        transform: toValueSet("nl"),
        keepMatching: true
      },
      // Danish language handlers
      {
        field: "languages",
        pattern: /\b(?:DK|danska|dansub|nordic)\b/i,
        transform: toValueSet("da"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(danish|dinamarqu[eê]s)\b/i,
        transform: toValueSet("da"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bdan\b(?:.*\.(?:srt|vtt|ssa|ass|sub|idx)$)/i,
        transform: toValueSet("da"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Finnish language handlers
      {
        field: "languages",
        pattern: /\b(?:(?:w{3}\.\w+\.|Sci-)?FI|finsk|finsub|nordic)\b/i,
        validateMatch: validateNotMatch(/(?:w{3}\.\w+\.|Sci-)FI/i),
        transform: toValueSet("fi"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\bfinnish\b/i,
        transform: toValueSet("fi"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Swedish language handlers
      {
        field: "languages",
        pattern: /\b(?:(?:w{3}\.\w+\.)?SE|swe|swesubs?|sv(?:ensk)?|nordic)\b/i,
        validateMatch: validateNotMatch(/(?:w{3}\.\w+\.)SE/i),
        transform: toValueSet("sv"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(swedish|sueco)\b/i,
        transform: toValueSet("sv"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Norwegian language handlers
      {
        field: "languages",
        pattern: /\b(?:NOR|norsk|norsub|nordic)\b/i,
        transform: toValueSet("no"),
        keepMatching: true
      },
      {
        field: "languages",
        pattern: /\b(norwegian|noruegu[eê]s|bokm[aå]l|nob|nor(?:[\]_)]?\.\w{2,4}$))\b/i,
        transform: toValueSet("no"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Arabic language handlers
      {
        field: "languages",
        pattern: /\b(?:arabic|[aá]rabe|ara)\b/i,
        transform: toValueSet("ar"),
        keepMatching: true,
        skipIfFirst: true
      },
      {
        field: "languages",
        pattern: /\barab.*(?:audio|lang(?:uage)?|sub(?:s|titles?)?)\b/i,
        transform: toValueSet("ar"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\bar(?:\.(?:ass|ssa|srt|sub|idx)$)/i,
        transform: toValueSet("ar"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Turkish language handlers
      {
        field: "languages",
        pattern: /\b(?:turkish|tur(?:co)?)\b/i,
        transform: toValueSet("tr"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /\b(TİVİBU|tivibu|bitturk(?:\.net)?|turktorrent)\b/i,
        transform: toValueSet("tr"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Vietnamese language handlers
      {
        field: "languages",
        pattern: /\bvietnamese\b|\bvie(?:[\]_)]?\.\w{2,4}$)/i,
        transform: toValueSet("vi"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Indonesian language handlers
      {
        field: "languages",
        pattern: /\bind(?:onesian)?\b/i,
        transform: toValueSet("id"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Thai language handlers
      {
        field: "languages",
        pattern: /\b(thai|tailand[eê]s)\b/i,
        transform: toValueSet("th"),
        keepMatching: true,
        skipIfFirst: true
      },
      {
        field: "languages",
        pattern: /\b(THA|tha)\b/,
        transform: toValueSet("th"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Malay language handlers
      {
        field: "languages",
        pattern: /\b(?:malay|may(?:[\]_)]?\.\w{2,4}$)|(?:subs?\([a-z,]+)may)\b/i,
        transform: toValueSet("ms"),
        keepMatching: true
      },
      // Hebrew language handlers
      {
        field: "languages",
        pattern: /\bheb(?:rew|raico)?\b/i,
        transform: toValueSet("he"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Persian language handlers
      {
        field: "languages",
        pattern: /\b(persian|persa)\b/i,
        transform: toValueSet("fa"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Unicode spt detection for languages
      {
        field: "languages",
        pattern: /[\u3040-\u30ff]+/i,
        transform: toValueSet("ja"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /[\u3400-\u4dbf]+/i,
        transform: toValueSet("zh"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /[\u4e00-\u9fff]+/i,
        transform: toValueSet("zh"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /[\uf900-\ufaff]+/i,
        transform: toValueSet("zh"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /[\uff66-\uff9f]+/i,
        transform: toValueSet("ja"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /[\u0400-\u04ff]+/i,
        transform: toValueSet("ru"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /[\u0600-\u06ff]+/i,
        transform: toValueSet("ar"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /[\u0750-\u077f]+/i,
        transform: toValueSet("ar"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /[\u0c80-\u0cff]+/i,
        transform: toValueSet("kn"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /[\u0d00-\u0d7f]+/i,
        transform: toValueSet("ml"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /[\u0e00-\u0e7f]+/i,
        transform: toValueSet("th"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /[\u0900-\u097f]+/i,
        transform: toValueSet("hi"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /[\u0980-\u09ff]+/i,
        transform: toValueSet("bn"),
        keepMatching: true,
        skipFromTitle: true
      },
      {
        field: "languages",
        pattern: /[\u0a00-\u0a7f]+/i,
        transform: toValueSet("gu"),
        keepMatching: true,
        skipFromTitle: true
      },
      // Portuguese/Spanish episode detection
      {
        field: "languages",
        process: (title, m, result) => {
          const ere = /capitulo|ao/i;
          const tre = /dublado/i;
          m.mIndex = 0;
          m.mValue = "";
          const vs = m.value;
          if (vs && vs.exists && (vs.exists("pt") || vs.exists("es"))) {
            return m;
          }
          const em = result.get("episodes");
          if (em && em.mValue && ere.test(em.mValue) || tre.test(title)) {
            if (!vs || !vs.append) {
              const newVs = new ValueSet();
              m.value = newVs.append("pt");
            } else {
              m.value = vs.append("pt");
            }
          }
          return m;
        }
      },
      // Subbed handlers
      {
        field: "subbed",
        pattern: /\b(?:Official.*?|Dual-?)?sub(?:s|bed)?\b/i,
        transform: toBoolean(),
        remove: true,
        skipIfFirst: true
      },
      {
        field: "subbed",
        pattern: /\b(?:Official.*?|Dual-?)sub(?:s|bed)?\b/i,
        transform: toBoolean(),
        remove: true
      },
      {
        field: "subbed",
        process: (title, m, result) => {
          const lm = result.get("languages");
          if (!lm) {
            return m;
          }
          const s = lm.value;
          if (s && s.exists && s.exists("multi subs")) {
            m.value = true;
          }
          return m;
        }
      },
      // Dubbed handlers
      {
        field: "dubbed",
        pattern: /\b(?:fan\s?dub)\b/i,
        transform: toBoolean(),
        remove: true,
        skipFromTitle: true
      },
      {
        field: "dubbed",
        pattern: /\bMULTi\b/i,
        transform: toBoolean(),
        remove: true
      },
      {
        field: "dubbed",
        pattern: /\b(?:Fan.*)?(?:DUBBED|dublado|dubbing|DUBS?)\b/i,
        transform: toBoolean(),
        remove: true
      },
      {
        field: "dubbed",
        pattern: /\b(?:.*\bsub(?:s|bed)?\b)?(?:[ _\-\[(\.])?(dual|multi)(?:[ _\-\[(\.])?(?:audio)\b/i,
        validateMatch: validateNotMatch(/\b(?:.*\bsub(s|bed)?\b)/i),
        transform: toBoolean(),
        remove: true
      },
      {
        field: "dubbed",
        pattern: /\b(?:DUBBED|dublado|dubbing|DUBS?)\b/i,
        transform: toBoolean()
      },
      {
        field: "dubbed",
        process: (title, m, result) => {
          const lm = result.get("languages");
          if (!lm) {
            return m;
          }
          const s = lm.value;
          if (s && s.exists && (s.exists("multi audio") || s.exists("dual audio"))) {
            m.value = true;
          }
          return m;
        }
      },
      // Site handlers
      {
        field: "site",
        pattern: /\[eztv\]/i,
        transform: toValue("eztv.re"),
        remove: true,
        skipFromTitle: true
      },
      {
        field: "site",
        pattern: /\beztv\b/i,
        transform: toValue("eztv.re"),
        remove: true,
        skipFromTitle: true
      },
      {
        field: "site",
        pattern: /(\[([^\[\].]+\.[^\].]+)\])(?:\.\w{2,4}$|\s)/i,
        transform: toTrimmed(),
        remove: true,
        matchGroup: 1,
        valueGroup: 2
      },
      {
        field: "site",
        pattern: /[\[{(](www.\w*.\w+)[)}\]]/i,
        remove: true,
        skipFromTitle: true
      },
      {
        field: "site",
        pattern: /[[(【].*?((?:www?.?)?(?:\w+-)?\w+(?:[.\s](?:com|org|net|ms|tv|mx|co|party|vip|nu|pics))\b).*?[\])】]/i,
        matchGroup: 0,
        remove: true,
        skipFromTitle: true
      },
      {
        field: "site",
        pattern: /-(www\.[\w-]+\.[\w-]+(?:\.[\w-]+)*)\.(\w{2,4})$/i,
        transform: toTrimmed(),
        remove: true,
        skipFromTitle: true,
        matchGroup: 1
      },
      {
        field: "site",
        pattern: /\[([^\[\].]+\.[^\].]+)\](?:\.\w{2,4})?(?:$|\s)/i,
        transform: toTrimmed(),
        remove: true,
        skipFromTitle: true,
        matchGroup: 1
      },
      {
        field: "site",
        pattern: /[\[{(](www\.[\w-]+\.[\w-]+(?:\.[\w-]+)*)[)}\]]/i,
        transform: toTrimmed(),
        remove: true,
        skipFromTitle: true,
        matchGroup: 1
      },
      // Network handlers
      {
        field: "network",
        pattern: /\bATVP?\b/i,
        transform: toValue("Apple TV"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bAMZN\b/i,
        transform: toValue("Amazon"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bNF|Netflix\b/i,
        transform: toValue("Netflix"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bNICK(?:elodeon)?\b/i,
        transform: toValue("Nickelodeon"),
        remove: true,
        skipIfFirst: true
      },
      {
        field: "network",
        pattern: /\bDSNY?P?\b/i,
        transform: toValue("Disney"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bH(MAX|BO)\b/i,
        transform: toValue("HBO"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bSHOWTIME\b/i,
        transform: toValue("Showtime"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bitunes\b/i,
        transform: toValue("iTunes"),
        remove: true
      },
      {
        field: "network",
        pattern: /\biT\b/,
        transform: toValue("iTunes"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bHULU\b/i,
        transform: toValue("Hulu"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bCBS\b/i,
        transform: toValue("CBS"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bNBC\b/i,
        transform: toValue("NBC"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bAMC\b/i,
        transform: toValue("AMC"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bPBS\b/i,
        transform: toValue("PBS"),
        remove: true
      },
      {
        field: "network",
        pattern: /\b(Crunchyroll|CR)\b/i,
        transform: toValue("Crunchyroll"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bVICE\b/,
        transform: toValue("VICE"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bSony\b/i,
        transform: toValue("Sony"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bHallmark\b/i,
        transform: toValue("Hallmark"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bAdult.?Swim\b/i,
        transform: toValue("Adult Swim"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bAnimal.?Planet|ANPL\b/i,
        transform: toValue("Animal Planet"),
        remove: true
      },
      {
        field: "network",
        pattern: /\bCartoon.?Network(?:.TOONAMI.BROADCAST)?\b/i,
        transform: toValue("Cartoon Network"),
        remove: true
      },
      // Group handlers (final)
      {
        field: "group",
        pattern: /\b(INFLATE|DEFLATE)\b/,
        remove: true
      },
      {
        field: "group",
        pattern: /\b(?:Erai-raws|Erai-raws\.com)\b/i,
        transform: toValue("Erai-raws"),
        remove: true
      },
      {
        field: "group",
        pattern: /^\[([^\[\]]+)]/
      },
      {
        field: "group",
        pattern: /\(([\w-]+)\)(?:$|\.\w{2,4}$)/
      },
      {
        field: "group",
        process: (title, m, result) => {
          const re = /^\[.+]$/;
          if (m.mValue && re.test(m.mValue)) {
            const endIndex = m.mIndex + m.mValue.length;
            for (const [key, km] of result.entries()) {
              if (km.mIndex > 0 && km.mIndex < endIndex) {
                m.value = null;
                return m;
              }
            }
          }
          m.mIndex = 0;
          m.mValue = "";
          return m;
        }
      },
      // Extension handler
      {
        field: "extension",
        pattern: /\.(3g2|3gp|avi|flv|mkv|mk3d|mov|mp2|mp4|m4v|mpe|mpeg|mpg|mpv|webm|wmv|ogm|divx|ts|m2ts|iso|vob|sub|idx|ttxt|txt|smi|srt|ssa|ass|vtt|nfo|html)$/i,
        transform: toLowercase()
      },
      // Final MP3 audio handler
      {
        field: "audio",
        pattern: /\bMP3\b/i,
        transform: toValueSet("MP3"),
        remove: true,
        keepMatching: true
      }
    ];
  }
});

// node_modules/@viren070/parse-torrent-title/dist/index.js
var Parser;
var init_dist = __esm({
  "node_modules/@viren070/parse-torrent-title/dist/index.js"() {
    "use strict";
    init_parser();
    init_handlers();
    init_transforms();
    init_processors();
    init_validators();
    init_handlers();
    Parser = class {
      constructor() {
        this.handlers = [];
      }
      /**
       * Add a custom handler to the parser
       * @param handler - The handler to add
       * @returns The parser instance for chaining
       */
      addHandler(handler) {
        if (!handler) {
          throw new Error("Handler cannot be undefined or null");
        }
        this.handlers.push(handler);
        return this;
      }
      /**
       * Add multiple custom handlers to the parser
       * @param handlers - Array of handlers to add
       * @returns The parser instance for chaining
       */
      addHandlers(handlers2) {
        if (!handlers2 || handlers2.length === 0) {
          throw new Error("Handlers array cannot be undefined, null, or empty");
        }
        if (handlers2.some((h) => h === null || h === void 0)) {
          throw new Error("Handlers array cannot contain null or undefined handlers");
        }
        this.handlers.push(...handlers2);
        return this;
      }
      /**
       * Add default handlers for specific fields
       * @param fields - Optional array of field names to include. If empty, all default handlers are added.
       * @returns The parser instance for chaining
       */
      addDefaultHandlers(...fields) {
        if (fields.length === 0) {
          this.handlers.push(...handlers);
        } else {
          const selectedFieldMap = new Set(fields);
          const selectedHandlers = handlers.filter((h) => selectedFieldMap.has(h.field));
          this.handlers.push(...selectedHandlers);
        }
        return this;
      }
      /**
       * Parse a torrent title using the configured handlers
       * @param title - The torrent title to parse
       * @returns Parsed result with extracted metadata and any custom fields
       * @template T - Optional type for custom fields added by custom handlers
       *
       * @example
       * // Without custom fields
       * const result = parser.parse('Movie.2024.1080p');
       *
       * @example
       * // With typed custom fields
       * const result = parser.parse<{ customId: number[] }>('Movie.2024.custom-123.1080p');
       * console.log(result.customId); // Type-safe access
       */
      parse(title) {
        return parse(title, this.handlers);
      }
    };
  }
});

// src/types.ts
var HDR_FLAG_HDR10, HDR_FLAG_DV, HDR_FLAG_HDR10_PLUS, HDR_FLAG_HLG;
var init_types2 = __esm({
  "src/types.ts"() {
    "use strict";
    HDR_FLAG_HDR10 = 1;
    HDR_FLAG_DV = 2;
    HDR_FLAG_HDR10_PLUS = 4;
    HDR_FLAG_HLG = 8;
  }
});

// src/parser.ts
var parser_exports = {};
__export(parser_exports, {
  parseCandidate: () => parseCandidate,
  parseReleaseName: () => parseReleaseName,
  parseSeasonEpisode: () => parseSeasonEpisode,
  parseSeasonEpisodeLib: () => parseSeasonEpisodeLib,
  parseSeeders: () => parseSeeders,
  parseSizeBytes: () => parseSizeBytes
});
function uniqueSortedInts(xs) {
  return Array.from(new Set(xs.filter((n) => Number.isFinite(n) && n > 0))).sort((a, b) => a - b);
}
function parseSeasonEpisodeLib(rawTitle) {
  const p = parseReleaseName(rawTitle);
  return { seasons: p.seasons, episodes: p.episodes, seasonPack: p.seasonPack };
}
function parseSeasonEpisode(rawTitle) {
  const usefulLines = (rawTitle ?? "").split(/[\r\n]/).filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^(?:size|seed(?:ers?)?|peers?):/i.test(trimmed)) return false;
    if (/^[\p{Extended_Pictographic}]/u.test(trimmed)) return false;
    return true;
  });
  if (usefulLines.length === 0) {
    return { seasons: [], episodes: [], seasonPack: false };
  }
  const seasons = [];
  const episodes = [];
  for (const title of usefulLines) {
    for (const m of title.matchAll(/\bS(\d{1,3})((?:[ ._-]?E\d{1,3})+(?:[ ._-]?-[ ._-]?E?\d{1,3})?)/gi)) {
      seasons.push(parseInt(m[1], 10));
      const epPart = m[2] ?? "";
      const eps = [];
      for (const em of epPart.matchAll(/E?(\d{1,3})/gi)) {
        const n = parseInt(em[1], 10);
        if (!Number.isNaN(n)) eps.push(n);
      }
      const rangeMatch = epPart.match(/E?(\d{1,3})[ ._-]?-[ ._-]?E?(\d{1,3})/i);
      if (rangeMatch) {
        const a = parseInt(rangeMatch[1], 10);
        const b = parseInt(rangeMatch[2], 10);
        if (Number.isFinite(a) && Number.isFinite(b) && a <= b && b - a <= 30) {
          for (let v = a; v <= b; v++) eps.push(v);
        }
      }
      episodes.push(...eps);
    }
    for (const m of title.matchAll(/\bS(\d{1,2})[ ._-]?-[ ._-]?S?(\d{1,2})\b/gi)) {
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      if (a <= b && b - a <= 20) for (let v = a; v <= b; v++) seasons.push(v);
    }
    {
      const re = new RegExp(`\\b${SEASON_WORD}s?[ ._:-]?(\\d{1,2})[ ._-]?(?:-|to|\u2013)[ ._-]?(\\d{1,2})\\b`, "giu");
      for (const m of title.matchAll(re)) {
        const a = parseInt(m[1], 10);
        const b = parseInt(m[2], 10);
        if (a <= b && b - a <= 20) for (let v = a; v <= b; v++) seasons.push(v);
      }
    }
    for (const m of title.matchAll(/\b(?:season|s)[ ._-]?(\d{1,2})\b(?!\d)(?!.*?E\d)/gi)) {
      seasons.push(parseInt(m[1], 10));
    }
    {
      const re = new RegExp(`\\b${SEASON_WORD}s?[ ._:-]?(\\d{1,2})\\b`, "giu");
      for (const m of title.matchAll(re)) {
        seasons.push(parseInt(m[1], 10));
      }
    }
    for (const m of title.matchAll(/\b(\d{1,2})x(\d{1,3})\b/gi)) {
      seasons.push(parseInt(m[1], 10));
      episodes.push(parseInt(m[2], 10));
    }
    {
      const re = new RegExp(`\\b${EPISODE_WORD}s?[ ._:-]?(\\d{1,3})(?:[ ._-]?(?:-|to|\u2013|\u0438\u0437|of)[ ._-]?(\\d{1,3}))?`, "giu");
      for (const m of title.matchAll(re)) {
        const a = parseInt(m[1], 10);
        const b = m[2] ? parseInt(m[2], 10) : null;
        if (b != null && Number.isFinite(a) && Number.isFinite(b) && a <= b && b - a <= 50) {
          for (let v = a; v <= b; v++) episodes.push(v);
        } else if (Number.isFinite(a)) {
          episodes.push(a);
        }
      }
    }
    if (seasons.length === 0) {
      for (const m of title.matchAll(/\bE(?:p|pisode)?[ ._-]?(\d{1,3})\b/gi)) {
        episodes.push(parseInt(m[1], 10));
      }
    }
    if (seasons.length === 0 && episodes.length === 0) {
      const abs = title.match(/(?:^|[\s\]])-\s(\d{1,3})(?=[\s\[(.]|$)/);
      if (abs) {
        const n = parseInt(abs[1], 10);
        if (Number.isFinite(n) && n >= 1 && n <= 999) episodes.push(n);
      }
    }
  }
  const uniqSeasons = uniqueSortedInts(seasons);
  const uniqEpisodes = uniqueSortedInts(episodes);
  const completeHint = /\b(?:complete|completa|completo|complet|komplett|полная|полный|complète)\b/iu.test(usefulLines.join(" "));
  const seasonPack = uniqSeasons.length > 0 && uniqEpisodes.length === 0 || uniqEpisodes.length > 5 || uniqSeasons.length > 1 || completeHint && uniqEpisodes.length === 0;
  return { seasons: uniqSeasons, episodes: uniqEpisodes, seasonPack };
}
function mapResolution(raw) {
  if (!raw) return "unknown";
  const v = raw.toLowerCase();
  if (v === "4k" || v === "2160p" || v === "uhd") return "2160p";
  if (v === "1080p" || v === "fhd") return "1080p";
  if (v === "720p" || v === "hd") return "720p";
  if (v === "480p" || v === "576p" || v === "sd") return "480p";
  return "unknown";
}
function mapCodec(raw) {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v === "hevc" || v === "h265" || v === "x265") return "h265";
  if (v === "avc" || v === "h264" || v === "x264") return "h264";
  if (v === "av1") return "av1";
  if (v === "vp9") return "vp9";
  if (v === "mpeg2" || v === "mpeg-2") return "mpeg2";
  return null;
}
function mapSourceTag(raw) {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (/\bremux\b/.test(v)) return "Remux";
  if (/\bblu-?ray\b|\bbdrip\b|\bbrrip\b|\bbd\b/.test(v)) return "BluRay";
  if (/\bweb[-. ]?dl\b/.test(v)) return "WEB-DL";
  if (/\bweb[-. ]?rip\b/.test(v)) return "WEBRip";
  if (/\bhdtv\b/.test(v)) return "HDTV";
  if (/\bdvdrip\b|\bdvd\b/.test(v)) return "DVDRip";
  if (/\bcam\b|\bhdcam\b|\bcamrip\b/.test(v)) return "CAM";
  if (/\bts\b|\btelesync\b|\bhdts\b/.test(v)) return "TS";
  return null;
}
function mapAudioCodec(raw) {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v === "truehd" || v === "atmos") return "truehd";
  if (v === "dtshd" || v === "dts-hd" || v === "dts hd ma") return "dts-hd";
  if (v === "dts") return "dts";
  if (v === "eac3" || v === "ddp" || v === "dd+" || v === "e-ac3" || v === "eac-3") return "eac3";
  if (v === "ac3" || v === "dd" || v === "dolby digital") return "ac3";
  if (v === "flac") return "flac";
  if (v === "aac") return "aac";
  if (v === "opus") return "opus";
  if (v === "mp3") return "mp3";
  return null;
}
function mapHdrFlags(hdr) {
  if (!hdr || hdr.length === 0) return 0;
  let flags = 0;
  for (const v of hdr) {
    const k = v.toLowerCase();
    if (k.includes("hdr10+")) flags |= HDR_FLAG_HDR10_PLUS;
    else if (k.includes("hdr")) flags |= HDR_FLAG_HDR10;
    if (k === "dv" || k.includes("dolby vision") || k.includes("dovi")) flags |= HDR_FLAG_DV;
    if (k === "hlg") flags |= HDR_FLAG_HLG;
  }
  return flags;
}
function parseReleaseName(rawTitle) {
  const lines = (rawTitle ?? "").split(/[\r\n]/).filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^(?:size|seed(?:ers?)?|peers?):/i.test(trimmed)) return false;
    if (/^[\p{Extended_Pictographic}]/u.test(trimmed)) return false;
    return true;
  });
  const merged = {};
  for (const line of lines) {
    const r = ptt.parse(line);
    if (!merged.title && r.title) merged.title = r.title;
    if (!merged.year && r.year) merged.year = r.year;
    if (!merged.resolution && r.resolution) merged.resolution = r.resolution;
    if (!merged.codec && r.codec) merged.codec = r.codec;
    if (!merged.quality && (r.quality || r.source)) merged.quality = r.quality ?? r.source;
    if (!merged.group && (r.group || r.encoder)) merged.group = r.group ?? r.encoder;
    if (!merged.hdr && r.hdr) merged.hdr = r.hdr;
    if (!merged.audio && r.audio) merged.audio = r.audio;
    if (!merged.audiochannels && (r.audiochannels || r.channels)) merged.audiochannels = r.audiochannels ?? r.channels;
    if (!merged.languages && (r.languages || r.language)) {
      merged.languages = r.languages ?? (r.language ? [r.language] : void 0);
    }
    if (r.seasons?.length) merged.seasons = [...merged.seasons ?? [], ...r.seasons];
    if (r.episodes?.length) merged.episodes = [...merged.episodes ?? [], ...r.episodes];
    if (r.complete) merged.complete = true;
    if (r.editions?.length) merged.editions = [...merged.editions ?? [], ...r.editions];
    if (r.extended) merged.editions = [...merged.editions ?? [], "Extended"];
  }
  const uniqSeasons = uniqueSortedInts(merged.seasons ?? []);
  const uniqEpisodes = uniqueSortedInts(merged.episodes ?? []);
  const seasonPack = !!merged.complete || uniqSeasons.length > 0 && uniqEpisodes.length === 0 || uniqEpisodes.length > 5 || uniqSeasons.length > 1;
  const audioList = (merged.audio ?? []).map((a) => a.toLowerCase());
  const audioCodec = mapAudioCodec(audioList.find((a) => a === "truehd" || a === "atmos")) ?? mapAudioCodec(audioList.find((a) => a === "dts-hd" || a === "dtshd")) ?? mapAudioCodec(audioList.find((a) => a === "dts")) ?? mapAudioCodec(audioList.find((a) => a === "eac3" || a === "ddp")) ?? mapAudioCodec(audioList.find((a) => a === "ac3" || a === "dd")) ?? mapAudioCodec(audioList[0]);
  let audioChannels = merged.audiochannels?.[0] ?? merged.channels?.[0] ?? null;
  if (!audioChannels && audioList.includes("atmos")) audioChannels = "Atmos";
  if (audioChannels === "atmos") audioChannels = "Atmos";
  let sourceTag = mapSourceTag(merged.quality ?? merged.source);
  if (sourceTag === "BluRay" && /\bremux\b/i.test(rawTitle ?? "")) {
    sourceTag = "Remux";
  }
  const langs = (merged.languages ?? []).map((l) => {
    const k = l.toLowerCase().trim();
    if (k === "multi audio" || k === "multi-audio") return "multi";
    if (k === "dual audio" || k === "dual-audio") return "dual";
    return k;
  });
  const cleanTitle2 = merged.title?.replace(/[._]+/g, " ").replace(/\s+/g, " ").trim() || null;
  const parsedYearNum = merged.year ? parseInt(merged.year, 10) : NaN;
  const parsedYear = Number.isFinite(parsedYearNum) ? parsedYearNum : null;
  const editions = Array.from(new Set(merged.editions ?? []));
  return {
    releaseGroup: merged.group ?? null,
    resolution: mapResolution(merged.resolution),
    codec: mapCodec(merged.codec),
    hdrFlags: mapHdrFlags(merged.hdr),
    audioCodec,
    audioChannels,
    languages: Array.from(new Set(langs)),
    sourceTag,
    parsedTitle: cleanTitle2,
    parsedYear,
    editions,
    seasons: uniqSeasons,
    episodes: uniqEpisodes,
    seasonPack
  };
}
function parseCandidate(candidate) {
  const parsed = parseReleaseName(candidate.rawTitle);
  return {
    ...candidate,
    ...parsed
  };
}
function parseSizeBytes(text) {
  if (!text) return null;
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(b|kb|mb|gb|tb|kib|mib|gib|tib)/i);
  if (!match) return null;
  const value = parseFloat(match[1].replace(",", "."));
  if (Number.isNaN(value)) return null;
  const unit = match[2].toLowerCase();
  const multipliers = {
    b: 1,
    kb: 1024,
    kib: 1024,
    mb: 1024 ** 2,
    mib: 1024 ** 2,
    gb: 1024 ** 3,
    gib: 1024 ** 3,
    tb: 1024 ** 4,
    tib: 1024 ** 4
  };
  const mult = multipliers[unit];
  if (!mult) return null;
  return Math.round(value * mult);
}
function parseSeeders(text) {
  if (!text) return null;
  const labeled = text.match(/(?:seed(?:ers?)?|👥|👤|⬆)\s*[:=]?\s*(\d+)/i);
  if (labeled) return parseInt(labeled[1], 10);
  return null;
}
var ptt, SEASON_WORD, EPISODE_WORD;
var init_parser2 = __esm({
  "src/parser.ts"() {
    "use strict";
    init_dist();
    init_types2();
    ptt = new Parser().addHandlers(handlers);
    SEASON_WORD = "(?:season|\u0441\u0435\u0437\u043E\u043D|temporada|stagione|sezon|saison|staffel)";
    EPISODE_WORD = "(?:episode|episodio|epis\xF3dio|\u0441\u0435\u0440\u0438\u0438|\u0441\u0435\u0440\u0438\u044F|odcinek|folge|\xE9pisode|cap\xEDtulo|capitulo)";
  }
});

// src/sources/base.ts
import { createHash } from "node:crypto";
function candidateId(sourceId, sourceLocalKey) {
  return createHash("md5").update(`${sourceId}:${sourceLocalKey}`).digest("hex");
}
function redactUrl(url) {
  let out = url.replace(SECRET_PARAM_RE, "$1\u2022\u2022\u2022");
  out = out.replace(/\/([A-Za-z0-9]{20,})(?=\/|$)/g, "/\u2022\u2022\u2022");
  return out;
}
function hostLabel(url, label) {
  if (label) return label;
  try {
    return new URL(url).host;
  } catch {
    return "source";
  }
}
function describeFetchFailure(err) {
  if (err instanceof Error) {
    if (err.name === "AbortError" || err.name === "TimeoutError") return "timed out / aborted";
    const cause = err.cause;
    return cause?.code || cause?.message || err.message || err.name;
  }
  return String(err);
}
function readSourceConfig(row, fallback) {
  if (!row.config_json) return fallback;
  try {
    const parsed = JSON.parse(row.config_json);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}
async function loggedFetch(url, opts) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), opts.timeoutMs ?? 2e4);
  if (opts.signal) {
    if (opts.signal.aborted) ac.abort();
    else opts.signal.addEventListener("abort", () => ac.abort(), { once: true });
  }
  const label = hostLabel(url, opts.label);
  try {
    const res = await fetch(url, { signal: ac.signal, headers: opts.headers });
    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 200).replace(/\s+/g, " ").trim();
      logger.warn(
        "streams",
        `Indexer ${label} \u2192 HTTP ${res.status} ${res.statusText} on ${redactUrl(url)}` + (body ? ` \xB7 ${body}` : "")
      );
      return null;
    }
    return await res.text();
  } catch (err) {
    logger.warn("streams", `Indexer ${label} request failed (${describeFetchFailure(err)}) on ${redactUrl(url)}`);
    return null;
  } finally {
    clearTimeout(t);
  }
}
async function fetchJson(url, opts = {}) {
  const text = await loggedFetch(url, opts);
  if (text == null) return null;
  try {
    return JSON.parse(text);
  } catch {
    logger.warn(
      "streams",
      `Indexer ${hostLabel(url, opts.label)} returned non-JSON on ${redactUrl(url)} \xB7 ${text.slice(0, 160).replace(/\s+/g, " ").trim()}`
    );
    return null;
  }
}
async function fetchText(url, opts = {}) {
  return loggedFetch(url, opts);
}
var SECRET_PARAM_RE;
var init_base = __esm({
  "src/sources/base.ts"() {
    "use strict";
    init_log();
    SECRET_PARAM_RE = /([?&](?:apikey|api_key|apitoken|token|auth_token|passkey|password|pass|key|secret)=)[^&#]*/gi;
  }
});

// src/resolvers/base.ts
var base_exports = {};
__export(base_exports, {
  fetchAuthed: () => fetchAuthed,
  host: () => host,
  magnetFromHash: () => magnetFromHash,
  pickFileForEpisode: () => pickFileForEpisode
});
async function fetchAuthed(url, apiKey, opts = {}) {
  const scheme = opts.headerScheme ?? "bearer";
  const headers = { ...opts.headers ?? {} };
  let finalUrl = url;
  if (scheme === "bearer") headers.Authorization = `Bearer ${apiKey}`;
  else if (scheme === "x-api-key") headers["X-API-KEY"] = apiKey;
  else if (scheme === "raw") headers.Authorization = apiKey;
  else if (scheme === "query") {
    const sep = url.includes("?") ? "&" : "?";
    finalUrl = `${url}${sep}${opts.queryKeyName ?? "auth_token"}=${encodeURIComponent(apiKey)}`;
  }
  const method = opts.method ?? "GET";
  let label = opts.label;
  if (!label) {
    try {
      label = new URL(url).host;
    } catch {
      label = "debrid";
    }
  }
  const safeUrl = redactUrl(finalUrl).replace(
    new RegExp(`([?&]${opts.queryKeyName ?? "auth_token"}=)[^&#]*`, "i"),
    "$1\u2022\u2022\u2022"
  ).replace(/(?:•••\/){3,}•••/g, "\u2022\u2022\u2022(batch)");
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), opts.timeoutMs ?? 3e4);
  if (opts.signal) {
    if (opts.signal.aborted) ac.abort();
    else opts.signal.addEventListener("abort", () => ac.abort(), { once: true });
  }
  try {
    const res = await fetch(finalUrl, {
      method,
      headers,
      body: opts.body,
      signal: ac.signal
    });
    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 200).replace(/\s+/g, " ").trim();
      const disabledEndpoint = res.status === 403 && /disabled_endpoint|"error_code"\s*:\s*37/i.test(body);
      const hint = disabledEndpoint ? " \u2014 endpoint retired by the provider (not a key issue)" : res.status === 401 || res.status === 403 ? " \u2014 check the API key" : res.status === 429 ? " \u2014 rate limited" : "";
      logger.warn(
        "streams",
        `Debrid ${label} \u2192 HTTP ${res.status} ${res.statusText}${hint} on ${method} ${safeUrl}` + (body ? ` \xB7 ${body}` : "")
      );
      return null;
    }
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      logger.warn("streams", `Debrid ${label} returned non-JSON on ${method} ${safeUrl} \xB7 ${text.slice(0, 160).replace(/\s+/g, " ").trim()}`);
      return null;
    }
  } catch (err) {
    logger.warn("streams", `Debrid ${label} request failed (${describeFetchFailure(err)}) on ${method} ${safeUrl}`);
    return null;
  } finally {
    clearTimeout(t);
  }
}
function host(row, fallback) {
  return (row.host || fallback).replace(/\/$/, "");
}
function magnetFromHash(infoHash) {
  return `magnet:?xt=urn:btih:${infoHash}`;
}
function pickFileForEpisode(files, hint) {
  if (!files.length) return null;
  const videos = files.filter((f) => {
    if (NON_VIDEO_EXT.test(f.name)) return false;
    if (VIDEO_EXT.test(f.name)) return true;
    return f.size >= 50 * 1024 * 1024;
  });
  if (!videos.length) {
    return [...files].sort((a, b) => b.size - a.size)[0] ?? null;
  }
  if (hint?.episode || hint?.season) {
    const matches = videos.map((f) => ({ f, p: parseSeasonEpisodeLib(f.name) })).filter(({ p }) => {
      if (hint.season && p.seasons.length > 0 && !p.seasons.includes(hint.season)) return false;
      if (hint.episode && !p.episodes.includes(hint.episode)) return false;
      return true;
    }).sort((a, b) => b.f.size - a.f.size);
    if (matches.length > 0) return matches[0].f;
  }
  return [...videos].sort((a, b) => b.size - a.size)[0] ?? null;
}
var VIDEO_EXT, NON_VIDEO_EXT;
var init_base2 = __esm({
  "src/resolvers/base.ts"() {
    "use strict";
    init_log();
    init_base();
    init_parser2();
    VIDEO_EXT = /\.(mkv|mp4|avi|m4v|ts|webm|mov|m2ts)$/i;
    NON_VIDEO_EXT = /\.(srt|vtt|ass|ssa|sub|idx|nfo|txt|jpg|jpeg|png|gif|html|sfv|md5|pdf|exe)$/i;
  }
});

// ../rewind_addon_sdk/src/manifest.ts
var SDK_PROTOCOL_VERSION = 1;

// ../rewind_addon_sdk/src/addon.ts
function defineAddon(def) {
  return {
    manifest: def.manifest,
    async register(host2) {
      const { resources = {}, api } = await def.setup(host2);
      return { sdk: SDK_PROTOCOL_VERSION, manifest: def.manifest, resources, api };
    }
  };
}

// src/plugin.ts
init_host();

// src/pipeline.ts
init_host();
init_log();
import { createHash as createHash2 } from "node:crypto";

// src/filter.ts
function applyFilters(streams, prefs) {
  return streams.filter((s) => matchesPrefs(s, prefs));
}
function applySeasonEpisodeGate(streams, query) {
  if (query.kind === "movie") {
    return streams.filter(
      (s) => s.seasons.length === 0 && s.episodes.length === 0
    );
  }
  if (query.kind !== "series") return streams;
  const wantedSeason = query.season;
  const wantedEpisode = query.episode;
  if (!wantedSeason && !wantedEpisode) return streams;
  return streams.filter((s) => {
    const hasSeasons = s.seasons.length > 0;
    const hasEpisodes = s.episodes.length > 0;
    if (!hasSeasons && !hasEpisodes) return true;
    if (s.seasonPack && wantedSeason) {
      return s.seasons.includes(wantedSeason);
    }
    if (hasEpisodes && wantedEpisode) {
      if (!s.episodes.includes(wantedEpisode)) return false;
      if (hasSeasons && wantedSeason && !s.seasons.includes(wantedSeason)) {
        return false;
      }
      return true;
    }
    if (hasSeasons && wantedSeason) return s.seasons.includes(wantedSeason);
    return true;
  });
}
function matchesPrefs(stream, prefs) {
  if (prefs.resolutions.length > 0 && !prefs.resolutions.includes(stream.resolution)) {
    return false;
  }
  if (prefs.codecs.length > 0) {
    if (!stream.codec || !prefs.codecs.includes(stream.codec)) return false;
  }
  if (!prefs.hdrAllowed && stream.hdrFlags > 0) return false;
  if (stream.sizeBytes != null) {
    const mb = stream.sizeBytes / (1024 * 1024);
    if (prefs.sizeMinMb != null && mb < prefs.sizeMinMb) return false;
    if (prefs.sizeMaxMb != null && mb > prefs.sizeMaxMb) return false;
  }
  if (prefs.excludedLanguages.length > 0 && stream.languages.length > 0) {
    const allExcluded = stream.languages.every((l) => prefs.excludedLanguages.includes(l));
    if (allExcluded) return false;
  }
  if (prefs.languages.length > 0 && stream.languages.length > 0) {
    const hit = stream.languages.some((l) => prefs.languages.includes(l));
    if (!hit) return false;
  }
  if (prefs.minSeeders != null && stream.seeders != null) {
    if (stream.seeders < prefs.minSeeders) return false;
  }
  return true;
}
function applyAvailabilityFilters(streams, prefs) {
  if (!prefs.excludeUncached) return streams;
  return streams.filter((s) => s.cachedOnDebrid || s.assumedCached);
}
function parseStreamPrefs(row) {
  const safeJson = (s, fallback) => {
    try {
      return JSON.parse(s);
    } catch {
      return fallback;
    }
  };
  const CODEC_ALIASES = {
    hevc: "h265",
    x265: "h265",
    avc: "h264",
    x264: "h264"
  };
  const VALID_CODECS = /* @__PURE__ */ new Set(["h264", "h265", "av1", "vp9", "mpeg2"]);
  const normalizeCodecs = (raw) => raw.map((c) => CODEC_ALIASES[c.toLowerCase()] ?? c).filter((c) => VALID_CODECS.has(c));
  const scope = row.binge_pin_scope === "series" ? "series" : "season";
  return {
    resolutions: safeJson(row.resolutions_json, []),
    codecs: normalizeCodecs(safeJson(row.codecs_json, [])),
    hdrAllowed: row.hdr_allowed === 1,
    sizeMinMb: row.size_min_mb,
    sizeMaxMb: row.size_max_mb,
    languages: safeJson(row.languages_json, []),
    excludedLanguages: safeJson(row.excluded_languages_json ?? "[]", []),
    sortOrder: safeJson(row.sort_order_json, ["resolution", "cached", "seeders", "size"]),
    bingePinReleaseGroup: row.binge_pin_release_group === 1,
    minSeeders: row.min_seeders,
    excludeUncached: row.exclude_uncached === 1,
    bingeOnlySeasonPacks: (row.binge_only_season_packs ?? 0) === 1,
    bingeStrictReleaseGroup: (row.binge_strict_release_group ?? 0) === 1,
    bingePinScope: scope
  };
}

// src/pipeline.ts
init_parser2();

// src/resolvers/alldebrid.ts
init_base2();
var AD_HOST = "https://api.alldebrid.com/v4";
var AllDebridResolver = class {
  constructor(row) {
    this.row = row;
    this.provider = "alldebrid";
    this.accepts = ["torrent"];
    this.apiKey = row.api_key ?? "";
  }
  async checkAvailability(candidates, signal) {
    const out = /* @__PURE__ */ new Map();
    if (!this.apiKey) return out;
    const hashes = candidates.filter((c) => c.infoHash);
    if (hashes.length === 0) return out;
    const BATCH = 50;
    for (let i = 0; i < hashes.length; i += BATCH) {
      const slice = hashes.slice(i, i + BATCH);
      const params = new URLSearchParams();
      params.set("agent", "rewind");
      for (const c of slice) params.append("magnets[]", c.infoHash);
      const data = await fetchAuthed(
        `${AD_HOST}/magnet/instant?${params.toString()}`,
        this.apiKey,
        { headerScheme: "query", queryKeyName: "apikey", signal }
      );
      const byHash = /* @__PURE__ */ new Map();
      for (const m of data?.data?.magnets ?? []) {
        if (m.hash) byHash.set(m.hash.toLowerCase(), m.instant === true);
      }
      for (const c of slice) out.set(c.id, byHash.get(c.infoHash) ?? false);
    }
    return out;
  }
  async resolve(candidate, signal, hint) {
    if (!this.apiKey || !candidate.infoHash) return null;
    const uploadBody = new URLSearchParams();
    uploadBody.set("agent", "rewind");
    uploadBody.append("magnets[]", magnetFromHash(candidate.infoHash));
    const uploaded = await fetchAuthed(
      `${AD_HOST}/magnet/upload?apikey=${encodeURIComponent(this.apiKey)}`,
      this.apiKey,
      {
        method: "POST",
        headerScheme: "raw",
        // already in URL
        body: uploadBody,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal
      }
    );
    const mag = uploaded?.data?.magnets?.[0];
    if (!mag?.id) return null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const status = await fetchAuthed(
        `${AD_HOST}/magnet/status?id=${mag.id}&apikey=${encodeURIComponent(this.apiKey)}`,
        this.apiKey,
        { headerScheme: "raw", signal }
      );
      const m = status?.data?.magnets;
      if (m?.links?.length) {
        const { pickFileForEpisode: pickFileForEpisode2 } = await Promise.resolve().then(() => (init_base2(), base_exports));
        const pickable = m.links.map((l, i) => ({ id: i, name: l.filename, size: l.size }));
        const chosen = pickFileForEpisode2(pickable, hint) ?? pickable[0];
        const link = m.links[chosen.id];
        if (!link) return null;
        const unlocked = await fetchAuthed(
          `${AD_HOST}/link/unlock?link=${encodeURIComponent(link.link)}&apikey=${encodeURIComponent(this.apiKey)}`,
          this.apiKey,
          { headerScheme: "raw", signal }
        );
        return unlocked?.data?.link ?? link.link;
      }
      await sleep(2e3);
    }
    return null;
  }
};
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// src/resolvers/nzbdav.ts
init_log();
init_base2();
init_base();
var DEFAULT_POLL_MS = 2e3;
var DEFAULT_MAX_WAIT_MS = 9e4;
var DEFAULT_CONTENT_PREFIX = "/content";
var NzbDavResolver = class {
  constructor(row) {
    this.provider = "nzbdav";
    this.accepts = ["usenet"];
    this.host = (row.host ?? "").replace(/\/$/, "");
    this.apiKey = row.api_key ?? "";
    const cfg = parseConfig(row.config_json);
    this.publicHost = (cfg.publicHost ?? this.host).replace(/\/$/, "");
    this.webdavUser = cfg.webdavUser;
    this.webdavPassword = cfg.webdavPassword;
    this.pollIntervalMs = cfg.pollIntervalMs ?? DEFAULT_POLL_MS;
    this.maxWaitMs = cfg.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;
    this.contentPathPrefix = cfg.contentPathPrefix ?? DEFAULT_CONTENT_PREFIX;
  }
  async checkAvailability(candidates, _signal) {
    const out = /* @__PURE__ */ new Map();
    for (const c of candidates) if (c.nzbId) out.set(c.id, true);
    return out;
  }
  async resolve(candidate, signal, hint) {
    if (!this.host || !candidate.nzbId) return null;
    const category = pickCategory(hint, candidate);
    const jobLabel = sanitiseJobLabel(candidate.rawTitle || candidate.description || candidate.id);
    const added = await this.sabRequest({
      mode: "addurl",
      name: candidate.nzbId,
      cat: category,
      nzbname: jobLabel,
      output: "json"
    }, signal);
    if (!added?.status || !added.nzo_ids?.length) return null;
    const nzoId = added.nzo_ids[0];
    const slot = await this.waitForCompletion(nzoId, signal);
    if (!slot) return null;
    const folderName = basename(slot.storage ?? slot.name ?? jobLabel);
    const jobCategory = slot.category ?? category;
    const folderUrl = `${this.host}${this.contentPathPrefix}/${encodeSegment(jobCategory)}/${encodeSegment(folderName)}`;
    const files = await this.listWebdavFiles(folderUrl, signal);
    if (!files.length) return null;
    const chosen = pickFileForEpisode(
      files.map((f, i) => ({ id: i, name: f.name, size: f.size })),
      hint
    );
    if (!chosen) return null;
    const chosenFile = files[chosen.id];
    const publicFolder = `${this.publicHost}${this.contentPathPrefix}/${encodeSegment(jobCategory)}/${encodeSegment(folderName)}`;
    return embedBasicAuth(`${publicFolder}/${encodeSegment(chosenFile.name)}`, this.webdavUser, this.webdavPassword);
  }
  async sabRequest(params, signal) {
    const sp = new URLSearchParams({ ...params, apikey: this.apiKey });
    const url = `${this.host}${this.sabApiPath()}?${sp.toString()}`;
    try {
      const res = await fetch(url, {
        headers: { "x-api-key": this.apiKey },
        signal
      });
      if (!res.ok) {
        const body = (await res.text().catch(() => "")).slice(0, 200).replace(/\s+/g, " ").trim();
        const hint = res.status === 401 || res.status === 403 ? " \u2014 check the API key" : "";
        logger.warn(
          "streams",
          `Usenet ${this.host} (SABnzbd mode=${params.mode ?? "?"}) \u2192 HTTP ${res.status} ${res.statusText}${hint} on ${redactUrl(url)}` + (body ? ` \xB7 ${body}` : "")
        );
        return null;
      }
      return await res.json();
    } catch (err) {
      logger.warn("streams", `Usenet ${this.host} (SABnzbd mode=${params.mode ?? "?"}) request failed (${describeFetchFailure(err)})`);
      return null;
    }
  }
  /** Override point so AltMount can swap to its own API path. */
  sabApiPath() {
    return "/api";
  }
  async waitForCompletion(nzoId, signal) {
    const deadline = Date.now() + this.maxWaitMs;
    while (Date.now() < deadline) {
      if (signal?.aborted) return null;
      const history = await this.sabRequest({
        mode: "history",
        nzo_ids: nzoId,
        output: "json"
      }, signal);
      const slot = history?.history?.slots?.find((s) => s.nzo_id === nzoId);
      if (slot?.status?.toLowerCase() === "completed") return slot;
      if (slot?.status?.toLowerCase() === "failed") return null;
      await sleep2(this.pollIntervalMs, signal);
    }
    return null;
  }
  async listWebdavFiles(folderUrl, signal) {
    const headers = {
      Depth: "infinity",
      "Content-Type": "application/xml"
    };
    const basic = basicAuthHeader(this.webdavUser, this.webdavPassword);
    if (basic) headers.Authorization = basic;
    try {
      const res = await fetch(folderUrl, { method: "PROPFIND", headers, signal });
      if (!res.ok) {
        logger.warn("streams", `Usenet ${this.host} WebDAV PROPFIND \u2192 HTTP ${res.status} ${res.statusText} on ${redactUrl(folderUrl)}`);
        return [];
      }
      const xml = await res.text();
      return parsePropfindFiles(xml, folderUrl);
    } catch (err) {
      logger.warn("streams", `Usenet ${this.host} WebDAV PROPFIND failed (${describeFetchFailure(err)}) on ${redactUrl(folderUrl)}`);
      return [];
    }
  }
};
function parseConfig(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function pickCategory(hint, c) {
  if (hint?.season != null || hint?.episode != null) return "TV";
  const title = (c.rawTitle || c.description || "").toLowerCase();
  return /s\d{2}e\d{2}|season|episode/.test(title) ? "TV" : "Movies";
}
function sanitiseJobLabel(s) {
  const cleaned = s.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/[^\x20-\x7E]/g, "").replace(/[/\\]/g, "_").replace(/\s+/g, " ").trim().slice(0, 240);
  return cleaned || "rewind-nzb";
}
function basename(p) {
  const parts = p.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts[parts.length - 1] ?? p;
}
function encodeSegment(s) {
  return s.split("/").map((p) => encodeURIComponent(p)).join("/");
}
function basicAuthHeader(user, pass) {
  if (!user || !pass) return null;
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}
function embedBasicAuth(url, user, pass) {
  if (!user || !pass) return url;
  return url.replace(/^(https?:\/\/)/i, (m) => `${m}${encodeURIComponent(user)}:${encodeURIComponent(pass)}@`);
}
async function sleep2(ms, signal) {
  await new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      resolve();
    }, { once: true });
  });
}
var VIDEO_EXT2 = /\.(mkv|mp4|avi|m4v|ts|webm|mov|m2ts)$/i;
function parsePropfindFiles(xml, baseUrl) {
  const stripped = xml.replace(/<\/?[a-z0-9]+:/gi, (m2) => m2.replace(/[a-z0-9]+:/i, ""));
  const items = [];
  const responseRe = /<response>([\s\S]*?)<\/response>/gi;
  let m;
  const baseHrefPath = (() => {
    try {
      return new URL(baseUrl).pathname.replace(/\/$/, "");
    } catch {
      return "";
    }
  })();
  while ((m = responseRe.exec(stripped)) !== null) {
    const block = m[1];
    const href = /<href>([\s\S]*?)<\/href>/i.exec(block)?.[1]?.trim();
    if (!href) continue;
    const isCollection = /<resourcetype>[\s\S]*?<collection\s*\/?>[\s\S]*?<\/resourcetype>/i.test(block);
    if (isCollection) continue;
    const lengthStr = /<getcontentlength>([\s\S]*?)<\/getcontentlength>/i.exec(block)?.[1]?.trim();
    const size = lengthStr ? parseInt(lengthStr, 10) || 0 : 0;
    let hrefPath;
    try {
      hrefPath = new URL(href, baseUrl).pathname;
    } catch {
      hrefPath = href;
    }
    if (baseHrefPath && hrefPath.startsWith(baseHrefPath)) {
      hrefPath = hrefPath.slice(baseHrefPath.length);
    }
    const name = decodeURIComponent(basename(hrefPath));
    if (!name) continue;
    if (!VIDEO_EXT2.test(name) && size < 50 * 1024 * 1024) continue;
    items.push({ name, size });
  }
  return items;
}

// src/resolvers/altmount.ts
var AltMountResolver = class extends NzbDavResolver {
  constructor(row) {
    let cfg = {};
    try {
      cfg = JSON.parse(row.config_json || "{}");
    } catch {
    }
    if (cfg.contentPathPrefix == null) cfg.contentPathPrefix = "/webdav";
    super({ ...row, config_json: JSON.stringify(cfg) });
    this.provider = "altmount";
  }
  sabApiPath() {
    return "/sabnzbd/api";
  }
};

// src/resolvers/debridlink.ts
init_base2();
var DL_HOST = "https://debrid-link.com/api/v2";
var DebridLinkResolver = class {
  constructor(row) {
    this.row = row;
    this.provider = "debridlink";
    this.accepts = ["torrent"];
    this.apiKey = row.api_key ?? "";
  }
  async checkAvailability(candidates, signal) {
    const out = /* @__PURE__ */ new Map();
    if (!this.apiKey) return out;
    const torrents = candidates.filter((c) => c.infoHash);
    if (torrents.length === 0) return out;
    const BATCH = 25;
    for (let i = 0; i < torrents.length; i += BATCH) {
      const slice = torrents.slice(i, i + BATCH);
      const params = new URLSearchParams();
      params.set("url", slice.map((c) => magnetFromHash(c.infoHash)).join(","));
      const data = await fetchAuthed(
        `${DL_HOST}/seedbox/cached?${params.toString()}`,
        this.apiKey,
        { signal }
      );
      const byHash = data?.value ?? {};
      for (const c of slice) out.set(c.id, byHash[c.infoHash] === true);
    }
    return out;
  }
  async resolve(candidate, signal, hint) {
    if (!this.apiKey || !candidate.infoHash) return null;
    const added = await fetchAuthed(
      `${DL_HOST}/seedbox/add`,
      this.apiKey,
      {
        method: "POST",
        body: new URLSearchParams({ url: magnetFromHash(candidate.infoHash) }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal
      }
    );
    const id = added?.value?.id;
    if (!id) return null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const list = await fetchAuthed(
        `${DL_HOST}/seedbox/list?ids=${id}`,
        this.apiKey,
        { signal }
      );
      const files = list?.value?.[0]?.files ?? [];
      if (files.length) {
        const { pickFileForEpisode: pickFileForEpisode2 } = await Promise.resolve().then(() => (init_base2(), base_exports));
        const pickable = files.map((f, i) => ({ id: i, name: f.name, size: f.size }));
        const chosen = pickFileForEpisode2(pickable, hint);
        if (chosen) {
          const file = files[chosen.id];
          if (file?.downloadUrl) return file.downloadUrl;
        }
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    return null;
  }
};

// src/resolvers/easydebrid.ts
init_base2();
var ED_HOST = "https://easydebrid.com/api/v1";
var EasyDebridResolver = class {
  constructor(row) {
    this.row = row;
    this.provider = "easydebrid";
    this.accepts = ["torrent"];
    this.apiKey = row.api_key ?? "";
  }
  async checkAvailability(candidates, signal) {
    const out = /* @__PURE__ */ new Map();
    if (!this.apiKey) return out;
    const torrents = candidates.filter((c) => c.infoHash);
    if (torrents.length === 0) return out;
    const BATCH = 50;
    for (let i = 0; i < torrents.length; i += BATCH) {
      const slice = torrents.slice(i, i + BATCH);
      const data = await fetchAuthed(
        `${ED_HOST}/link/lookup`,
        this.apiKey,
        {
          method: "POST",
          body: JSON.stringify({ urls: slice.map((c) => magnetFromHash(c.infoHash)) }),
          headers: { "Content-Type": "application/json" },
          signal
        }
      );
      const cached = data?.cached ?? [];
      slice.forEach((c, idx) => out.set(c.id, cached[idx] === true));
    }
    return out;
  }
  async resolve(candidate, signal, hint) {
    if (!this.apiKey || !candidate.infoHash) return null;
    const data = await fetchAuthed(
      `${ED_HOST}/link/generate`,
      this.apiKey,
      {
        method: "POST",
        body: JSON.stringify({ url: magnetFromHash(candidate.infoHash) }),
        headers: { "Content-Type": "application/json" },
        signal
      }
    );
    if (!data?.files?.length) return null;
    const { pickFileForEpisode: pickFileForEpisode2 } = await Promise.resolve().then(() => (init_base2(), base_exports));
    const pickable = data.files.map((f, i) => ({ id: i, name: f.name, size: f.size }));
    const chosen = pickFileForEpisode2(pickable, hint);
    if (!chosen) return null;
    return data.files[chosen.id]?.url ?? null;
  }
};

// src/resolvers/offcloud.ts
init_base2();
var OC_HOST = "https://offcloud.com/api";
var OffcloudResolver = class {
  constructor(row) {
    this.row = row;
    this.provider = "offcloud";
    this.accepts = ["torrent"];
    this.apiKey = row.api_key ?? "";
  }
  async checkAvailability(candidates, signal) {
    const out = /* @__PURE__ */ new Map();
    if (!this.apiKey) return out;
    const torrents = candidates.filter((c) => c.infoHash);
    if (torrents.length === 0) return out;
    const BATCH = 50;
    for (let i = 0; i < torrents.length; i += BATCH) {
      const slice = torrents.slice(i, i + BATCH);
      const data = await fetchAuthed(
        `${OC_HOST}/cache?apiKey=${encodeURIComponent(this.apiKey)}`,
        this.apiKey,
        {
          method: "POST",
          headerScheme: "raw",
          body: JSON.stringify({ hashes: slice.map((c) => c.infoHash) }),
          headers: { "Content-Type": "application/json" },
          signal
        }
      );
      const cached = new Set((data?.cachedItems ?? []).map((h) => h.toLowerCase()));
      for (const c of slice) out.set(c.id, cached.has(c.infoHash));
    }
    return out;
  }
  async resolve(candidate, signal, hint) {
    if (!this.apiKey || !candidate.infoHash) return null;
    const added = await fetchAuthed(
      `${OC_HOST}/cloud?apiKey=${encodeURIComponent(this.apiKey)}`,
      this.apiKey,
      {
        method: "POST",
        headerScheme: "raw",
        body: JSON.stringify({ url: magnetFromHash(candidate.infoHash) }),
        headers: { "Content-Type": "application/json" },
        signal
      }
    );
    if (added?.isDirectLink && added.url) return added.url;
    const id = added?.requestId;
    if (!id) return null;
    const explored = await fetchAuthed(
      `${OC_HOST}/cloud/explore/${id}?apiKey=${encodeURIComponent(this.apiKey)}`,
      this.apiKey,
      { headerScheme: "raw", signal }
    );
    if (!Array.isArray(explored) || explored.length === 0) return null;
    if (hint?.episode || hint?.season) {
      const { parseSeasonEpisode: parseSeasonEpisode2 } = await Promise.resolve().then(() => (init_parser2(), parser_exports));
      const match = explored.find((url) => {
        const name = decodeURIComponent(url.split("/").pop() ?? "");
        const p = parseSeasonEpisode2(name);
        if (hint.season && p.seasons.length > 0 && !p.seasons.includes(hint.season)) return false;
        if (hint.episode && !p.episodes.includes(hint.episode)) return false;
        return true;
      });
      if (match) return match;
    }
    const biggest = [...explored].sort((a, b) => b.length - a.length)[0];
    return biggest ?? null;
  }
};

// src/resolvers/premiumize.ts
init_base2();
var PM_HOST = "https://www.premiumize.me/api";
var PremiumizeResolver = class {
  constructor(row) {
    this.row = row;
    this.provider = "premiumize";
    this.accepts = ["torrent"];
    this.apiKey = row.api_key ?? "";
  }
  async checkAvailability(candidates, signal) {
    const out = /* @__PURE__ */ new Map();
    if (!this.apiKey) return out;
    const torrents = candidates.filter((c) => c.infoHash);
    if (torrents.length === 0) return out;
    const BATCH = 50;
    for (let i = 0; i < torrents.length; i += BATCH) {
      const slice = torrents.slice(i, i + BATCH);
      const params = new URLSearchParams();
      params.set("apikey", this.apiKey);
      for (const c of slice) params.append("items[]", c.infoHash);
      const data = await fetchAuthed(
        `${PM_HOST}/cache/check?${params.toString()}`,
        this.apiKey,
        { headerScheme: "raw", method: "POST", signal }
      );
      const arr = data?.response ?? [];
      slice.forEach((c, idx) => out.set(c.id, arr[idx] === true));
    }
    return out;
  }
  async resolve(candidate, signal, hint) {
    if (!this.apiKey || !candidate.infoHash) return null;
    const params = new URLSearchParams();
    params.set("apikey", this.apiKey);
    params.set("src", magnetFromHash(candidate.infoHash));
    const data = await fetchAuthed(
      `${PM_HOST}/transfer/directdl`,
      this.apiKey,
      {
        method: "POST",
        body: params,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        headerScheme: "raw",
        signal
      }
    );
    if (!data?.content?.length) return null;
    const { pickFileForEpisode: pickFileForEpisode2 } = await Promise.resolve().then(() => (init_base2(), base_exports));
    const pickable = data.content.map((c, i) => ({
      id: i,
      name: c.path.split("/").pop() ?? c.path,
      size: c.size
    }));
    const chosen = pickFileForEpisode2(pickable, hint);
    if (!chosen) return null;
    const file = data.content[chosen.id];
    return file?.stream_link ?? file?.link ?? null;
  }
};

// src/resolvers/putio.ts
init_base2();
var PUTIO_HOST = "https://api.put.io/v2";
var PutioResolver = class {
  constructor(row) {
    this.row = row;
    this.provider = "putio";
    this.accepts = ["torrent"];
    this.apiKey = row.api_key ?? "";
  }
  async checkAvailability(candidates, _signal) {
    const out = /* @__PURE__ */ new Map();
    for (const c of candidates) if (c.infoHash) out.set(c.id, false);
    return out;
  }
  // hint currently ignored — Put.io doesn't expose a per-file picker in
  // the v2 transfers flow; the returned file_id is the parent folder if
  // the torrent contains multiple files. Walking /files/{id}/children to
  // pick by S×E is a follow-up; for now Put.io continues to serve the
  // root file as the prior code did.
  async resolve(candidate, signal, _hint) {
    if (!this.apiKey || !candidate.infoHash) return null;
    const body = new URLSearchParams({
      url: magnetFromHash(candidate.infoHash),
      save_parent_id: "0"
    });
    const added = await fetchAuthed(
      `${PUTIO_HOST}/transfers/add`,
      this.apiKey,
      {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal
      }
    );
    const id = added?.transfer?.id;
    if (!id) return null;
    let fileId = added.transfer.file_id;
    if (!fileId) {
      for (let attempt = 0; attempt < 4 && !fileId; attempt++) {
        await new Promise((r) => setTimeout(r, 2e3));
        const status = await fetchAuthed(
          `${PUTIO_HOST}/transfers/${id}`,
          this.apiKey,
          { signal }
        );
        fileId = status?.transfer?.file_id;
      }
    }
    if (!fileId) return null;
    return `${PUTIO_HOST}/files/${fileId}/download?oauth_token=${encodeURIComponent(this.apiKey)}`;
  }
};

// src/resolvers/realdebrid.ts
init_base2();
var RD_HOST = "https://api.real-debrid.com/rest/1.0";
var RealDebridResolver = class {
  constructor(row) {
    this.row = row;
    this.provider = "realdebrid";
    this.accepts = ["torrent"];
    // RD retired /torrents/instantAvailability (403 disabled_endpoint) — it can
    // no longer confirm what's cached. The pipeline skips its availability call
    // entirely and treats RD candidates as assumed-available + flagged unverified.
    this.verifiesCache = false;
    this.apiKey = row.api_key ?? "";
  }
  async checkAvailability(candidates, signal) {
    const out = /* @__PURE__ */ new Map();
    if (!this.apiKey) return out;
    const torrents = candidates.filter((c) => c.infoHash);
    if (torrents.length === 0) return out;
    const BATCH = 40;
    for (let i = 0; i < torrents.length; i += BATCH) {
      const slice = torrents.slice(i, i + BATCH);
      const path = slice.map((c) => c.infoHash).join("/");
      const data = await fetchAuthed(
        `${RD_HOST}/torrents/instantAvailability/${path}`,
        this.apiKey,
        { signal, label: "Real-Debrid" }
      );
      if (data === null) break;
      for (const c of slice) {
        const node = data[c.infoHash];
        out.set(c.id, isCached(node));
      }
    }
    return out;
  }
  async resolve(candidate, signal, hint) {
    if (!this.apiKey || !candidate.infoHash) return null;
    const addBody = new URLSearchParams({ magnet: magnetFromHash(candidate.infoHash) });
    const added = await fetchAuthed(`${RD_HOST}/torrents/addMagnet`, this.apiKey, {
      method: "POST",
      body: addBody,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal
    });
    if (!added?.id) return null;
    await fetchAuthed(`${RD_HOST}/torrents/selectFiles/${added.id}`, this.apiKey, {
      method: "POST",
      body: new URLSearchParams({ files: "all" }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal
    });
    let info = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      info = await fetchAuthed(
        `${RD_HOST}/torrents/info/${added.id}`,
        this.apiKey,
        { signal }
      );
      if (info?.status === "downloaded" && info.links?.length) break;
      await sleep3(2e3);
    }
    if (!info?.links?.length) return null;
    const videoFiles = info.files.map((f, i) => ({ ...f, _origIdx: i })).filter((f) => f.selected === 1);
    if (videoFiles.length === 0) return null;
    const pickable = videoFiles.map((f) => ({
      id: f._origIdx,
      // f.path is "/folder/Show.S01E05.mkv" — last segment is the filename.
      name: f.path.split("/").pop() ?? f.path,
      size: f.bytes
    }));
    const chosen = pickFileForEpisode(pickable, hint);
    if (!chosen) return null;
    const selectedIdx = videoFiles.findIndex((f) => f._origIdx === chosen.id);
    if (selectedIdx < 0) return null;
    const link = info.links[selectedIdx];
    if (!link) return null;
    const unrestricted = await fetchAuthed(
      `${RD_HOST}/unrestrict/link`,
      this.apiKey,
      {
        method: "POST",
        body: new URLSearchParams({ link }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal
      }
    );
    return unrestricted?.download ?? null;
  }
};
function isCached(node) {
  if (!node) return false;
  if (Array.isArray(node)) return node.length > 0;
  if (typeof node === "object") return Object.keys(node).length > 0;
  return false;
}
function sleep3(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// src/resolvers/torbox.ts
init_base2();
var TB_HOST = "https://api.torbox.app/v1/api";
var TorBoxResolver = class {
  constructor(row) {
    this.row = row;
    this.provider = "torbox";
    this.accepts = ["torrent", "usenet"];
    this.apiKey = row.api_key ?? "";
  }
  async checkAvailability(candidates, signal) {
    const out = /* @__PURE__ */ new Map();
    if (!this.apiKey) return out;
    const torrents = candidates.filter((c) => c.infoHash);
    if (torrents.length === 0) return out;
    const BATCH = 75;
    for (let i = 0; i < torrents.length; i += BATCH) {
      const slice = torrents.slice(i, i + BATCH);
      const params = new URLSearchParams();
      for (const c of slice) params.append("hash", c.infoHash);
      const data = await fetchAuthed(
        `${TB_HOST}/torrents/checkcached?${params.toString()}&format=object`,
        this.apiKey,
        { signal }
      );
      const cached = data?.data ?? {};
      for (const c of slice) out.set(c.id, !!cached[c.infoHash]);
    }
    return out;
  }
  async resolve(candidate, signal, hint) {
    const r = await this.resolveDetailed(candidate, signal, hint);
    return r && "url" in r ? r.url : null;
  }
  /**
   * Like {@link resolve} but also returns the NAME of the file we picked. The
   * adult library uses the name to reject dirty hashlist entries whose cached
   * TorBox content turns out to be unrelated (e.g. a mainstream show) — the
   * torrent's release name matched, but the actual file doesn't.
   *
   * For an UNCACHED torrent TorBox queues the download instead of failing; in
   * that case this returns a {@link QueuedResolve} (state + progress) so the
   * caller can tell the user "it's downloading" rather than "not found".
   */
  async resolveDetailed(candidate, signal, hint) {
    if (!this.apiKey) return null;
    if (candidate.infoHash) return this.resolveTorrent(candidate, signal, hint);
    if (candidate.nzbId) {
      const url = await this.resolveUsenet(candidate, signal, hint);
      return url ? { url, name: candidate.rawTitle ?? "" } : null;
    }
    return null;
  }
  async resolveTorrent(candidate, signal, hint) {
    const body = new FormData();
    body.append("magnet", magnetFromHash(candidate.infoHash));
    const created = await fetchAuthed(
      `${TB_HOST}/torrents/createtorrent`,
      this.apiKey,
      { method: "POST", body, signal }
    );
    const id = created?.data?.torrent_id;
    if (!id) return null;
    const info = await pollForReady(
      () => fetchAuthed(`${TB_HOST}/torrents/mylist?id=${id}&bypass_cache=true`, this.apiKey, { signal })
    );
    const files = info?.data?.files ?? [];
    if (!files.length) {
      const d = info?.data;
      if (!d) return null;
      const progress = typeof d.progress === "number" ? Math.round(d.progress * 100) : null;
      return { queued: true, state: d.download_state ?? null, progress, seeds: d.seeds ?? null };
    }
    const chosen = pickFileForEpisode(files, hint);
    if (!chosen) return null;
    const dl = await fetchAuthed(
      `${TB_HOST}/torrents/requestdl?token=${encodeURIComponent(this.apiKey)}&torrent_id=${id}&file_id=${chosen.id}`,
      this.apiKey,
      { signal }
    );
    return dl?.data ? { url: dl.data, name: chosen.name ?? "" } : null;
  }
  async resolveUsenet(candidate, signal, hint) {
    const body = new FormData();
    body.append("link", candidate.nzbId);
    const created = await fetchAuthed(
      `${TB_HOST}/usenet/createusenetdownload`,
      this.apiKey,
      { method: "POST", body, signal }
    );
    const id = created?.data?.usenet_id;
    if (!id) return null;
    const info = await pollForReady(
      () => fetchAuthed(`${TB_HOST}/usenet/mylist?id=${id}&bypass_cache=true`, this.apiKey, { signal })
    );
    const files = info?.data?.files ?? [];
    if (!files.length) return null;
    const chosen = pickFileForEpisode(files, hint);
    if (!chosen) return null;
    const dl = await fetchAuthed(
      `${TB_HOST}/usenet/requestdl?token=${encodeURIComponent(this.apiKey)}&usenet_id=${id}&file_id=${chosen.id}`,
      this.apiKey,
      { signal }
    );
    return dl?.data ?? null;
  }
};
async function pollForReady(fn) {
  let last = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const info = await fn();
    if (info?.data?.files?.length) return info;
    if (info?.data) last = info;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return last;
}

// src/resolvers/index.ts
var FACTORIES = {
  realdebrid: (row) => new RealDebridResolver(row),
  alldebrid: (row) => new AllDebridResolver(row),
  premiumize: (row) => new PremiumizeResolver(row),
  torbox: (row) => new TorBoxResolver(row),
  easydebrid: (row) => new EasyDebridResolver(row),
  debridlink: (row) => new DebridLinkResolver(row),
  offcloud: (row) => new OffcloudResolver(row),
  putio: (row) => new PutioResolver(row),
  nzbdav: (row) => new NzbDavResolver(row),
  altmount: (row) => new AltMountResolver(row)
};
function buildResolver(row) {
  const factory = FACTORIES[row.provider];
  return factory ? factory(row) : null;
}
var RESOLVER_PROVIDERS = Object.keys(FACTORIES);
var PROVIDER_NAMES = {
  realdebrid: "Real-Debrid",
  alldebrid: "AllDebrid",
  premiumize: "Premiumize",
  torbox: "TorBox",
  easydebrid: "EasyDebrid",
  debridlink: "DebridLink",
  offcloud: "Offcloud",
  putio: "put.io",
  nzbdav: "NZBDav",
  altmount: "AltMount"
};
var PROVIDER_TAGS = {
  realdebrid: "RD",
  alldebrid: "AD",
  premiumize: "PM",
  torbox: "TB",
  easydebrid: "ED",
  debridlink: "DL",
  offcloud: "OC",
  putio: "PIO",
  nzbdav: "NZB",
  altmount: "ALT"
};
function prettyProvider(provider) {
  return PROVIDER_NAMES[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}
function providerTag(provider) {
  return PROVIDER_TAGS[provider] ?? provider.slice(0, 3).toUpperCase();
}

// src/sort.ts
var RESOLUTION_RANK = {
  "2160p": 4,
  "1080p": 3,
  "720p": 2,
  "480p": 1,
  unknown: 0
};
function cacheRank(s) {
  if (s.cachedOnDebrid) return 2;
  if (s.assumedCached) return 1;
  return 0;
}
var SOURCE_TAG_RANK = {
  Remux: 7,
  BluRay: 6,
  "WEB-DL": 5,
  WEBRip: 4,
  HDTV: 3,
  DVDRip: 2,
  TS: 1,
  CAM: 0
};
function cmpForKey(key) {
  switch (key) {
    case "resolution":
      return (a, b) => RESOLUTION_RANK[b.resolution] - RESOLUTION_RANK[a.resolution];
    case "quality":
      return (a, b) => (SOURCE_TAG_RANK[b.sourceTag] ?? -1) - (SOURCE_TAG_RANK[a.sourceTag] ?? -1);
    case "cached":
      return (a, b) => cacheRank(b) - cacheRank(a);
    case "seeders":
      return (a, b) => (b.seeders ?? -1) - (a.seeders ?? -1);
    case "size":
      return (a, b) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0);
    case "size_desc":
      return (a, b) => (a.sizeBytes ?? Number.MAX_SAFE_INTEGER) - (b.sizeBytes ?? Number.MAX_SAFE_INTEGER);
    case "name":
      return (a, b) => a.name.localeCompare(b.name);
    case "source_priority":
      return () => 0;
    default:
      return () => 0;
  }
}
function sortStreams(streams, prefs) {
  if (prefs.sortOrder.length === 0) return streams;
  const userCmps = prefs.sortOrder.map(cmpForKey);
  return [...streams].sort((a, b) => {
    const aPack = a.seasonPack ? 1 : 0;
    const bPack = b.seasonPack ? 1 : 0;
    if (aPack !== bPack) return aPack - bPack;
    for (const cmp of userCmps) {
      const r = cmp(a, b);
      if (r !== 0) return r;
    }
    return 0;
  });
}
function pinReleaseGroup(streams, preferredGroup, opts) {
  if (!preferredGroup) return streams;
  const target = preferredGroup.toLowerCase();
  const matches = [];
  const rest = [];
  for (const s of streams) {
    if (s.releaseGroup && s.releaseGroup.toLowerCase() === target) {
      matches.push(s);
    } else {
      rest.push(s);
    }
  }
  if (opts?.strict) {
    if (matches.length > 0) return matches;
  }
  if (opts?.preferPacks) {
    const packs = matches.filter((s) => s.seasonPack);
    const nonPacks = matches.filter((s) => !s.seasonPack);
    return [...packs, ...nonPacks, ...rest];
  }
  return [...matches, ...rest];
}

// src/sources/comet.ts
init_host();
init_base();
var DEFAULT_HOST = "https://comet.elfhosted.com";
var COMET_SERVICE_BY_PROVIDER = {
  realdebrid: "realdebrid",
  alldebrid: "alldebrid",
  premiumize: "premiumize",
  torbox: "torbox",
  easydebrid: "easydebrid",
  debridlink: "debridlink",
  offcloud: "offcloud"
  // Putio + Pikpak are Comet-supported but we don't have parity resolvers,
  // so leave them out — passing them in would have Comet pre-restore on a
  // service Rewind can't pick up.
};
var CometSource = class {
  constructor(row) {
    this.row = row;
    this.type = "comet";
    // "direct" because for cached streams Comet returns a pre-resolved debrid
    // URL. Uncached candidates come back with `infoHash` and route through our
    // own debrid resolvers, exactly like external-addon does.
    this.kind = "direct";
  }
  async search(query, signal) {
    if (!query.imdbId) return [];
    const cfg = readSourceConfig(this.row, {
      manifestUrl: "",
      includeP2P: false,
      removeTrash: true,
      cachedOnly: false,
      publicToken: ""
    });
    const addonType = query.kind === "movie" ? "movie" : "series";
    const id = query.kind === "series" && query.season != null && query.episode != null ? `${query.imdbId}:${query.season}:${query.episode}` : query.imdbId;
    const base = await this.buildBaseUrl(cfg);
    if (!base) return [];
    const data = await fetchJson(
      `${base}/stream/${addonType}/${encodeURIComponent(id)}.json`,
      { signal }
    );
    if (!data?.streams?.length) return [];
    const usable = [];
    for (const s of data.streams) {
      if (!s.url && !s.infoHash) continue;
      if (isCometSyncTrigger(s)) continue;
      if (isCometErrorStream(s)) {
        const msg = (s.description ?? s.title ?? s.name ?? "").replace(/\s+/g, " ").trim();
        console.warn(`[streams:comet] Upstream error: ${msg.slice(0, 200)}`);
        continue;
      }
      usable.push(s);
    }
    return usable.map((s) => buildCandidate(this.row, s));
  }
  /**
   * Build the path-prefix that holds the base64 config (or use the manifest
   * URL the admin pasted, if any). Returns the trimmed base WITHOUT the
   * trailing `/manifest.json` so the search path can be appended directly.
   */
  async buildBaseUrl(cfg) {
    if (cfg.manifestUrl) {
      const i = cfg.manifestUrl.indexOf("/manifest.json");
      const base = i >= 0 ? cfg.manifestUrl.slice(0, i) : cfg.manifestUrl;
      return base.replace(/\/+$/, "");
    }
    const host2 = (this.row.url || DEFAULT_HOST).replace(/\/$/, "");
    const accounts = await getForgeHost().listStreamAccounts("debrid");
    const debridServices = accounts.filter((a) => a.enabled === 1 && a.api_key && COMET_SERVICE_BY_PROVIDER[a.provider]).map((a) => ({
      service: COMET_SERVICE_BY_PROVIDER[a.provider],
      apiKey: a.api_key ?? ""
    }));
    if (debridServices.length === 0 && !cfg.includeP2P) return null;
    const configBlob = {
      maxResultsPerResolution: 0,
      maxSize: 0,
      cachedOnly: cfg.cachedOnly,
      removeTrash: cfg.removeTrash,
      resultFormat: ["all"],
      debridServices,
      enableTorrent: cfg.includeP2P,
      scrapeDebridAccountTorrents: false,
      debridStreamProxyPassword: "",
      languages: { required: [], exclude: [], preferred: [] },
      resolutions: {},
      options: {
        remove_ranks_under: -1e10,
        allow_english_in_languages: false,
        remove_unknown_languages: false
      }
    };
    const configB64 = Buffer.from(JSON.stringify(configBlob)).toString("base64");
    const tokenSegment = cfg.publicToken ? `/s/${encodeURIComponent(cfg.publicToken)}` : "";
    return `${host2}${tokenSegment}/${configB64}`;
  }
};
function isCometErrorStream(s) {
  const name = (s.name ?? "").trim();
  if (/^\[(?:❌|⚠️?|ℹ️?|❗|⛔)\]/u.test(name)) return true;
  const hasHash = typeof s.infoHash === "string" && /^[a-f0-9]{40}$/i.test(s.infoHash);
  if (hasHash) return false;
  if (!s.url) return true;
  try {
    const parsed = new URL(s.url);
    return parsed.pathname === "/" || parsed.pathname === "";
  } catch {
    return true;
  }
}
function isCometSyncTrigger(s) {
  if (s.url) {
    try {
      if (new URL(s.url).pathname.includes("/debrid-sync/")) return true;
    } catch {
    }
  }
  return /🔄\]\s*Comet Sync\b/u.test(s.name ?? "");
}
function extractInfoHashFromCometPlaybackUrl(url) {
  if (!url) return null;
  const m = url.match(/\/playback\/([a-f0-9]{40})(?:\/|\?|$)/i);
  return m ? m[1].toLowerCase() : null;
}
function buildCandidate(row, s) {
  const rawTitle = s.title ?? s.behaviorHints?.filename ?? s.description ?? "";
  const directHash = s.infoHash?.toLowerCase();
  const extractedHash = directHash ?? extractInfoHashFromCometPlaybackUrl(s.url);
  const dropProxyUrl = !!extractedHash && !directHash;
  const localKey = extractedHash ? `${extractedHash}:${s.fileIdx ?? 0}` : s.url ?? "";
  return {
    id: candidateId(row.id, localKey),
    sourceType: "comet",
    sourceId: row.id,
    name: s.name ?? row.name,
    description: s.description ?? s.title ?? "",
    rawTitle,
    url: dropProxyUrl ? void 0 : s.url ?? void 0,
    infoHash: extractedHash ?? void 0,
    bingeGroup: s.behaviorHints?.bingeGroup,
    meta: { fileIdx: s.fileIdx, trackers: s.sources }
  };
}

// src/sources/easynews.ts
init_base();
var EasyNewsSource = class {
  constructor(row) {
    this.row = row;
    this.type = "easynews";
    this.kind = "direct";
  }
  async search(query, signal) {
    const cfg = readSourceConfig(this.row, { username: "", password: "" });
    const user = cfg.username || (this.row.api_key ?? "").split(":")[0] || "";
    const pass = cfg.password || (this.row.api_key ?? "").split(":")[1] || "";
    if (!user || !pass) return [];
    const term = query.kind === "movie" ? buildMovieQuery(query) : buildEpisodeQuery(query);
    if (!term) return [];
    const params = new URLSearchParams({
      fly: "2",
      sb: "1",
      pno: "1",
      pby: "250",
      u: "1",
      chxu: "1",
      chxgx: "1",
      st: "basic",
      gps: term,
      vv: "1",
      safeO: "0",
      s1: "relevance",
      s1d: "-",
      "fty[]": "VIDEO"
    });
    const baseHost = this.row.url || "https://members.easynews.com";
    const url = `${baseHost.replace(/\/$/, "")}/2.0/search/solr-search/?${params.toString()}`;
    const auth = Buffer.from(`${user}:${pass}`).toString("base64");
    const data = await fetchJson(url, {
      signal,
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json, text/javascript, */*; q=0.9"
      }
    });
    if (!data?.data?.length) return [];
    const downHost = data.downURL && data.dlFarm && data.dlPort ? `${data.downURL}/${data.dlFarm}/${data.dlPort}` : null;
    if (!downHost) return [];
    return data.data.map((raw) => buildCandidateFromItem(raw, downHost, user, pass, this.row.id, this.row.name)).filter((c) => c !== null);
  }
};
function buildCandidateFromItem(raw, downHost, user, pass, rowId, rowName) {
  let hash;
  let id;
  let filename;
  let ext;
  let sizeBytes;
  if (Array.isArray(raw)) {
    hash = typeof raw[0] === "string" ? raw[0] : void 0;
    filename = typeof raw[10] === "string" ? raw[10] : void 0;
    ext = typeof raw[11] === "string" ? raw[11] : void 0;
    const s = raw[4];
    sizeBytes = typeof s === "number" ? s : typeof s === "string" ? parseInt(s, 10) || void 0 : void 0;
  } else if (raw && typeof raw === "object") {
    const it = raw;
    hash = it.hash ?? it["0"];
    id = it.id;
    filename = it.fn ?? it["10"];
    ext = it.extension ?? it.ext ?? it["11"];
    const s = it.rawSize ?? it.size ?? it["4"];
    sizeBytes = typeof s === "number" ? s : typeof s === "string" ? parseInt(s, 10) || void 0 : void 0;
  }
  if (!hash || !ext) return null;
  const fullName = `${filename ?? ""}${ext}`;
  const pathFirst = `${hash}${id ?? ""}${ext}`;
  const directUrl = `${downHost}/${pathFirst}/${encodeURIComponent(fullName)}`;
  const authedUrl = directUrl.replace(
    /^https?:\/\//,
    (m) => `${m}${encodeURIComponent(user)}:${encodeURIComponent(pass)}@`
  );
  return {
    id: candidateId(rowId, hash),
    sourceType: "easynews",
    sourceId: rowId,
    name: rowName,
    description: fullName,
    rawTitle: fullName,
    url: authedUrl,
    sizeBytes
  };
}
function buildMovieQuery(query) {
  if (query.title && query.year) return `${query.title} ${query.year}`;
  if (query.imdbId) return query.imdbId;
  return query.title ?? null;
}
function buildEpisodeQuery(query) {
  if (!query.title) return query.imdbId ?? null;
  const s = String(query.season ?? 1).padStart(2, "0");
  const e = String(query.episode ?? 1).padStart(2, "0");
  return `${query.title} S${s}E${e}`;
}

// src/sources/external-addon.ts
init_base();
var ExternalAddonSource = class {
  constructor(row) {
    this.row = row;
    this.type = "external-addon";
    this.kind = "direct";
  }
  async search(query, signal) {
    if (!this.row.url) return [];
    const base = this.row.url.replace(/\/manifest\.json$/, "").replace(/\/$/, "");
    const addonType = query.kind === "movie" ? "movie" : "series";
    const id = query.kind === "series" && query.season != null && query.episode != null ? `${query.imdbId}:${query.season}:${query.episode}` : query.imdbId ?? "";
    if (!id) return [];
    const data = await fetchJson(
      `${base}/stream/${addonType}/${encodeURIComponent(id)}.json`,
      { signal }
    );
    if (!data?.streams?.length) return [];
    return data.streams.filter((s) => !!s.url || !!s.infoHash).map((s) => {
      const rawTitle = s.title ?? s.behaviorHints?.filename ?? s.description ?? "";
      const localKey = s.url ?? `${s.infoHash}:${s.fileIdx ?? 0}`;
      return {
        id: candidateId(this.row.id, localKey),
        sourceType: "external-addon",
        sourceId: this.row.id,
        name: s.name ?? this.row.name,
        description: s.description ?? s.title ?? "",
        rawTitle,
        // Forward whichever identifier the addon gave us. The pipeline
        // routes per-candidate: `url` → no resolver; `infoHash` → debrid.
        url: s.url ?? void 0,
        infoHash: s.infoHash?.toLowerCase(),
        bingeGroup: s.behaviorHints?.bingeGroup,
        meta: { fileIdx: s.fileIdx, trackers: s.sources }
      };
    });
  }
};

// src/sources/torbox-search.ts
init_base();
var TORBOX_SEARCH_HOST = "https://search-api.torbox.app";
var TorBoxSearchSource = class {
  constructor(row) {
    this.row = row;
    this.type = "torbox-search";
    // TorBox search emits both torrents and NZBs in a single response. We mark
    // it as torrent (the dominant case); the per-candidate fields (infoHash vs
    // nzbId) tell the pipeline which resolver category to use.
    this.kind = "torrent";
  }
  async search(query, signal) {
    if (!query.imdbId) return [];
    const cfg = readSourceConfig(this.row, {
      searchKind: "both"
    });
    const apiKey = this.row.api_key ?? "";
    if (!apiKey) return [];
    const tbImdbId = query.imdbId;
    const path = query.kind === "movie" ? `/torrents/imdb:${tbImdbId}` : `/torrents/imdb:${tbImdbId}?season=${query.season ?? 1}&episode=${query.episode ?? 1}`;
    const data = await fetchJson(`${TORBOX_SEARCH_HOST}${path}`, {
      signal,
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!data?.data) return [];
    const out = [];
    if (cfg.searchKind !== "usenet" && data.data.torrents?.length) {
      for (const t of data.data.torrents) {
        if (!t.hash) continue;
        out.push({
          id: candidateId(this.row.id, t.hash),
          sourceType: "torbox-search",
          sourceId: this.row.id,
          name: this.row.name,
          description: t.raw_title ?? t.title ?? "",
          rawTitle: t.raw_title ?? t.title ?? "",
          infoHash: t.hash.toLowerCase(),
          sizeBytes: t.size ?? void 0,
          seeders: t.last_known_seeders ?? void 0,
          meta: { tracker: t.tracker, magnet: t.magnet, age: t.age }
        });
      }
    }
    if (cfg.searchKind !== "torrent" && data.data.nzbs?.length) {
      for (const n of data.data.nzbs) {
        if (!n.nzb) continue;
        out.push({
          id: candidateId(this.row.id, n.nzb),
          sourceType: "torbox-search",
          sourceId: this.row.id,
          name: this.row.name,
          description: n.raw_title ?? n.title ?? "",
          rawTitle: n.raw_title ?? n.title ?? "",
          nzbId: n.nzb,
          sizeBytes: n.size ?? void 0,
          meta: { age: n.age }
        });
      }
    }
    return out;
  }
};

// src/sources/torrentio.ts
init_base();
var DEFAULT_HOST2 = "https://torrentio.strem.fun";
var TorrentioSource = class {
  constructor(row) {
    this.row = row;
    this.type = "torrentio";
    this.kind = "torrent";
  }
  async search(query, signal) {
    const cfg = readSourceConfig(this.row, { configToken: "" });
    const host2 = (this.row.url || DEFAULT_HOST2).replace(/\/manifest\.json$/i, "").replace(/\/$/, "");
    const tokenPath = cfg.configToken ? `/${cfg.configToken.replace(/^\/+|\/+$/g, "")}` : "";
    if (!query.imdbId) return [];
    const addonType = query.kind === "movie" ? "movie" : "series";
    const streamPath = addonType === "movie" ? `/stream/movie/${query.imdbId}.json` : `/stream/series/${query.imdbId}:${query.season ?? 1}:${query.episode ?? 1}.json`;
    const data = await fetchJson(`${host2}${tokenPath}${streamPath}`, { signal });
    if (!data?.streams?.length) return [];
    return data.streams.filter((s) => !!s.infoHash).map((s) => buildCandidate2(this.row, s));
  }
};
function buildCandidate2(row, s) {
  const rawTitle = s.title ?? s.behaviorHints?.filename ?? "";
  const sizeBytes = pullSize(rawTitle);
  const seeders = pullSeeders(rawTitle);
  return {
    id: candidateId(row.id, `${s.infoHash}:${s.fileIdx ?? 0}`),
    sourceType: "torrentio",
    sourceId: row.id,
    name: s.name ?? "Torrentio",
    description: rawTitle,
    rawTitle,
    infoHash: s.infoHash.toLowerCase(),
    sizeBytes: sizeBytes ?? void 0,
    seeders: seeders ?? void 0,
    bingeGroup: s.behaviorHints?.bingeGroup,
    meta: { fileIdx: s.fileIdx, trackers: s.sources }
  };
}
function pullSize(text) {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(b|kb|mb|gb|tb|kib|mib|gib|tib)\b/i);
  if (!m) return null;
  const v = parseFloat(m[1].replace(",", "."));
  if (!Number.isFinite(v)) return null;
  const mult = {
    b: 1,
    kb: 1024,
    kib: 1024,
    mb: 1024 ** 2,
    mib: 1024 ** 2,
    gb: 1024 ** 3,
    gib: 1024 ** 3,
    tb: 1024 ** 4,
    tib: 1024 ** 4
  };
  return Math.round(v * (mult[m[2].toLowerCase()] ?? 1));
}
function pullSeeders(text) {
  const m = text.match(/👤\s*(\d+)|seeders?\s*[:=]?\s*(\d+)/i);
  if (!m) return null;
  return parseInt(m[1] ?? m[2], 10);
}

// src/sources/torznab.ts
init_base();
var TorznabSource = class {
  constructor(row) {
    this.row = row;
    this.type = row.source_type;
    const isUsenet = row.source_type === "newznab" || row.source_type === "nzbhydra";
    this.kind = isUsenet ? "usenet" : "torrent";
  }
  async search(query, signal) {
    if (!this.row.url) return [];
    const cfg = readSourceConfig(this.row, {
      kind: this.kind === "usenet" ? "newznab" : "torznab",
      categories: this.kind === "usenet" ? query.kind === "movie" ? [2e3] : [5e3] : query.kind === "movie" ? [2e3] : [5e3],
      apiKey: this.row.api_key ?? ""
    });
    const params = new URLSearchParams();
    params.set("t", query.kind === "movie" ? "movie" : "tvsearch");
    if (cfg.apiKey || this.row.api_key) params.set("apikey", cfg.apiKey || this.row.api_key);
    if (cfg.categories?.length) params.set("cat", cfg.categories.join(","));
    if (query.imdbId) params.set("imdbid", query.imdbId.replace(/^tt/i, ""));
    if (query.kind === "series") {
      if (query.season != null) params.set("season", String(query.season));
      if (query.episode != null) params.set("ep", String(query.episode));
    }
    if (query.title && (query.kind === "series" || !query.imdbId)) {
      params.set("q", query.title);
    }
    const base = this.row.url.replace(/\/$/, "");
    const url = `${base}/api?${params.toString()}`;
    const xml = await fetchText(url, { signal });
    if (!xml) return [];
    return parseTorznabXml(xml, this.row, this.kind === "usenet");
  }
};
function parseTorznabXml(xml, row, isUsenet) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const title = pickTag(block, "title") ?? "";
    const link = pickTag(block, "link") ?? "";
    const guid = pickTag(block, "guid") ?? link;
    const description = pickTag(block, "description") ?? "";
    const attrs = pickAttrs(block);
    const enclosure = pickEnclosure(block);
    const nzbUrl = enclosure?.type === "application/x-nzb" ? enclosure.url : enclosure?.url ?? link;
    const infoHash = (attrs.get("infohash") ?? attrs.get("infoHash"))?.toLowerCase() ?? void 0;
    const seedersStr = attrs.get("seeders");
    const enclosureSize = enclosure?.length;
    const sizeStr = attrs.get("size") ?? pickTag(block, "size") ?? enclosureSize ?? void 0;
    const seeders = seedersStr ? parseInt(seedersStr, 10) : void 0;
    const sizeBytes = sizeStr ? parseInt(sizeStr, 10) : void 0;
    if (!link && !infoHash && !nzbUrl) continue;
    if (isUsenet) {
      if (!nzbUrl) continue;
      items.push({
        id: candidateId(row.id, guid || nzbUrl),
        sourceType: row.source_type,
        sourceId: row.id,
        name: row.name,
        description: description || title,
        rawTitle: title,
        nzbId: nzbUrl,
        // NZB download URL — usenet resolvers fetch + submit this.
        sizeBytes,
        meta: { guid }
      });
    } else if (infoHash) {
      items.push({
        id: candidateId(row.id, infoHash),
        sourceType: row.source_type,
        sourceId: row.id,
        name: row.name,
        description: description || title,
        rawTitle: title,
        infoHash,
        sizeBytes,
        seeders,
        meta: { guid, magnetLink: link.startsWith("magnet:") ? link : void 0 }
      });
    }
  }
  return items;
}
function pickTag(block, tag) {
  const r = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(r);
  if (!m) return void 0;
  return m[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}
function pickAttrs(block) {
  const out = /* @__PURE__ */ new Map();
  const r = /<(?:torznab|newznab):attr\s+name="([^"]+)"\s+value="([^"]*)"/g;
  let m;
  while ((m = r.exec(block)) !== null) {
    out.set(m[1].toLowerCase(), m[2]);
  }
  return out;
}
function pickEnclosure(block) {
  const m = /<enclosure\s+([^>]*?)\/?>/i.exec(block);
  if (!m) return null;
  const tag = m[1];
  const url = /\burl="([^"]*)"/i.exec(tag)?.[1];
  if (!url) return null;
  const length = /\blength="([^"]*)"/i.exec(tag)?.[1];
  const type = /\btype="([^"]*)"/i.exec(tag)?.[1];
  return { url, length, type };
}

// src/sources/zilean.ts
init_base();
var ZileanSource = class {
  constructor(row) {
    this.row = row;
    this.type = "zilean";
    this.kind = "torrent";
  }
  async search(query, signal) {
    if (!this.row.url) return [];
    if (!query.title) return [];
    const cfg = readSourceConfig(this.row, { resolution: "" });
    const params = new URLSearchParams();
    params.set("Query", query.title);
    if (query.year) params.set("Year", String(query.year));
    if (query.kind === "series") {
      if (query.season != null) params.set("Season", String(query.season));
      if (query.episode != null) params.set("Episode", String(query.episode));
    }
    if (cfg.resolution) params.set("Resolution", cfg.resolution);
    const base = this.row.url.replace(/\/$/, "");
    const headers = {};
    if (this.row.api_key) headers.Authorization = `Bearer ${this.row.api_key}`;
    const data = await fetchJson(
      `${base}/dmm/filtered?${params.toString()}`,
      { signal, headers }
    );
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.filter((item) => !!item.info_hash).map((item) => buildCandidate3(this.row, item));
  }
};
function buildCandidate3(row, item) {
  const rawTitle = item.raw_title ?? item.parsed_title ?? "";
  return {
    id: candidateId(row.id, item.info_hash),
    sourceType: "zilean",
    sourceId: row.id,
    name: row.name,
    description: rawTitle,
    rawTitle,
    infoHash: item.info_hash.toLowerCase(),
    sizeBytes: parseZileanSize(item.size),
    meta: {
      parsedTitle: item.parsed_title,
      year: item.year,
      season: item.season,
      episode: item.episode
    }
  };
}
function parseZileanSize(size) {
  if (size == null) return void 0;
  if (typeof size === "number") return size > 0 ? size : void 0;
  const m = String(size).match(/(\d+(?:[.,]\d+)?)\s*(b|kb|mb|gb|tb|kib|mib|gib|tib)\b/i);
  if (!m) {
    const n = parseInt(size, 10);
    return Number.isFinite(n) && n > 0 ? n : void 0;
  }
  const v = parseFloat(m[1].replace(",", "."));
  if (!Number.isFinite(v)) return void 0;
  const mult = {
    b: 1,
    kb: 1024,
    kib: 1024,
    mb: 1024 ** 2,
    mib: 1024 ** 2,
    gb: 1024 ** 3,
    gib: 1024 ** 3,
    tb: 1024 ** 4,
    tib: 1024 ** 4
  };
  return Math.round(v * (mult[m[2].toLowerCase()] ?? 1));
}

// src/sources/index.ts
var FACTORIES2 = {
  torrentio: (row) => new TorrentioSource(row),
  torznab: (row) => new TorznabSource(row),
  newznab: (row) => new TorznabSource(row),
  nzbhydra: (row) => new TorznabSource(row),
  zilean: (row) => new ZileanSource(row),
  comet: (row) => new CometSource(row),
  easynews: (row) => new EasyNewsSource(row),
  "torbox-search": (row) => new TorBoxSearchSource(row),
  "external-addon": (row) => new ExternalAddonSource(row)
};
function buildSource(row) {
  const factory = FACTORIES2[row.source_type];
  return factory ? factory(row) : null;
}
var SOURCE_TYPES = Object.keys(FACTORIES2);

// src/formatter.ts
var RES_MAP_NAMES = {
  "2160p": "4K",
  "1080p": "FHD",
  "720p": "HD",
  "480p": "SD",
  "unknown": ""
};
var RES_MAP_EMOJI = {
  "2160p": "\u{1F525} 4K",
  "1080p": "\u{1F680} FHD",
  "720p": "\u{1F4BF} HD",
  "480p": "\u{1F4FA} SD",
  "unknown": ""
};
var CATEGORY_STYLES = {
  title: [
    {
      id: "plain",
      label: "Plain (Dune Part Two)",
      render: (s) => s.parsedTitle ?? ""
    },
    {
      id: "withYear",
      label: "With year (Dune Part Two (2024))",
      render: (s) => {
        if (!s.parsedTitle) return "";
        return s.parsedYear ? `${s.parsedTitle} (${s.parsedYear})` : s.parsedTitle;
      }
    },
    {
      id: "withEdition",
      label: "With edition (Dune\u2026 \xB7 Director's Cut)",
      render: (s) => {
        if (!s.parsedTitle) return "";
        return s.editions.length > 0 ? `${s.parsedTitle} \xB7 ${s.editions.join(" \xB7 ")}` : s.parsedTitle;
      }
    },
    {
      id: "full",
      label: "Full (Dune Part Two (2024) \xB7 Director's Cut)",
      render: (s) => {
        if (!s.parsedTitle) return "";
        const yearPart = s.parsedYear ? ` (${s.parsedYear})` : "";
        const editionPart = s.editions.length > 0 ? ` \xB7 ${s.editions.join(" \xB7 ")}` : "";
        return `${s.parsedTitle}${yearPart}${editionPart}`;
      }
    },
    {
      id: "emoji",
      label: "Emoji (\u{1F3AC} Dune Part Two)",
      render: (s) => s.parsedTitle ? `\u{1F3AC} ${s.parsedTitle}` : ""
    }
  ],
  edition: [
    {
      id: "text",
      label: "Text (Director's Cut)",
      render: (s) => s.editions.join(" \xB7 ")
    },
    {
      id: "bracket",
      label: "Bracket ([Director's Cut])",
      render: (s) => s.editions.length > 0 ? s.editions.map((e) => `[${e}]`).join("") : ""
    },
    {
      id: "emoji",
      label: "Emoji (\u{1F3AC} Director's Cut)",
      render: (s) => s.editions.length > 0 ? `\u{1F3AC} ${s.editions.join(" \xB7 ")}` : ""
    }
  ],
  resolution: [
    {
      id: "numbers",
      label: "Numbers (2160p / 1080p)",
      render: (s) => s.resolution !== "unknown" ? s.resolution : ""
    },
    {
      id: "names",
      label: "Names (4K / FHD / HD)",
      render: (s) => RES_MAP_NAMES[s.resolution] ?? ""
    },
    {
      id: "emoji",
      label: "Emoji (\u{1F525} 4K)",
      render: (s) => RES_MAP_EMOJI[s.resolution] ?? ""
    }
  ],
  quality: [
    {
      id: "full",
      label: "Full (BluRay Remux)",
      render: (s) => s.sourceTag ?? ""
    },
    {
      id: "short",
      label: "Short (BR / RMX / WEB)",
      render: (s) => {
        if (!s.sourceTag) return "";
        const map = {
          BluRay: "BR",
          Remux: "RMX",
          "WEB-DL": "WEB",
          WEBRip: "WRP",
          HDTV: "HDTV",
          DVDRip: "DVD",
          CAM: "CAM",
          TS: "TS"
        };
        return map[s.sourceTag] ?? s.sourceTag;
      }
    },
    {
      id: "tagged",
      label: "Tagged ([BluRay])",
      render: (s) => s.sourceTag ? `[${s.sourceTag}]` : ""
    }
  ],
  hdr: [
    {
      id: "emoji",
      label: "Emoji (\u{1F308} HDR / \u{1F31F} DV)",
      render: (s) => renderHdr(s, "emoji")
    },
    {
      id: "text",
      label: "Text (HDR \xB7 DV)",
      render: (s) => renderHdr(s, "text")
    },
    {
      id: "bracket",
      label: "Bracket ([HDR][DV])",
      render: (s) => renderHdr(s, "bracket")
    }
  ],
  codec: [
    {
      id: "modern",
      label: "Modern (HEVC / AVC)",
      render: (s) => {
        if (!s.codec) return "";
        const map = { h265: "HEVC", h264: "AVC", av1: "AV1", vp9: "VP9", mpeg2: "MPEG-2" };
        return map[s.codec] ?? s.codec;
      }
    },
    {
      id: "encoder",
      label: "Encoder (x265 / x264)",
      render: (s) => {
        if (!s.codec) return "";
        const map = { h265: "x265", h264: "x264", av1: "AV1", vp9: "VP9", mpeg2: "MPEG-2" };
        return map[s.codec] ?? s.codec;
      }
    },
    {
      id: "emoji",
      label: "Emoji (\u{1F39E}\uFE0F HEVC)",
      render: (s) => {
        if (!s.codec) return "";
        const map = { h265: "HEVC", h264: "AVC", av1: "AV1", vp9: "VP9", mpeg2: "MPEG-2" };
        return `\u{1F39E}\uFE0F ${map[s.codec] ?? s.codec}`;
      }
    }
  ],
  audio: [
    {
      id: "text",
      label: "Text (Atmos / DTS-HD)",
      render: (s) => renderAudio(s)
    },
    {
      id: "emoji",
      label: "Emoji (\u{1F3A7} Atmos)",
      render: (s) => {
        const v = renderAudio(s);
        return v ? `\u{1F3A7} ${v}` : "";
      }
    }
  ],
  channels: [
    {
      id: "number",
      label: "Number (5.1 / 7.1)",
      render: (s) => s.audioChannels ?? ""
    },
    {
      id: "emoji",
      label: "Emoji (\u{1F50A} 5.1)",
      render: (s) => s.audioChannels ? `\u{1F50A} ${s.audioChannels}` : ""
    }
  ],
  languages: [
    {
      id: "flags",
      label: "Flags (\u{1F1FA}\u{1F1F8} \u{1F1EA}\u{1F1F8})",
      render: (s) => s.languages.map(langToFlag).filter(Boolean).join(" ")
    },
    {
      id: "codes",
      label: "Codes (EN \xB7 ES)",
      render: (s) => s.languages.map((l) => l.toUpperCase()).join(" \xB7 ")
    },
    {
      id: "compact",
      label: "Compact (\u{1F310} 3 langs)",
      render: (s) => s.languages.length > 0 ? `\u{1F310} ${s.languages.length} lang${s.languages.length > 1 ? "s" : ""}` : ""
    }
  ],
  sourceType: [
    {
      id: "emoji",
      label: "Emoji (\u26A1 Debrid / \u{1F331} P2P)",
      render: (s, ctx) => {
        if (s.url?.startsWith("magnet:") || s.infoHash) {
          if (s.assumedCached) return ctx.debridTag ? `\u2754 ${ctx.debridTag}` : "\u2754";
          if (!s.cachedOnDebrid) return "\u{1F331}";
          return ctx.debridTag ? `\u26A1 ${ctx.debridTag}` : "\u26A1";
        }
        if (s.nzbId) return "\u{1F4F0}";
        return s.url ? "\u{1F4BB}" : "";
      }
    },
    {
      id: "text",
      label: "Text ([Debrid] / [P2P])",
      render: (s, ctx) => {
        if (s.infoHash) {
          if (s.assumedCached) return ctx.debridTag ? `[${ctx.debridTag}?]` : "[Debrid?]";
          if (!s.cachedOnDebrid) return "[P2P]";
          return ctx.debridTag ? `[${ctx.debridTag}]` : "[Debrid]";
        }
        if (s.nzbId) return "[Usenet]";
        return s.url ? "[Web]" : "";
      }
    }
  ],
  cache: [
    {
      id: "emoji",
      label: "Emoji (\u26A1 / \u2754 / \u23F3)",
      render: (s, ctx) => {
        if (!s.resolverId) return "";
        if (s.assumedCached) return ctx.debridTag ? `\u2754 ${ctx.debridTag}` : "\u2754";
        if (!s.cachedOnDebrid) return "\u23F3";
        return ctx.debridTag ? `\u26A1 ${ctx.debridTag}` : "\u26A1";
      }
    },
    {
      id: "text",
      // Stremio-style: "[RD+]" = verified cached, "[RD?]" = assumed (provider
      // can't verify), "[RD ⏳]" = needs download. Shows which debrid + status.
      label: "Text ([RD+] / [RD?] / [Download])",
      render: (s, ctx) => {
        if (!s.resolverId) return "";
        if (s.assumedCached) return ctx.debridTag ? `[${ctx.debridTag}?]` : "[Cache?]";
        if (s.cachedOnDebrid) return ctx.debridTag ? `[${ctx.debridTag}+]` : "[Cached]";
        return ctx.debridTag ? `[${ctx.debridTag} \u23F3]` : "[Download]";
      }
    },
    {
      id: "name",
      label: "Provider name (Real-Debrid)",
      render: (s, ctx) => {
        if (!s.resolverId || !ctx.debridName) return "";
        if (s.assumedCached) return `${ctx.debridName} (unverified)`;
        return s.cachedOnDebrid ? ctx.debridName : `${ctx.debridName} (download)`;
      }
    }
  ],
  size: [
    {
      id: "smart",
      label: "Smart (4.5 GB)",
      render: (s) => s.sizeBytes ? formatBytes(s.sizeBytes) : ""
    },
    {
      id: "emoji",
      label: "Emoji (\u{1F4E6} 4.5 GB)",
      render: (s) => s.sizeBytes ? `\u{1F4E6} ${formatBytes(s.sizeBytes)}` : ""
    },
    {
      id: "compact",
      label: "Compact (4.5G)",
      render: (s) => s.sizeBytes ? formatBytesCompact(s.sizeBytes) : ""
    }
  ],
  seeders: [
    {
      id: "number",
      label: "Number (245)",
      render: (s) => s.seeders != null ? String(s.seeders) : ""
    },
    {
      id: "emoji",
      label: "Emoji (\u{1F464} 245)",
      render: (s) => s.seeders != null ? `\u{1F464} ${s.seeders}` : ""
    }
  ],
  releaseGroup: [
    {
      id: "text",
      label: "Text (FLUX)",
      render: (s) => s.releaseGroup ?? ""
    },
    {
      id: "bracket",
      label: "Bracket ([FLUX])",
      render: (s) => s.releaseGroup ? `[${s.releaseGroup}]` : ""
    },
    {
      id: "tagged",
      label: "Tagged (\u{1F3F7}\uFE0F FLUX)",
      render: (s) => s.releaseGroup ? `\u{1F3F7}\uFE0F ${s.releaseGroup}` : ""
    }
  ],
  seasonEpisode: [
    {
      id: "full",
      label: "Full (S01E05)",
      render: (s) => renderSeasonEpisode(s, "full")
    },
    {
      id: "short",
      label: "Short (1x05)",
      render: (s) => renderSeasonEpisode(s, "short")
    },
    {
      id: "compact",
      label: "Compact (s01\xB7e05)",
      render: (s) => renderSeasonEpisode(s, "compact")
    }
  ],
  episodeName: [
    {
      id: "plain",
      label: "Plain (Pilot)",
      render: (_s, ctx) => ctx.episodeName ?? ""
    },
    {
      id: "bracket",
      label: "Bracket ([Pilot])",
      render: (_s, ctx) => ctx.episodeName ? `[${ctx.episodeName}]` : ""
    },
    {
      id: "emoji",
      label: "Emoji (\u{1F3AC} Pilot)",
      render: (_s, ctx) => ctx.episodeName ? `\u{1F3AC} ${ctx.episodeName}` : ""
    }
  ],
  pack: [
    {
      id: "bracket",
      label: "Bracket ([Pack])",
      render: (s) => renderPack(s, "bracket")
    },
    {
      id: "emoji",
      label: "Emoji (\u{1F4E6} Pack)",
      render: (s) => renderPack(s, "emoji")
    },
    {
      id: "short",
      label: "Short ([S1 Pack])",
      render: (s) => renderPack(s, "short")
    }
  ],
  addon: [
    {
      id: "name",
      label: "Name (Comet)",
      render: (_s, ctx) => ctx.addonName ?? ""
    },
    {
      id: "bracket",
      label: "Bracket ([Comet])",
      render: (_s, ctx) => ctx.addonName ? `[${ctx.addonName}]` : ""
    },
    {
      id: "emoji",
      label: "Emoji (\u{1F50D} Comet)",
      render: (_s, ctx) => ctx.addonName ? `\u{1F50D} ${ctx.addonName}` : ""
    }
  ],
  filename: [
    {
      id: "full",
      label: "Full (full filename)",
      render: (s) => extractFilename(s)
    },
    {
      id: "truncated",
      label: "Truncated (40 chars)",
      render: (s) => {
        const f = extractFilename(s);
        return f.length > 40 ? f.slice(0, 37) + "\u2026" : f;
      }
    },
    {
      id: "emoji",
      label: "Emoji (\u{1F4C1} filename)",
      render: (s) => {
        const f = extractFilename(s);
        return f ? `\u{1F4C1} ${f}` : "";
      }
    }
  ],
  separator: [
    { id: "dot", label: "Dot ( \xB7 )", render: () => "\xB7" },
    { id: "pipe", label: "Pipe ( | )", render: () => "|" },
    { id: "dash", label: "Dash ( \u2013 )", render: () => "\u2013" },
    { id: "bullet", label: "Bullet ( \u2022 )", render: () => "\u2022" }
  ],
  newline: [{ id: "break", label: "New line", render: () => "\n" }]
};
var HDR_FLAG_HDR102 = 1;
var HDR_FLAG_DV2 = 2;
var HDR_FLAG_HDR10_PLUS2 = 4;
var HDR_FLAG_HLG2 = 8;
function renderHdr(s, mode) {
  const tags = [];
  if (s.hdrFlags & HDR_FLAG_HDR10_PLUS2) tags.push("HDR10+");
  else if (s.hdrFlags & HDR_FLAG_HDR102) tags.push("HDR");
  if (s.hdrFlags & HDR_FLAG_DV2) tags.push("DV");
  if (s.hdrFlags & HDR_FLAG_HLG2) tags.push("HLG");
  if (tags.length === 0) return "";
  if (mode === "emoji") {
    return tags.map((t) => t === "DV" ? "\u{1F31F} DV" : t.startsWith("HDR") ? `\u{1F308} ${t}` : t === "HLG" ? "\u{1F3A8} HLG" : t).join(" ");
  }
  if (mode === "bracket") return tags.map((t) => `[${t}]`).join("");
  return tags.join(" \xB7 ");
}
function renderAudio(s) {
  if (!s.audioCodec) return "";
  const map = {
    truehd: "TrueHD",
    "dts-hd": "DTS-HD",
    dts: "DTS",
    eac3: "EAC3",
    ac3: "AC3",
    aac: "AAC",
    opus: "Opus",
    flac: "FLAC",
    mp3: "MP3"
  };
  return map[s.audioCodec] ?? s.audioCodec.toUpperCase();
}
function renderSeasonEpisode(s, mode) {
  if (s.seasons.length === 0 && s.episodes.length === 0) return "";
  const ss = s.seasons[0];
  const ee = s.episodes[0];
  if (ss == null && ee == null) return "";
  if (mode === "full") {
    const sPart2 = ss != null ? `S${String(ss).padStart(2, "0")}` : "";
    const ePart2 = ee != null ? `E${String(ee).padStart(2, "0")}` : "";
    return `${sPart2}${ePart2}`;
  }
  if (mode === "short") {
    if (ss != null && ee != null) return `${ss}x${String(ee).padStart(2, "0")}`;
    if (ee != null) return `Ep ${ee}`;
    return `S${ss}`;
  }
  const sPart = ss != null ? `s${String(ss).padStart(2, "0")}` : "";
  const ePart = ee != null ? `e${String(ee).padStart(2, "0")}` : "";
  return [sPart, ePart].filter(Boolean).join("\xB7");
}
function renderPack(s, mode) {
  if (!s.seasonPack) return "";
  if (mode === "emoji") return "\u{1F4E6} Pack";
  if (mode === "short") {
    if (s.seasons.length === 1) return `[S${String(s.seasons[0]).padStart(2, "0")} Pack]`;
    if (s.seasons.length > 1) {
      const a = String(s.seasons[0]).padStart(2, "0");
      const b = String(s.seasons[s.seasons.length - 1]).padStart(2, "0");
      return `[S${a}-S${b} Pack]`;
    }
    if (s.episodes.length > 5) return `[${s.episodes.length}-Ep Batch]`;
    return "[Pack]";
  }
  return "[Pack]";
}
function extractFilename(s) {
  const text = `${s.description ?? ""}
${s.rawTitle ?? ""}`;
  for (const line of text.split(/[\r\n]/)) {
    const t = line.trim();
    if (/\.(mkv|mp4|avi|m4v|ts|webm)$/i.test(t)) return t;
  }
  return s.rawTitle ?? "";
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[unit]}`;
}
function formatBytesCompact(bytes) {
  return formatBytes(bytes).replace(" ", "").replace("KB", "K").replace("MB", "M").replace("GB", "G").replace("TB", "T");
}
var FLAG_MAP = {
  en: "\u{1F1FA}\u{1F1F8}",
  es: "\u{1F1EA}\u{1F1F8}",
  fr: "\u{1F1EB}\u{1F1F7}",
  de: "\u{1F1E9}\u{1F1EA}",
  it: "\u{1F1EE}\u{1F1F9}",
  pt: "\u{1F1F5}\u{1F1F9}",
  ru: "\u{1F1F7}\u{1F1FA}",
  ja: "\u{1F1EF}\u{1F1F5}",
  ko: "\u{1F1F0}\u{1F1F7}",
  zh: "\u{1F1E8}\u{1F1F3}",
  hi: "\u{1F1EE}\u{1F1F3}",
  ar: "\u{1F1F8}\u{1F1E6}",
  multi: "\u{1F310}",
  dual: "\u{1F3AD}"
};
function langToFlag(code) {
  return FLAG_MAP[code.toLowerCase()] ?? code.toUpperCase();
}
function renderRow(row, s, ctx) {
  const parts = [];
  for (const block of row.blocks) {
    const styleDef = CATEGORY_STYLES[block.category]?.find((d) => d.id === block.style);
    if (!styleDef) continue;
    const chunk = styleDef.render(s, ctx);
    if (chunk) parts.push(chunk);
  }
  const sep = row.separator || " ";
  return parts.join(sep);
}
function formatStream(s, cfg, ctx = {}) {
  const title = renderRow(cfg.title, s, ctx);
  const subtitle = cfg.subtitle.map((row) => renderRow(row, s, ctx)).filter(Boolean).join("\n");
  return { title, subtitle };
}
function hasAnySeriesContextBlock(cfg) {
  const rows = [cfg.title, ...cfg.subtitle];
  return rows.some(
    (row) => row.blocks.some((block) => block.category === "seasonEpisode" || block.category === "episodeName")
  );
}
function injectDefaultSeriesContext(cfg) {
  if (hasAnySeriesContextBlock(cfg)) return cfg;
  const titleBlocks = [
    ...cfg.title.blocks,
    { category: "seasonEpisode", style: "short" }
  ];
  const subtitle = cfg.subtitle.length > 0 ? cfg.subtitle.map(
    (row, idx) => idx === 0 ? { ...row, blocks: [{ category: "episodeName", style: "plain" }, ...row.blocks] } : row
  ) : [{ separator: " \xB7 ", blocks: [{ category: "episodeName", style: "plain" }] }];
  return {
    title: { ...cfg.title, blocks: titleBlocks },
    subtitle
  };
}
var DEFAULT_FORMATTER_CONFIG = {
  title: {
    separator: " ",
    blocks: [
      { category: "cache", style: "emoji" },
      { category: "addon", style: "bracket" },
      { category: "resolution", style: "names" },
      { category: "seasonEpisode", style: "short" },
      { category: "pack", style: "short" }
    ]
  },
  subtitle: [
    {
      separator: " \xB7 ",
      blocks: [{ category: "episodeName", style: "plain" }]
    },
    {
      separator: " \xB7 ",
      blocks: [
        { category: "quality", style: "full" },
        { category: "codec", style: "modern" },
        { category: "hdr", style: "emoji" }
      ]
    },
    {
      separator: " \xB7 ",
      blocks: [
        { category: "audio", style: "text" },
        { category: "channels", style: "number" },
        { category: "languages", style: "flags" }
      ]
    },
    {
      separator: " \xB7 ",
      blocks: [
        { category: "size", style: "emoji" },
        { category: "seeders", style: "emoji" },
        { category: "releaseGroup", style: "tagged" }
      ]
    }
  ]
};
function parseFormatterConfig(raw) {
  if (!raw || typeof raw !== "object") return DEFAULT_FORMATTER_CONFIG;
  const obj = raw;
  const validRow = (row) => {
    if (!row || typeof row !== "object") return null;
    const r = row;
    if (!Array.isArray(r.blocks)) return null;
    const blocks = [];
    for (const b of r.blocks.slice(0, 20)) {
      if (!b || typeof b !== "object") continue;
      const { category, style } = b;
      if (typeof category !== "string" || typeof style !== "string") continue;
      const cat = CATEGORY_STYLES[category];
      if (!cat) continue;
      if (!cat.find((s) => s.id === style)) continue;
      blocks.push({ category, style });
    }
    return { blocks, separator: typeof r.separator === "string" ? r.separator : " " };
  };
  const title = validRow(obj.title) ?? DEFAULT_FORMATTER_CONFIG.title;
  const subtitleRaw = Array.isArray(obj.subtitle) ? obj.subtitle.slice(0, 8) : [];
  const subtitle = subtitleRaw.map(validRow).filter((r) => !!r);
  if (subtitle.length === 0) return DEFAULT_FORMATTER_CONFIG;
  return injectDefaultSeriesContext({ title, subtitle });
}

// src/pipeline.ts
var DEFAULT_SOURCE_TIMEOUT_MS = 2e4;
var DEFAULT_RESOLVE_TIMEOUT_MS = 3e4;
var SOURCE_SEARCH_TIMEOUT_MS = 9e3;
var STREAMS_DEBUG = /^(1|true|yes|on)$/i.test(process.env.STREAMS_DEBUG ?? "");
function dbg(message) {
  if (STREAMS_DEBUG) logger.info("streams", message);
}
function breakdown(entries) {
  return entries.filter(([, n]) => n > 0).map(([label, n]) => `${label} ${n}`).join(", ");
}
function prettySource(type) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
async function syncNativeStreams(opts) {
  const { itemId, query, prefs, preferredReleaseGroup, formatter, episodeName } = opts;
  const start = Date.now();
  const [sources, accounts, sourceRows] = await Promise.all([
    loadSources(),
    loadAccounts(),
    loadSourceRows()
  ]);
  const title = await getForgeHost().getMediaItemTitle(itemId) ?? itemId;
  if (sources.length === 0) {
    logger.warn("streams", `${title} \u2014 no enabled stream sources, skipping search`);
    return [];
  }
  dbg(
    `Pipeline start: ${sources.length} sources [${sources.map((s) => s.type).join(", ")}], ${accounts.length} resolvers [${accounts.map((a) => a.row.provider).join(", ")}]`
  );
  const { candidates: rawCandidates, perSource } = await searchAll(sources, query);
  dbg(
    `Stage 1 search: ${rawCandidates.length} raw candidates (with infoHash: ${rawCandidates.filter((c) => c.infoHash).length}, with url: ${rawCandidates.filter((c) => c.url).length}, with nzb: ${rawCandidates.filter((c) => c.nzbId).length})`
  );
  const parsed = rawCandidates.map(parseCandidate);
  const seGated = applySeasonEpisodeGate(parsed, query);
  if (seGated.length !== parsed.length) {
    dbg(
      `Stage 2a S/E gate: ${parsed.length} \u2192 ${seGated.length} (want ${query.kind}${query.season ? ` S${query.season}` : ""}${query.episode ? `E${query.episode}` : ""})`
    );
  }
  const filtered = applyFilters(seGated, prefs);
  dbg(
    `Stage 2 content filter: ${seGated.length} \u2192 ${filtered.length} (prefs: resolutions=[${prefs.resolutions.join(",")}], codecs=[${prefs.codecs.join(",")}], hdrAllowed=${prefs.hdrAllowed}, minSeeders=${prefs.minSeeders ?? "any"}, sizeMinMb=${prefs.sizeMinMb ?? "any"}, sizeMaxMb=${prefs.sizeMaxMb ?? "any"})`
  );
  const { resolved, perDebrid } = await annotateAvailability(filtered, accounts);
  const cachedCount = resolved.filter((r) => r.cachedOnDebrid).length;
  dbg(
    `Stage 3 availability: ${resolved.length} candidates annotated, ${cachedCount} reported cached by debrid (${resolved.length - cachedCount} uncached)`
  );
  const available = applyAvailabilityFilters(resolved, prefs);
  dbg(
    `Stage 4 cached-only filter: ${resolved.length} \u2192 ${available.length} (excludeUncached=${prefs.excludeUncached})`
  );
  const sorted = sortStreams(available, prefs);
  const pinned = prefs.bingePinReleaseGroup ? pinReleaseGroup(sorted, preferredReleaseGroup ?? null, {
    strict: prefs.bingeStrictReleaseGroup,
    preferPacks: prefs.bingeOnlySeasonPacks
  }) : sorted;
  const sourceNameById = new Map(sourceRows.map((r) => [r.id, r.name]));
  const resolverProviderById = new Map(accounts.map((a) => [a.row.id, a.row.provider]));
  await persist(
    itemId,
    pinned,
    formatter ?? DEFAULT_FORMATTER_CONFIG,
    sourceNameById,
    resolverProviderById,
    episodeName
  );
  const tookSec = ((Date.now() - start) / 1e3).toFixed(1);
  const sourcesStr = breakdown(perSource) || "none";
  const verifiedStr = breakdown(
    perDebrid.filter((d) => !d.assumed).map((d) => [prettyProvider(d.provider), d.cached])
  );
  const assumedStr = breakdown(
    perDebrid.filter((d) => d.assumed).map((d) => [prettyProvider(d.provider), d.cached])
  );
  if (pinned.length > 0) {
    const cachedPart = verifiedStr ? ` \xB7 cached: ${verifiedStr}` : "";
    const assumedPart = assumedStr ? ` \xB7 assumed: ${assumedStr}` : "";
    logger.success(
      "streams",
      `${title} \u2014 ${pinned.length} streams in ${tookSec}s \xB7 sources: ${sourcesStr}${cachedPart}${assumedPart}`
    );
  } else {
    let why;
    if (rawCandidates.length === 0) {
      why = `no candidates from ${sources.length} source${sources.length === 1 ? "" : "s"} (${sourcesStr})`;
    } else if (prefs.excludeUncached && available.length === 0) {
      const names = accounts.filter((a) => a.resolver.verifiesCache !== false).map((a) => prettyProvider(a.row.provider)).join(" / ") || "debrid";
      why = `${rawCandidates.length} found, none cached on ${names}; cached-only is on`;
    } else {
      why = `${rawCandidates.length} found, all filtered out by your stream prefs`;
    }
    logger.warn("streams", `${title} \u2014 0 streams (${why}) in ${tookSec}s`);
  }
  return pinned;
}
async function resolveStream(stream, hint) {
  if (!stream.resolverId) {
    logger.warn("streams", `Resolve skipped: stream has no resolver assigned (${stream.rawTitle ?? stream.infoHash ?? stream.nzbId ?? "?"})`);
    return null;
  }
  const accounts = await getForgeHost().listStreamAccounts();
  const row = accounts.find((a) => a.id === stream.resolverId && a.enabled === 1);
  if (!row) {
    logger.warn("streams", `Resolve failed: assigned resolver ${stream.resolverId} is missing or disabled`);
    return null;
  }
  const resolver = buildResolver(row);
  if (!resolver) {
    logger.warn("streams", `Resolve failed: ${row.provider} resolver could not be built`);
    return null;
  }
  const candidate = {
    id: stream.infoHash ?? stream.nzbId ?? "",
    sourceType: "cache",
    sourceId: stream.sourceId ?? "",
    name: row.provider,
    description: stream.rawTitle ?? "",
    rawTitle: stream.rawTitle ?? "",
    infoHash: stream.infoHash ?? void 0,
    nzbId: stream.nzbId ?? void 0
  };
  const kind = stream.infoHash ? "torrent" : stream.nzbId ? "usenet" : "direct";
  const ref = stream.infoHash ? stream.infoHash.slice(0, 8) : stream.nzbId ?? "?";
  const t0 = Date.now();
  try {
    const url = await resolver.resolve(
      candidate,
      AbortSignal.timeout(DEFAULT_RESOLVE_TIMEOUT_MS),
      hint
    );
    if (url) {
      logger.success("streams", `Resolved ${kind} via ${row.provider} (${ref}) in ${Date.now() - t0}ms`);
    } else {
      logger.warn("streams", `Resolve returned no URL: ${row.provider} could not play ${kind} ${ref} (${stream.rawTitle ?? ""})`.trim());
    }
    return url;
  } catch (err) {
    logger.error("streams", `Resolve threw for ${row.provider} ${kind} ${ref}: ${err.message}`, err);
    return null;
  }
}
async function loadSources() {
  const rows = await getForgeHost().listStreamSources();
  const enabled = rows.filter((r) => r.enabled === 1);
  return enabled.map(buildSource).filter((s) => s !== null);
}
async function loadAccounts() {
  const rows = await getForgeHost().listStreamAccounts();
  return rows.filter((r) => r.enabled === 1).map((row) => ({ row, resolver: buildResolver(row) })).filter((x) => x.resolver !== null);
}
async function loadSourceRows() {
  const rows = await getForgeHost().listStreamSources();
  return rows.filter((r) => r.enabled === 1);
}
async function searchAll(sources, query) {
  const perSource = [];
  const results = await Promise.all(
    sources.map(async (s) => {
      const t0 = Date.now();
      const signal = AbortSignal.timeout(SOURCE_SEARCH_TIMEOUT_MS);
      try {
        const res = await s.search(query, signal);
        dbg(`Source ${prettySource(s.type)} \u2192 ${res.length} candidates in ${Date.now() - t0}ms`);
        perSource.push([prettySource(s.type), res.length]);
        return res;
      } catch (err) {
        logger.warn("streams", `Source ${prettySource(s.type)} failed after ${Date.now() - t0}ms: ${err.message}`);
        perSource.push([prettySource(s.type), 0]);
        return [];
      }
    })
  );
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const list of results) {
    for (const c of list) {
      const key = c.infoHash ?? c.nzbId ?? c.url ?? c.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
  }
  return { candidates: out, perSource };
}
async function annotateAvailability(candidates, accounts) {
  const direct = [];
  const needsResolver = [];
  for (const c of candidates) {
    if (c.url) {
      direct.push({ ...c, url: c.url, resolverId: null, cachedOnDebrid: true });
    } else {
      needsResolver.push(c);
    }
  }
  if (needsResolver.length === 0 || accounts.length === 0) {
    return {
      resolved: [
        ...direct,
        ...needsResolver.map((c) => ({
          ...c,
          url: "",
          resolverId: null,
          cachedOnDebrid: false
        }))
      ],
      perDebrid: []
    };
  }
  const accountsByPriority = [...accounts].sort((a, b) => a.row.priority - b.row.priority);
  const verifying = accountsByPriority.filter((a) => a.resolver.verifiesCache !== false);
  const nonVerifying = accountsByPriority.filter((a) => a.resolver.verifiesCache === false);
  const torrentCands = needsResolver.filter((c) => c.infoHash);
  const usenetCands = needsResolver.filter((c) => c.nzbId);
  const cacheMaps = await Promise.all(
    verifying.map(async ({ row, resolver }) => {
      const accepts = resolver.accepts;
      const slice = [
        ...accepts.includes("torrent") ? torrentCands : [],
        ...accepts.includes("usenet") ? usenetCands : []
      ];
      dbg(
        `\u2192 ${prettyProvider(row.provider)} checkAvailability for ${slice.length} candidates (torrent: ${torrentCands.length} accepted=${accepts.includes("torrent")}, usenet: ${usenetCands.length} accepted=${accepts.includes("usenet")})`
      );
      try {
        const map = await resolver.checkAvailability(slice, AbortSignal.timeout(DEFAULT_SOURCE_TIMEOUT_MS));
        const cachedHere = Array.from(map.values()).filter((v) => v === true).length;
        dbg(`\u2190 ${prettyProvider(row.provider)} returned cached map of ${map.size} entries, ${cachedHere} marked cached`);
        return { row, resolver, map };
      } catch (err) {
        logger.warn("streams", `${prettyProvider(row.provider)} checkAvailability threw: ${err.message}`);
        return { row, resolver, map: /* @__PURE__ */ new Map() };
      }
    })
  );
  let assumedCount = 0;
  const annotated = needsResolver.map((c) => {
    const wantedKind = c.infoHash ? "torrent" : "usenet";
    let resolverId = null;
    for (const { row, resolver, map } of cacheMaps) {
      if (!resolver.accepts.includes(wantedKind)) continue;
      if (map.get(c.id) === true) {
        return { ...c, url: "", resolverId: row.id, cachedOnDebrid: true };
      }
      if (resolverId === null) resolverId = row.id;
    }
    const assumed = nonVerifying.find((a) => a.resolver.accepts.includes(wantedKind));
    if (assumed) {
      assumedCount += 1;
      return { ...c, url: "", resolverId: assumed.row.id, cachedOnDebrid: false, assumedCached: true };
    }
    return { ...c, url: "", resolverId, cachedOnDebrid: false };
  });
  const perDebrid = cacheMaps.map(({ row, map }) => ({
    provider: row.provider,
    cached: Array.from(map.values()).filter((v) => v === true).length
  }));
  for (const { row } of nonVerifying) {
    perDebrid.push({ provider: row.provider, cached: assumedCount, assumed: true });
  }
  return { resolved: [...direct, ...annotated], perDebrid };
}
async function persist(itemId, streams, formatter, sourceNameById, resolverProviderById, episodeName) {
  await getForgeHost().setNativeStreams(
    itemId,
    streams.map((s, i) => {
      const addonName = sourceNameById.get(s.sourceId) ?? s.sourceType;
      const provider = s.resolverId ? resolverProviderById.get(s.resolverId) : null;
      const debridName = provider ? prettyProvider(provider) : null;
      const debridTag = provider ? providerTag(provider) : null;
      const { title, subtitle } = formatStream(s, formatter, {
        addonName,
        episodeName,
        debridName,
        debridTag
      });
      const finalName = title.trim() ? title : s.name;
      const finalDescription = subtitle.trim() ? subtitle : s.description;
      return {
        id: streamRowId(itemId, s),
        url: s.url || `native://${s.infoHash ?? s.nzbId ?? s.id}`,
        name: finalName,
        description: finalDescription,
        // Clean release name — kept distinct from the formatted name/description
        // so JIT resolve hands the resolver a sane label (the formatted one has
        // emoji/newlines that break usenet job submission).
        rawTitle: s.rawTitle || s.name || null,
        bingeGroup: s.bingeGroup ?? null,
        sortIndex: i,
        sourceId: s.sourceId,
        resolverId: s.resolverId,
        infoHash: s.infoHash ?? null,
        nzbId: s.nzbId ?? null,
        releaseGroup: s.releaseGroup,
        resolution: s.resolution,
        codec: s.codec,
        hdrFlags: s.hdrFlags,
        sizeBytes: s.sizeBytes ?? null,
        seeders: s.seeders ?? null,
        cachedOnDebrid: s.cachedOnDebrid,
        languages: s.languages,
        audioChannels: s.audioChannels,
        audioCodec: s.audioCodec,
        sourceTag: s.sourceTag
      };
    })
  );
}
function streamRowId(itemId, s) {
  const key = s.url || s.infoHash || s.nzbId || s.id;
  return createHash2("md5").update(`${itemId}:${key}`).digest("hex");
}

// manifest.json
var manifest_default = {
  id: "rewind.forge",
  name: "The Forge",
  version: "2.0.0",
  description: "Torrent/usenet indexers + debrid resolution for Rewind. Brings the streams pipeline (Torrentio, Zilean, Torznab/Newznab, Comet, EasyNews, TorBox search) and the debrid/usenet resolvers. Installing reveals the Forge tab and the debrid/usenet credentials.",
  resources: ["stream", "resolve"],
  types: ["movie", "series", "episode"],
  idPrefixes: ["tt", "tmdb:"],
  rewind: {
    kind: "forge",
    sdk: 1,
    repo: "j4ckgrey/rewind_forge",
    branch: "main",
    bundlePath: "dist/index.mjs",
    bundleUrl: "https://raw.githubusercontent.com/j4ckgrey/rewind_forge/release/dist/index.mjs",
    tabs: [{ id: "forge", label: "Forge", icon: "hammer" }],
    configKeys: [
      { key: "realdebrid_api_key", label: "Real-Debrid", category: "Debrid Providers", description: "API token from real-debrid.com/apitoken." },
      { key: "alldebrid_api_key", label: "AllDebrid", category: "Debrid Providers", description: "API key from alldebrid.com/apikeys." },
      { key: "premiumize_api_key", label: "Premiumize", category: "Debrid Providers", description: "API key from premiumize.me/account." },
      { key: "torbox_api_key", label: "TorBox", category: "Debrid Providers", description: "API key from torbox.app/settings. Also powers the TorBox search indexer." },
      { key: "debridlink_api_key", label: "Debrid-Link", category: "Debrid Providers", description: "API token from debrid-link.com/webapp/apikey." },
      { key: "offcloud_api_key", label: "Offcloud", category: "Debrid Providers", description: "API key from offcloud.com/account/preferences." },
      { key: "putio_api_key", label: "Put.io", category: "Debrid Providers", description: "OAuth token from put.io/oauth." },
      { key: "easydebrid_api_key", label: "EasyDebrid", category: "Debrid Providers", description: "API key from easydebrid.com." },
      { key: "nzbdav_host", label: "NZBDav Host URL", category: "Self-Hosted Usenet", secret: false, placeholder: "http://192.168.1.10:8080", description: "Base URL of your NZBDav instance." },
      { key: "nzbdav_api_key", label: "NZBDav API Key", category: "Self-Hosted Usenet", description: "Optional \u2014 leave blank if NZBDav requires none." },
      { key: "altmount_host", label: "AltMount Host URL", category: "Self-Hosted Usenet", secret: false, placeholder: "http://192.168.1.10:9000", description: "Base URL of your AltMount instance." },
      { key: "altmount_api_key", label: "AltMount API Key", category: "Self-Hosted Usenet", description: "Optional \u2014 leave blank if AltMount requires none." }
    ],
    features: ["torrents", "debrid", "usenet"]
  }
};

// src/plugin.ts
function buildApi() {
  return {
    syncNativeStreams(opts) {
      return syncNativeStreams({
        itemId: opts.itemId,
        query: opts.query,
        prefs: parseStreamPrefs(opts.prefsRow),
        preferredReleaseGroup: opts.preferredReleaseGroup ?? null,
        formatter: parseFormatterConfig(
          opts.formatterJson ? JSON.parse(opts.formatterJson) : null
        ),
        episodeName: opts.episodeName ?? null
      });
    },
    resolveStream
  };
}
function queryFromRequest({ type, id, extra }) {
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : void 0;
  };
  return {
    kind: type === "movie" ? "movie" : "series",
    imdbId: /^tt\d+/.test(id) ? id : void 0,
    tmdbId: id.startsWith("tmdb:") ? id.slice(5) : void 0,
    title: typeof extra.title === "string" ? extra.title : void 0,
    year: num(extra.year),
    season: num(extra.season),
    episode: num(extra.episode)
  };
}
var addon = defineAddon({
  manifest: manifest_default,
  setup(host2) {
    setForgeHost(host2);
    const api = buildApi();
    return {
      api,
      resources: {
        // stream/<movie|series|episode>/<tt…|tmdb:…>.json — search + cache
        // streams for the item. `extra` carries the embedder's prefs row +
        // formatter JSON (the pipeline needs the operator's filter/sort/format
        // settings; they are the embedder's data, not the addon's).
        stream: async (req) => {
          const streams = await api.syncNativeStreams({
            itemId: String(req.extra.itemId ?? req.id),
            query: queryFromRequest(req),
            prefsRow: req.extra.prefsRow ?? {},
            preferredReleaseGroup: req.extra.preferredReleaseGroup ?? null,
            formatterJson: req.extra.formatterJson ?? null,
            episodeName: req.extra.episodeName ?? null
          });
          return { streams };
        },
        // resolve/<type>/<id>.json — turn one chosen candidate into a URL.
        resolve: async ({ extra }) => {
          const url = await api.resolveStream(
            extra.stream ?? {},
            extra.hint
          );
          return { url };
        }
      }
    };
  }
});
var manifest = addon.manifest;
var register = addon.register;
export {
  addon,
  manifest,
  register
};
