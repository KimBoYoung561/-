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
// 카카오 개발자센터(https://developers.kakao.com) > 애플리케이션 > 앱 키 > REST API 키

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_FILE = process.env.TARGET_FILE
  ? path.resolve(process.cwd(), process.env.TARGET_FILE)
  : path.join(__dirname, '..', 'data', 'restrooms.ts');

const MODE = process.env.GEOCODE_MODE === 'keyword' ? 'keyword' : 'address';

// 안양시 중심 좌표. 키워드 검색 시 이 좌표 주변을 우선해서 동명이인(같은 이름의
// 다른 지역 장소)에 걸리지 않도록 함.
const ANYANG_CENTER = { x: 126.9568, y: 37.3943 };

const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
if (!KAKAO_KEY) {
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
  return MODE === 'keyword' ? geocodeKeyword(query) : geocodeAddress(query);
}

function unquote(jsLiteral) {
  return jsLiteral.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

// "안양역 1번출구 앞(메타볼쪽)" -> "안양역 1번출구 앞" 처럼 괄호 설명 제거.
// 괄호 안 내용은 실제 장소 이름이 아닌 경우가 많아 검색을 방해함.
function stripParens(s) {
  return s.replace(/[（(][^)）]*[)）]/g, '').replace(/\s+/g, ' ').trim();
}

// "안양역 1번출구 앞" -> "안양역 1번출구" 처럼 끝에 붙은 위치 설명 단어 제거.
// 이런 단어는 장소 이름이 아니라 "그 근처"라는 뜻이라 검색을 방해함.
const TRAILING_WORDS = ['앞', '뒤', '옆', '위', '밑', '아래', '안', '내', '건너편', '입구', '근처', '주변', '쪽'];
function stripTrailingWord(s) {
  for (const w of TRAILING_WORDS) {
    if (s.endsWith(w) && s.length > w.length) {
      return s.slice(0, -w.length).trim();
    }
  }
  return s;
}

async function main() {
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
          const cleanName = nameValue ? stripParens(nameValue) : nameValue;
          let shortName = cleanName;
          while (shortName) {
            const next = stripTrailingWord(shortName);
            if (next === shortName) break;
            shortName = next;
          }
          // 점점 넓혀가며 재시도:
          // 동+이름(괄호/위치단어 제거) -> 이름만(괄호/위치단어 제거) -> 동+이름(괄호만 제거)
          // -> 이름만(괄호만 제거) -> 동+원본이름 -> 전체주소+이름
          const tries = [
            shortName ? `${dong} ${shortName}`.trim() : null,
            shortName,
            cleanName ? `${dong} ${cleanName}`.trim() : null,
            cleanName,
            candidate,
            address && nameValue ? `${address} ${nameValue}` : null,
          ].filter((q, idx, arr) => q && arr.indexOf(q) === idx);

          for (const q of tries) {
            coords = await geocode(q);
            if (coords) break;
            await sleep(80);
          }

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

main();
