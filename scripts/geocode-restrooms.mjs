#!/usr/bin/env node
// Fill restroom coordinates in a TypeScript facility data file.
// Existing generated coordinates are replaced by default because they may be
// dong-level fallback points. Set FORCE_GEOCODE=0 to keep existing coordinates.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetFile = path.resolve(root, process.env.TARGET_FILE || 'src/data/importedFacilities.ts');
const apiKey = process.env.KAKAO_REST_API_KEY?.trim();
const forceGeocode = process.env.FORCE_GEOCODE !== '0';
if (!apiKey) {
  console.error('KAKAO_REST_API_KEY 환경변수를 설정하세요.');
  process.exit(1);
}
if (!/^[\x21-\x7E]+$/.test(apiKey)) {
  console.error('KAKAO_REST_API_KEY에는 카카오 REST API 키만 입력하세요. 안내 문구나 한글을 포함하면 안 됩니다.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const unescapeLiteral = (value) => value.replace(/\\'/g, "'").replace(/\\\\/g, '\\');

async function geocode(address) {
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
  const response = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
  if (!response.ok) throw new Error(`Kakao API ${response.status}`);
  const data = await response.json();
  const document = data.documents?.[0];
  if (!document) return null;
  return { lat: Number(document.y), lng: Number(document.x) };
}

async function searchPlace(name, address) {
  const query = address ? `${name} 안양 ${address}` : `${name} 안양`;
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?size=1&query=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
  if (!response.ok) throw new Error(`Kakao keyword API ${response.status}`);
  const data = await response.json();
  const document = data.documents?.[0];
  if (!document) return null;
  const lat = Number(document.y);
  const lng = Number(document.x);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

const source = fs.readFileSync(targetFile, 'utf8');

async function updateGeneratedFacilityFile() {
  const jsonMatch = source.match(/JSON\.parse\(("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\) as Facility\[\];/s);
  if (!jsonMatch) return false;

  const records = JSON.parse(JSON.parse(jsonMatch[1]));
  let updated = 0;
  let failed = [];
  for (const record of records) {
    if (record.category !== 'restroom') continue;
    const candidate = record.roadAddress || record.address;
    if (!candidate) {
      failed.push(`${record.name}: 주소 없음`);
      continue;
    }
    try {
      const coordinate = await geocode(candidate)
        || await searchPlace(record.name, candidate)
        || await searchPlace(record.name, '');
      if (coordinate) {
        record.lat = coordinate.lat;
        record.lng = coordinate.lng;
        updated += 1;
      } else {
        failed.push(`${record.name}: ${candidate}`);
      }
    } catch (error) {
      failed.push(`${record.name}: ${candidate} (${error.message})`);
    }
    if (updated % 20 === 0) console.log(`  ...${updated}건 처리`);
    await sleep(100);
  }

  const replacement = `JSON.parse(${JSON.stringify(JSON.stringify(records))}) as Facility[];`;
  fs.writeFileSync(targetFile, source.replace(jsonMatch[0], replacement), 'utf8');
  console.log(`완료: ${updated}건 좌표 갱신, ${records.filter((record) => record.category === 'restroom').length - updated - failed.length}건 기존 좌표 유지, ${failed.length}건 실패`);
  if (failed.length) failed.forEach((item) => console.warn(`- ${item}`));
  return true;
}

const lines = source.split(/\r?\n/);
const output = [];
let current = { category: '', name: '', address: '', roadAddress: '', lat: null, lng: null, hasLat: false, hasLng: false };
let updated = 0;
let skipped = 0;
let failed = [];

function resetCurrent() {
  return { category: '', name: '', address: '', roadAddress: '', lat: null, lng: null, hasLat: false, hasLng: false };
}

async function flushLine(line) {
  const nameMatch = line.match(/^\s*name: '((?:\\.|[^'\\])*)',/);
  const addressMatch = line.match(/^\s*address: '((?:\\.|[^'\\])*)',/);
  const roadMatch = line.match(/^\s*roadAddress: '((?:\\.|[^'\\])*)',/);
  const latMatch = line.match(/^\s*lat:\s*-?\d/);
  const lngMatch = line.match(/^\s*lng:\s*-?\d/);

  if (nameMatch) current.name = unescapeLiteral(nameMatch[1]);
  if (addressMatch) current.address = unescapeLiteral(addressMatch[1]);
  if (roadMatch) current.roadAddress = unescapeLiteral(roadMatch[1]);
  if (latMatch) current.hasLat = true;
  if (lngMatch) current.hasLng = true;

  output.push(line);

  const isObjectEnd = /^\s*},?\s*$/.test(line);
  if (!isObjectEnd) return;
  if (current.category === 'restroom' && current.hasLat && current.hasLng) skipped += 1;
  current = resetCurrent();
}

async function main() {
  if (await updateGeneratedFacilityFile()) return;

  // Process object blocks so coordinates are inserted only into restroom records.
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nameMatch = line.match(/^\s*name: '((?:\\.|[^'\\])*)',/);
    const categoryMatch = line.match(/^\s*category: '((?:\\.|[^'\\])*)',/);
    const addressMatch = line.match(/^\s*address: '((?:\\.|[^'\\])*)',/);
    const roadMatch = line.match(/^\s*roadAddress: '((?:\\.|[^'\\])*)',/);
    if (nameMatch) current.name = unescapeLiteral(nameMatch[1]);
    if (categoryMatch) current.category = unescapeLiteral(categoryMatch[1]);
    if (addressMatch) current.address = unescapeLiteral(addressMatch[1]);
    if (roadMatch) current.roadAddress = unescapeLiteral(roadMatch[1]);
    const isLatLine = /^\s*lat:\s*-?\d/.test(line);
    const isLngLine = /^\s*lng:\s*-?\d/.test(line);
    if (isLatLine) {
      current.hasLat = true;
      current.lat = Number(line.match(/-?\d+(?:\.\d+)?/)?.[0]);
    }
    if (isLngLine) {
      current.hasLng = true;
      current.lng = Number(line.match(/-?\d+(?:\.\d+)?/)?.[0]);
    }

    if (forceGeocode && current.category === 'restroom' && (isLatLine || isLngLine)) {
      continue;
    }

    const isObjectEnd = /^\s*},?\s*$/.test(line);
    if (isObjectEnd && current.category === 'restroom' && (forceGeocode || !current.hasLat || !current.hasLng)) {
      const candidate = current.roadAddress || current.address;
      if (candidate) {
        try {
          const coordinate = await geocode(candidate);
          const resolvedCoordinate = coordinate
            || await searchPlace(current.name, candidate)
            || await searchPlace(current.name, '');
          if (resolvedCoordinate) {
            output.push(`    lat: ${resolvedCoordinate.lat},`);
            output.push(`    lng: ${resolvedCoordinate.lng},`);
            updated += 1;
          } else {
            if (current.lat !== null && current.lng !== null) {
              output.push(`    lat: ${current.lat},`);
              output.push(`    lng: ${current.lng},`);
            }
            failed.push(`${current.name}: ${candidate}`);
          }
        } catch (error) {
          if (current.lat !== null && current.lng !== null) {
            output.push(`    lat: ${current.lat},`);
            output.push(`    lng: ${current.lng},`);
          }
          failed.push(`${current.name}: ${candidate} (${error.message})`);
        }
        await sleep(100);
      } else {
        if (current.lat !== null && current.lng !== null) {
          output.push(`    lat: ${current.lat},`);
          output.push(`    lng: ${current.lng},`);
        }
        failed.push(`${current.name}: 주소 없음`);
      }
    }

    output.push(line);
    if (isObjectEnd) current = resetCurrent();
  }

  fs.writeFileSync(targetFile, output.join('\n'), 'utf8');
  console.log(`완료: ${updated}건 좌표 갱신, ${skipped}건 기존 좌표 유지, ${failed.length}건 실패`);
  if (failed.length) failed.forEach((item) => console.warn(`- ${item}`));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
