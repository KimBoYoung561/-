#!/usr/bin/env node
// facility 데이터 파일(주소 정보가 담긴 .ts) 중 lat/lng가 아직 없는 항목만
// 카카오 로컬 API로 지오코딩해서 채워 넣는 1회성 스크립트.
// 이미 lat/lng가 있는 항목(roadAddress 바로 다음 줄이 lat: 인 경우)은 건드리지 않음.
//
// 사용법:
//   TARGET_FILE=data/facilities.ts KAKAO_REST_API_KEY=발급받은키 node scripts/geocode-restrooms.mjs
//   (TARGET_FILE 생략 시 기본값 data/restrooms.ts)
//
// 카카오 개발자센터(https://developers.kakao.com) > 애플리케이션 > 앱 키 > REST API 키

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_FILE = process.env.TARGET_FILE
  ? path.resolve(process.cwd(), process.env.TARGET_FILE)
  : path.join(__dirname, '..', 'data', 'restrooms.ts');

const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
if (!KAKAO_KEY) {
  console.error('환경변수 KAKAO_REST_API_KEY 를 설정한 뒤 다시 실행하세요.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function geocode(address) {
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

function unquote(jsLiteral) {
  return jsLiteral.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

async function main() {
  const src = fs.readFileSync(TARGET_FILE, 'utf8');
  const lines = src.split('\n');

  const out = [];
  let addressValue = null;
  let notFound = [];
  let done = 0;
  let skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    out.push(line);

    const addressMatch = line.match(/^\s*address: '((?:\\.|[^'\\])*)',\s*$/);
    if (addressMatch) addressValue = unquote(`'${addressMatch[1]}'`);

    const roadMatch = line.match(/^\s*roadAddress: '((?:\\.|[^'\\])*)',\s*$/);
    if (roadMatch) {
      const roadAddressValue = unquote(`'${roadMatch[1]}'`);
      const candidate = roadAddressValue || addressValue;

      const nextLine = lines[i + 1] || '';
      const alreadyHasCoords = /^\s*lat:\s*-?\d/.test(nextLine);
      if (alreadyHasCoords) {
        skipped++;
        continue; // 이미 좌표가 있는 항목은 그대로 둠
      }

          let coords = null;
      try {
        coords = await geocode(candidate);
        if (!coords && MODE === 'keyword' && nameValue) {
          coords = await geocode(nameValue); // 지역명 붙인 검색 실패 시 이름만으로 재시도
        }
        if (!coords && MODE === 'address' && addressValue && addressValue !== address) {
          coords = await geocode(addressValue);
        }
      } catch (err) {
        console.error(`  ! ${candidate} -> ${err.message}`);
      }

      if (coords) {
        out.push(`    lat: ${coords.lat},`);
        out.push(`    lng: ${coords.lng},`);
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
  console.log(`완료: ${done}건 신규 처리, ${skipped}건 이미 좌표 있어 건너뜀, 좌표 실패 ${notFound.length}건`);
  if (notFound.length) {
    console.log('실패한 항목 목록:');
    notFound.forEach((a) => console.log(`  - ${a}`));
  }
}

main();
