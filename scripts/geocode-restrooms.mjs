#!/usr/bin/env node
// facility 데이터 파일(주소 정보가 담긴 .ts) 중 lat/lng가 아직 없는 항목만
// 카카오 로컬 API로 지오코딩해서 채워 넣는 1회성 스크립트.
// 이미 lat/lng가 있는 항목(roadAddress 바로 다음 줄이 lat: 인 경우)은 건드리지 않음.
//
// 사용법:
//   TARGET_FILE=data/facilities.ts KAKAO_REST_API_KEY=발급받은키 node scripts/geocode-restrooms.mjs
//   (TARGET_FILE 생략 시 기본값 data/restrooms.ts)
//
// GEOCODE_MODE=keyword 로 실행하면 정식 주소가 아니라 "안양역 2번출구 앞" 같은
// 장소 이름으로 검색하는 카카오 키워드 검색 API를 사용함 (자전거 보관소/공기주입기처럼
// address 필드에 정식 주소가 없고 동 이름 정도만 있는 데이터용). 기본값은 'address'.
//
// GEOCODE_MODE=refix 로 실행하면, 이미 좌표가 채워진 항목들 중 서로 완전히 똑같은
// 좌표를 가진 그룹(주로 이전에 검색이 실패해서 동네 중심 좌표로 대체됐던 항목들)만
// 골라서, 더 똑똑해진 장소명 추출 로직으로 다시 검색을 시도한다. 그래도 다시 겹치면
// (진짜로 같은 건물 안에 있는 서로 다른 보관대 등) 마지막 수단으로 그 지점을 중심으로
// 작은 원 모양으로 흩어 놓는다. KAKAO_REST_API_KEY 필요.
//
// GEOCODE_MODE=dedupe 로 실행하면 카카오 API를 전혀 호출하지 않고, refix와 같은 방식으로
// 중복 좌표 그룹을 찾아 바로 원 모양으로 흩어만 놓는다 (재검색 없이 시각적 분리만).
// KAKAO_REST_API_KEY 불필요.
//
// 카카오 개발자센터(https://developers.kakao.com) > 애플리케이션 > 앱 키 > REST API 키

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_FILE = process.env.TARGET_FILE
  ? path.resolve(process.cwd(), process.env.TARGET_FILE)
  : path.join(__dirname, '..', 'data', 'restrooms.ts');

const RAW_MODE = process.env.GEOCODE_MODE;
const MODE = ['keyword', 'dedupe', 'refix'].includes(RAW_MODE) ? RAW_MODE : 'address';

// 안양시 중심 좌표. 키워드 검색 시 이 좌표 주변을 우선해서 동명이인(같은 이름의
// 다른 지역 장소)에 걸리지 않도록 함.
const ANYANG_CENTER = { x: 126.9568, y: 37.3943 };

const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
if (MODE !== 'dedupe' && !KAKAO_KEY) {
  console.error('환경변수 KAKAO_REST_API_KEY 를 설정한 뒤 다시 실행하세요.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function geocodeAddress(address) {
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`Kakao API ${res.status} (${address})`);
  }
  const data = await res.json();
  const doc = data.documents?.[0];
  if (!doc) return null;
  return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
}

async function geocodeKeyword(query) {
  const url =
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}` +
    `&x=${ANYANG_CENTER.x}&y=${ANYANG_CENTER.y}&radius=20000&sort=distance`;
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`Kakao API ${res.status} (${query})`);
  }
  const data = await res.json();
  const doc = data.documents?.[0];
  if (!doc) return null;
  return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
}

function geocode(query) {
  return MODE === 'address' ? geocodeAddress(query) : geocodeKeyword(query);
}

function unquote(jsLiteral) {
  return jsLiteral.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

// "안양역 1번출구 앞(메타볼쪽)" -> "안양역 1번출구 앞" 처럼 괄호 설명 제거.
// 괄호 안 내용은 실제 장소 이름이 아닌 경우가 많아 검색을 방해함.
function stripParens(s) {
  return s.replace(/[（(][^)）]*[)）]/g, '').replace(/\s+/g, ' ').trim();
}

// "구)조선일보 앞" -> "조선일보 앞" 처럼 "구)" 같은 죽은 접두어 제거.
function stripLeadingJunk(s) {
  return s.replace(/^\(?구\)\s*/, '').trim();
}

// 장소 이름 뒤에 붙어서 검색을 방해하는 위치 설명 단어들. 각 단어는 그 장소
// "자체"가 아니라 "그 근처"라는 뜻이라 카카오 키워드 검색에 방해가 됨.
const RELATION_WORDS = [
  '앞', '뒤', '옆', '위', '밑', '아래', '안', '내', '건너편', '입구', '출입구',
  '근처', '주변', '쪽', '사이', '보도', '차도', '골목', '계단', '육교',
  '인근', '부근', '사거리', '삼거리', '방향', '정문', '후문',
];
const TRAILING_SUFFIX_RE = /(내|옆|앞|뒤|위|밑|아래|안|쪽|건너편|입구)$/;
const NUMERIC_TOKEN_RE = /^\d+(,\d+)*번?(출구)?$/;
const NUMERIC_DASH_RE = /^\d+-\d+$/;

// "안양역 1번출구 앞(메타볼쪽)" 같은 설치장소 설명에서 실제 검색 가능한
// 랜드마크 이름만 뽑아낸다. 끝에서부터 위치 설명 단어/번호/괄호를 순서대로
// 벗겨내고, 최후엔 마지막 단어에 붙은 접미사("학운공원내" -> "학운공원")까지 뗀다.
function extractLandmark(raw) {
  if (!raw) return raw;
  let s = stripLeadingJunk(stripParens(raw));
  let tokens = s.split(/\s+/).filter(Boolean);

  while (tokens.length > 0) {
    const last = tokens[tokens.length - 1];

    if (tokens.length === 1) {
      const stripped = last.replace(TRAILING_SUFFIX_RE, '');
      if (stripped && stripped !== last) tokens[0] = stripped;
      break;
    }

    if (RELATION_WORDS.includes(last) || NUMERIC_TOKEN_RE.test(last) || NUMERIC_DASH_RE.test(last)) {
      tokens.pop();
      continue;
    }

    const stripped = last.replace(TRAILING_SUFFIX_RE, '');
    if (stripped !== last && stripped.length > 0) {
      tokens[tokens.length - 1] = stripped;
      continue; // 접미사를 뗀 결과가 relation word면 다음 반복에서 마저 제거됨
    }

    break;
  }

  return tokens.join(' ').trim();
}

function buildKeywordTries(dong, nameValue, address) {
  const cleanName = nameValue ? stripLeadingJunk(stripParens(nameValue)) : nameValue;
  const landmark = nameValue ? extractLandmark(nameValue) : nameValue;

  return [
    landmark ? `${dong} ${landmark}`.trim() : null,
    landmark,
    cleanName ? `${dong} ${cleanName}`.trim() : null,
    cleanName,
    address && nameValue ? `${address} ${nameValue}` : null,
    nameValue ? `${dong} ${nameValue}`.trim() : null,
  ].filter((q, idx, arr) => q && arr.indexOf(q) === idx);
}

async function tryGeocodeKeyword(tries) {
  for (const q of tries) {
    const coords = await geocode(q);
    if (coords) return coords;
    await sleep(80);
  }
  return null;
}

async function runGeocodeMode() {
  console.log(`모드: ${MODE} (${MODE === 'keyword' ? '장소 이름 검색' : '정식 주소 검색'})`);
  const src = fs.readFileSync(TARGET_FILE, 'utf8');
  const lines = src.split('\n');

  const out = [];
  let nameValue = null;
  let addressValue = null;
  let notFound = [];
  let done = 0;
  let skipped = 0;
  let approxCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    out.push(line);

    const nameMatch = line.match(/^\s*name: '((?:\\.|[^'\\])*)',\s*$/);
    if (nameMatch) nameValue = unquote(`'${nameMatch[1]}'`);

    const addressMatch = line.match(/^\s*address: '((?:\\.|[^'\\])*)',\s*$/);
    if (addressMatch) addressValue = unquote(`'${addressMatch[1]}'`);

    const roadMatch = line.match(/^\s*roadAddress: '((?:\\.|[^'\\])*)',\s*$/);
    if (roadMatch) {
      const roadAddressValue = unquote(`'${roadMatch[1]}'`);
      const address = roadAddressValue || addressValue;
      const dong = (address || '').trim().split(/\s+/).pop() || ''; // 주소 마지막 토큰 (동 이름)
      const candidate =
        MODE === 'keyword' && nameValue ? `${dong} ${nameValue}`.trim() : address;

      const nextLine = lines[i + 1] || '';
      const alreadyHasCoords = /^\s*lat:\s*-?\d/.test(nextLine);
      if (alreadyHasCoords) {
        skipped++;
        continue; // 이미 좌표가 있는 항목은 그대로 둠
      }

      let coords = null;
      let approximate = false;
      try {
        if (MODE === 'keyword') {
          coords = await tryGeocodeKeyword(buildKeywordTries(dong, nameValue, address));

          // 그래도 못 찾으면 최후 수단: 동 이름만 정식 주소 검색해서 동네 중심 좌표라도 확보
          if (!coords && address) {
            coords = await geocodeAddress(address);
            if (coords) approximate = true;
          }
        } else {
          coords = await geocode(candidate);
          if (!coords && addressValue && addressValue !== address) {
            coords = await geocode(addressValue);
          }
        }
      } catch (err) {
        console.error(`  ! ${candidate} -> ${err.message}`);
      }

      if (coords) {
        out.push(`    lat: ${coords.lat},`);
        out.push(`    lng: ${coords.lng},`);
        if (approximate) approxCount++;
      } else {
        notFound.push(candidate);
        console.warn(`  ? 좌표 못 찾음: ${candidate}`);
      }

      done++;
      if (done % 20 === 0) console.log(`  ...${done}건 처리`);

      await sleep(80); // 카카오 API rate limit 여유
    }
  }

  fs.writeFileSync(TARGET_FILE, out.join('\n'));
  console.log(
    `완료: ${done}건 신규 처리(그중 ${approxCount}건은 동네 중심 좌표로 대체), ` +
      `${skipped}건 이미 좌표 있어 건너뜀, 좌표 실패 ${notFound.length}건`
  );
  if (notFound.length) {
    console.log('실패한 항목 목록:');
    notFound.forEach((a) => console.log(`  - ${a}`));
  }
}

// 파일 전체를 스캔해서, lat 줄 하나하나에 대해
// { latLineIdx, indent, lat, lng, name, address, dong } 레코드를 만든다.
// refix/dedupe 모드에서 공통으로 쓰는 파서.
function parseRecords(lines) {
  const records = [];
  let nameValue = null;
  let addressValue = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const nameMatch = line.match(/^\s*name: '((?:\\.|[^'\\])*)',\s*$/);
    if (nameMatch) nameValue = unquote(`'${nameMatch[1]}'`);

    const addressMatch = line.match(/^\s*address: '((?:\\.|[^'\\])*)',\s*$/);
    if (addressMatch) addressValue = unquote(`'${addressMatch[1]}'`);

    const roadMatch = line.match(/^\s*roadAddress: '((?:\\.|[^'\\])*)',\s*$/);
    if (roadMatch) {
      const roadAddressValue = unquote(`'${roadMatch[1]}'`);
      const address = roadAddressValue || addressValue;
      const dong = (address || '').trim().split(/\s+/).pop() || '';

      const latMatch = (lines[i + 1] || '').match(/^(\s*)lat:\s*(-?\d+(?:\.\d+)?),\s*$/);
      const lngMatch = (lines[i + 2] || '').match(/^(\s*)lng:\s*(-?\d+(?:\.\d+)?),\s*$/);
      if (latMatch && lngMatch) {
        records.push({
          latLineIdx: i + 1,
          indent: latMatch[1],
          lat: parseFloat(latMatch[2]),
          lng: parseFloat(lngMatch[2]),
          name: nameValue,
          address,
          dong,
        });
      }
    }
  }

  return records;
}

function groupByCoords(records) {
  const groups = new Map();
  for (const r of records) {
    const key = `${r.lat},${r.lng}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  return groups;
}

function spreadGroupInCircle(lines, entries) {
  const { lat: centerLat, lng: centerLng } = entries[0];
  const n = entries.length;
  const radiusDeg = 0.0004 + Math.min(n, 20) * 0.00002; // 대략 45m ~ 65m

  entries.forEach((entry, idx) => {
    const angle = (idx / n) * Math.PI * 2;
    const newLat = centerLat + Math.sin(angle) * radiusDeg;
    const newLng = centerLng + Math.cos(angle) * radiusDeg;
    lines[entry.latLineIdx] = `${entry.indent}lat: ${newLat},`;
    lines[entry.latLineIdx + 1] = `${entry.indent}lng: ${newLng},`;
  });
}

// refix 모드: 중복 좌표 그룹만 골라서 더 나아진 장소명 추출 로직으로 재검색.
// 그래도 겹치면 원형으로 흩어놓는 걸로 마무리.
async function runRefixMode() {
  console.log('모드: refix (중복 좌표만 골라 재검색 → 그래도 겹치면 원형으로 흩어놓기)');
  const src = fs.readFileSync(TARGET_FILE, 'utf8');
  const lines = src.split('\n');

  const records = parseRecords(lines);
  const groups = groupByCoords(records);
  const dupGroups = [...groups.values()].filter((g) => g.length > 1);

  const totalDupEntries = dupGroups.reduce((sum, g) => sum + g.length, 0);
  console.log(`중복 좌표 그룹 ${dupGroups.length}개 (총 ${totalDupEntries}건) 발견. 재검색 시작...`);

  let reGeocoded = 0;
  let stillStuck = 0;

  for (const group of dupGroups) {
    for (const entry of group) {
      try {
        const tries = buildKeywordTries(entry.dong, entry.name, entry.address);
        const coords = await tryGeocodeKeyword(tries);
        if (coords) {
          lines[entry.latLineIdx] = `${entry.indent}lat: ${coords.lat},`;
          lines[entry.latLineIdx + 1] = `${entry.indent}lng: ${coords.lng},`;
          entry.lat = coords.lat;
          entry.lng = coords.lng;
          reGeocoded++;
        }
      } catch (err) {
        console.error(`  ! ${entry.name} -> ${err.message}`);
      }
      await sleep(80);
    }
  }

  // 재검색 후 좌표가 바뀐 항목들을 반영해서 다시 그룹핑 -> 그래도 겹치는 것만 원형 분산
  const refreshed = parseRecords(lines);
  const refreshedGroups = groupByCoords(refreshed);
  for (const group of refreshedGroups.values()) {
    if (group.length <= 1) continue;
    spreadGroupInCircle(lines, group);
    stillStuck += group.length;
  }

  fs.writeFileSync(TARGET_FILE, lines.join('\n'));
  console.log(
    `완료: 재검색으로 실제 다른 좌표를 찾은 항목 ${reGeocoded}건, ` +
      `그래도 겹쳐서 원형으로 흩어놓은 항목 ${stillStuck}건.`
  );
}

// dedupe 모드: 이미 채워진 lat/lng 중 완전히 동일한 좌표를 가진 그룹을 찾아
// 그 지점을 중심으로 반경 약 40~90m 원 위에 고르게 흩어 놓는다.
// (Kakao API 호출 없음 — 순수하게 파일 내용만 재배치)
function runDedupeMode() {
  console.log('모드: dedupe (중복 좌표를 원 모양으로 흩어놓기, API 호출 없음)');
  const src = fs.readFileSync(TARGET_FILE, 'utf8');
  const lines = src.split('\n');

  const records = parseRecords(lines);
  const groups = groupByCoords(records);
  const dupGroups = [...groups.values()].filter((g) => g.length > 1);

  let movedCount = 0;
  for (const group of dupGroups) {
    spreadGroupInCircle(lines, group);
    movedCount += group.length;
  }

  fs.writeFileSync(TARGET_FILE, lines.join('\n'));
  console.log(`완료: 중복 좌표 그룹 ${dupGroups.length}개 발견, 총 ${movedCount}건 좌표를 흩어놓음.`);
  if (dupGroups.length === 0) {
    console.log('완전히 동일한 좌표를 가진 항목이 없습니다. (이미 해결됐거나 애초에 없었음)');
  }
}

async function main() {
  if (MODE === 'dedupe') {
    runDedupeMode();
  } else if (MODE === 'refix') {
    await runRefixMode();
  } else {
    await runGeocodeMode();
  }
}

main();
