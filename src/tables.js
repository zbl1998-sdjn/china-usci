// Constants transcribed from GB 32100-2015 and GB/T 2260.
//
// This file holds data only — no logic — so that every value here can be checked
// against the published standard line by line, without reading around it. That
// matters more than usual here: the weights and character set were transcribed
// from the standard's full text on Wikisource, NOT from an official PDF.
//
// Two independent checks were run against that transcription risk:
//   1. Arithmetic — every weight recomputed as Wi = 3^(i-1) mod 31 (test/index.test.js).
//   2. End-to-end, 2026-08-11 — 2149 real codes from two Chinese government PDFs
//      parsed at a 100% pass rate. One wrong value would push that toward 1/31.

// The 31 permitted characters. GB 32100-2015 excludes I, O, Z, S and V because
// they are easily confused with 1, 0, 2, 5 and U when read off a printed licence.
// Index is the character's value: '0'->0 … '9'->9, 'A'->10 … 'Y'->30.
export const CHARSET = '0123456789ABCDEFGHJKLMNPQRTUWXY';

// Wi = 3^(i-1) mod 31, for i = 1..17. Written out as a literal rather than computed
// at run time so the table itself can be checked term by term against the standard.
export const WEIGHTS = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];

// Position 1 is the registering authority, position 2 the entity category under it.
//
// Why it is worth decoding: the mistake buyers make most often is taking an
// individually-owned business for a company. A code starting 9-2 is an
// individually-owned business (个体工商户) — run by a natural person, with a
// different liability profile and usually a different scale from an enterprise.
// A photo of the licence will not make that obvious. The second character will.
// The Chinese term is included so it can be compared against the licence itself.
//
// This does NOT encode export eligibility. Individually-owned businesses trade
// internationally too: the 2004 revision of the Foreign Trade Law brought
// individuals within the scope of foreign trade operators, and on 2022-12-30 the
// NPC Standing Committee deleted the operator-filing requirement in the former
// Article 9, after which local commerce authorities stopped processing it.
// Entity type does not decide whether someone can export.
export const AUTHORITIES = {
  1: { en: 'Central staffing authority', zh: '机构编制',
       categories: { 1: ['Government agency', '机关'], 2: ['Public institution', '事业单位'],
                     3: ['Directly administered mass organisation', '编办直接管理机构编制的群众团体'],
                     9: ['Other', '其他'] } },
  2: { en: 'Foreign affairs', zh: '外交',
       categories: { 1: ['Resident foreign news bureau', '外国常驻新闻机构'], 9: ['Other', '其他'] } },
  3: { en: 'Judicial administration', zh: '司法行政',
       categories: { 1: ['Law firm', '律师执业机构'], 2: ['Notary office', '公证处'],
                     3: ['Basic-level legal service office', '基层法律服务所'],
                     4: ['Forensic appraisal institution', '司法鉴定机构'],
                     5: ['Arbitration commission', '仲裁委员会'], 9: ['Other', '其他'] } },
  4: { en: 'Culture', zh: '文化',
       categories: { 1: ['Foreign cultural centre in China', '外国在华文化中心'], 9: ['Other', '其他'] } },
  5: { en: 'Civil affairs', zh: '民政',
       categories: { 1: ['Social organisation', '社会团体'], 2: ['Private non-enterprise unit', '民办非企业单位'],
                     3: ['Foundation', '基金会'], 9: ['Other', '其他'] } },
  6: { en: 'Tourism', zh: '旅游',
       categories: { 1: ['Resident office of a foreign tourism authority', '外国旅游部门常驻代表机构'],
                     2: ['Resident mainland office of an HK/Macau/Taiwan tourism authority', '港澳台地区旅游部门常驻内地代表机构'],
                     9: ['Other', '其他'] } },
  7: { en: 'Religious affairs', zh: '宗教',
       categories: { 1: ['Religious venue', '宗教活动场所'], 2: ['Religious school', '宗教院校'], 9: ['Other', '其他'] } },
  8: { en: 'Trade union', zh: '工会',
       categories: { 1: ['Grassroots trade union', '基层工会'], 9: ['Other', '其他'] } },
  // The standard reads 工商 (industry and commerce). That function now sits with
  // the State Administration for Market Regulation; the body was renamed, the code was not.
  9: { en: 'Market regulation', zh: '工商',
       categories: { 1: ['Enterprise', '企业'],
                     2: ['Individually-owned business', '个体工商户'],
                     3: ['Farmers specialised cooperative', '农民专业合作社'] } },
  A: { en: 'CMC reform and staffing office', zh: '中央军委改革和编制办公室',
       categories: { 1: ['Military public institution', '军队事业单位'], 9: ['Other', '其他'] } },
  N: { en: 'Agriculture', zh: '农业',
       categories: { 1: ['Group-level collective economic organisation', '组级集体经济组织'],
                     2: ['Village-level collective economic organisation', '村级集体经济组织'],
                     3: ['Township-level collective economic organisation', '乡镇级集体经济组织'],
                     9: ['Other', '其他'] } },
  Y: { en: 'Other', zh: '其他', categories: { 1: ['Other', '其他'] } }
};

// Positions 3-8 are a GB/T 2260 administrative division code; its first two
// characters fix the province.
//
// Why only the province is resolved: prefecture and county codes change as
// divisions are redrawn — counties become districts, areas merge, places are
// renamed — so an embedded table of them goes stale and starts returning wrong
// answers. Province codes have been stable for decades. Handing a buyer an
// out-of-date city name is worse than handing them nothing, because they will
// check it against the address on the licence.
export const PROVINCE_CODES = {
  11: 'Beijing', 12: 'Tianjin', 13: 'Hebei', 14: 'Shanxi', 15: 'Inner Mongolia',
  21: 'Liaoning', 22: 'Jilin', 23: 'Heilongjiang',
  31: 'Shanghai', 32: 'Jiangsu', 33: 'Zhejiang', 34: 'Anhui', 35: 'Fujian',
  36: 'Jiangxi', 37: 'Shandong',
  41: 'Henan', 42: 'Hubei', 43: 'Hunan', 44: 'Guangdong', 45: 'Guangxi', 46: 'Hainan',
  50: 'Chongqing', 51: 'Sichuan', 52: 'Guizhou', 53: 'Yunnan', 54: 'Tibet',
  61: 'Shaanxi', 62: 'Gansu', 63: 'Qinghai', 64: 'Ningxia', 65: 'Xinjiang'
};

// Taiwan (71), Hong Kong (81) and Macau (82) have GB/T 2260 codes but are not
// registered by SAMR, so they do not appear in the USCI on a mainland business
// licence. Seeing one means something is wrong with the code in front of you.
export const NON_MAINLAND_PREFIXES = { 71: 'Taiwan', 81: 'Hong Kong SAR', 82: 'Macau SAR' };

export const SEGMENTS = [
  { key: 'registrationAuthority', start: 0, end: 1, label: 'Registration authority code' },
  { key: 'entityCategory', start: 1, end: 2, label: 'Entity category code' },
  { key: 'administrativeDivision', start: 2, end: 8, label: 'Administrative division code' },
  { key: 'subjectIdentifier', start: 8, end: 17, label: 'Subject identifier (organization code)' },
  { key: 'checkCharacter', start: 17, end: 18, label: 'Check character' }
];

// The five statements below exist because this tool would be harmful without them.
// A checker that only says "valid" manufactures false confidence: a buyer reads a
// green tick and concludes the company is fine. Callers must not strip these.
export const DOES_NOT_PROVE = [
  'That the company exists. A correctly formed code can be invented.',
  'That the company is still active rather than revoked or deregistered.',
  'That its registered business scope covers what you are buying.',
  'That it may legally export to you. Export eligibility turns on the registered scope and customs registration, neither of which is encoded here.',
  'That the company on this code is the same one issuing your invoice or receiving your payment.'
];
