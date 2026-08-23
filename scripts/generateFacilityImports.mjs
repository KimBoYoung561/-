import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TextDecoder } from 'node:util';

const root = process.cwd();
const decoder = new TextDecoder('euc-kr');
const readCsv = (name) => decoder.decode(readFileSync(join(root, name)));

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field.trim());
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field.trim());
    if (row.some((value) => value !== '')) rows.push(row);
  }
  return rows;
}

function records(text) {
  const rows = parseCsv(text);
  const headers = rows.shift();
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
}

const dongCoords = {
  '안양1동': [37.4017, 126.9225], '안양2동': [37.4015, 126.9175], '안양3동': [37.3982, 126.9185],
  '안양4동': [37.3985, 126.9235], '안양5동': [37.4005, 126.9265], '안양6동': [37.4030, 126.9295],
  '안양7동': [37.3970, 126.9325], '안양8동': [37.4050, 126.9340], '안양9동': [37.4140, 126.9330],
  '석수1동': [37.4250, 126.9025], '석수2동': [37.4190, 126.9130], '석수3동': [37.4110, 126.9070],
  '박달1동': [37.4030, 126.9080], '박달2동': [37.3970, 126.9050], '비산1동': [37.4020, 126.9450],
  '비산2동': [37.3980, 126.9500], '비산3동': [37.4080, 126.9480], '부흥동': [37.3935, 126.9500],
  '달안동': [37.3905, 126.9500], '관양동': [37.4000, 126.9650], '관양1동': [37.4020, 126.9680],
  '관양2동': [37.4000, 126.9740], '부림동': [37.3950, 126.9690], '평촌동': [37.3950, 126.9610],
  '평안동': [37.3940, 126.9670], '귀인동': [37.3860, 126.9690], '호계1동': [37.3850, 126.9500],
  '호계2동': [37.3910, 126.9430], '호계3동': [37.3860, 126.9360], '갈산동': [37.3990, 126.9690],
};
const defaultCoord = [37.3945, 126.9565];
// These are temporary build-time fallbacks only. Run geocode-restrooms.mjs with
// KAKAO_REST_API_KEY to replace restroom coordinates with address-level results.
function coordFor(text, index = 0) {
  const key = Object.keys(dongCoords).find((dong) => text.includes(dong));
  const base = dongCoords[key] ?? defaultCoord;
  return { lat: base[0] + (index % 5) * 0.00003, lng: base[1] + (index % 7) * 0.00003 };
}
const value = (record, ...keys) => keys.map((key) => record[key]).find((item) => item) ?? '';
const yes = (item) => item?.toUpperCase() === 'Y';
const number = (item) => Number(item || 0);
const failedRestroomNames = new Set([
  '갈뫼어린이공원 공중화장실', '관악수목원 공중화장실', '박달빗물펌프장공중화장실',
  '병목안 수리산약수터입구 공중화장실', '애향소공원 공중화장실', '최경환성지 앞 공중화장실', '느루소공원공영',
]);

const toilets = records(readCsv('공중화장실정보_경기안양시.csv')).map((item, index) => {
  const address = value(item, '소재지지번주소', '소재지도로명주소') || '경기도 안양시';
  const roadAddress = value(item, '소재지도로명주소');
  const kind = value(item, '구분명') || '공중화장실';
  const openHours = [value(item, '개방시간'), value(item, '개방시간상세')].filter(Boolean).join(' / ');
  const items = [
    `${number(item['남성용-대변기수']) + number(item['여성용-대변기수'])}개 대변기`,
    yes(item['비상벨설치여부']) ? '비상벨' : '', yes(item['화장실입구CCTV설치유무']) ? '입구 CCTV' : '',
    yes(item['기저귀교환대유무']) ? '기저귀교환대' : '', item['오물처리방식'] ? item['오물처리방식'] : '',
  ].filter(Boolean);
  const coord = coordFor(address, index);
  return {
    id: `csv-rest-${item['관리번호'] || index}`,
    name: item['화장실명'] || `${kind} ${item['관리번호'] || index}`,
    category: 'restroom', categoryName: kind, facilityType: kind === '개방화장실' ? '개방화장실' : '공중화장실',
    address, ...(roadAddress ? { roadAddress } : {}), ...coord,
    description: `${kind} 원본 데이터. 관리번호 ${item['관리번호'] || '미상'} / ${item['근거법령명'] || '법정 분류 미기재'}`,
    availableItems: items, ...(openHours ? { openHours } : {}),
    ...(item['전화번호'] ? { phone: item['전화번호'] } : {}),
    ...(item['관리기관명'] ? { managementAgency: item['관리기관명'] } : {}),
    emergencyBell: yes(item['비상벨설치여부']), disabledToilet: number(item['남성용-장애인용대변기수']) + number(item['여성용-장애인용대변기수']) > 0,
    cctv: yes(item['화장실입구CCTV설치유무']), diaperTable: yes(item['기저귀교환대유무']),
  };
}).filter((facility) =>
  !failedRestroomNames.has(facility.name)
);

const crosswalks = records(readCsv('경기도 안양시_공간정보시스템_횡단보도 현황_20240628.csv')).map((item, index) => {
  const coord = coordFor(item['관할지역'] || '', index);
  return {
    id: `csv-crosswalk-${item['관리번호'] || index}`,
    name: `${item['관할지역'] || '안양시'} 횡단보도 ${item['관리번호'] || index}`,
    category: 'hazard', categoryName: '횡단보도', facilityType: '횡단보도', address: `경기도 안양시 ${item['관할지역'] || ''}`.trim(),
    ...coord, description: `횡단보도 폭 ${item['횡단보도폭'] || '0'}m, 길이 ${item['횡단보도길이'] || '0'}m / 관리번호 ${item['관리번호'] || '미상'}`,
    availableItems: [`폭 ${item['횡단보도폭'] || '0'}m`, `길이 ${item['횡단보도길이'] || '0'}m`, `관할 ${item['관할지역'] || '안양시'}`],
  };
});

const bikes = [];
for (const [district, file] of [['동안구', '동안 자전거보관소 및 공기주입기 현황.csv'], ['만안구', '만안 자전거보관소 및 공기주입기 현황.csv']]) {
  const rows = parseCsv(readCsv(file));
  const pumpStart = rows.findIndex((row) => row.some((value) => value.includes('공기주입기')));
  const storageRows = rows.slice(0, pumpStart === -1 ? rows.length : pumpStart);
  const pumpRows = pumpStart === -1 ? [] : rows.slice(pumpStart);

  for (const row of storageRows) {
    const numberIndex = /^\d+$/.test(row[1] || '') ? 1 : /^\d+$/.test(row[0] || '') ? 0 : -1;
    if (numberIndex === -1) continue;
    const number = row[numberIndex];
    const place = row[numberIndex + 1] || '설치장소 미상';
    const capacity = row[numberIndex + 2];
    const note = row[numberIndex + 3];
    const coord = coordFor(place, bikes.length);
    bikes.push({
      id: `csv-bike-${district}-storage-${number}`,
      name: `${place} 자전거보관소`, category: 'parking', categoryName: '자전거 거치대', facilityType: '자전거보관소',
      address: `경기도 안양시 ${district} ${place}`, ...coord,
      description: `${district} 자전거 보관소 원본 데이터 (${number}번)`,
      availableItems: [`수용 규모 ${capacity || '미상'}대`, note ? `비고 ${note}` : ''].filter(Boolean),
      managementAgency: `안양시 ${district}`,
    });
  }

  for (const row of pumpRows) {
    if (!/^\d+$/.test(row[0] || '')) continue;
    const [number, place, electric, manual, note] = row;
    const coord = coordFor(place || '', bikes.length);
    bikes.push({
      id: `csv-bike-${district}-pump-${number}`,
      name: `${place || '설치장소 미상'} 공기주입기`, category: 'repair', categoryName: '수리/공기주입기', facilityType: '공기주입기',
      address: `경기도 안양시 ${district} ${place || '설치장소 미상'}`, ...coord,
      description: `${district} 자전거 공기주입기 원본 데이터 (${number}번)`,
      availableItems: [electric === 'O' ? '전동식' : '', manual === 'O' ? '수동식' : '', note ? `비고 ${note}` : ''].filter(Boolean),
      managementAgency: `안양시 ${district}`,
    });
  }
}

const output = `import { Facility } from '../types';\n\n// Generated from the supplied Anyang public-data CSV files.\nexport const IMPORTED_FACILITIES: Facility[] = JSON.parse(${JSON.stringify(JSON.stringify([...toilets, ...bikes, ...crosswalks]))}) as Facility[];\n`;
writeFileSync(join(root, 'src/data/importedFacilities.ts'), output, 'utf8');
console.log(`generated toilets=${toilets.length}, bikeFacilities=${bikes.length}, crosswalks=${crosswalks.length}`);
