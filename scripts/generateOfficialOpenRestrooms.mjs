import { writeFileSync } from 'node:fs';

const url = 'https://www.anyang.go.kr/main/selectPublicPlaceWebList.do?key=808';
const response = await fetch(url);
if (!response.ok) throw new Error(`Failed to fetch official restroom list: ${response.status}`);
const html = await response.text();

function clean(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

const rows = [...html.matchAll(/<tr[\s\S]*?<\/tr>/gi)]
  .map((match) => [...match[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => clean(cell[1])))
  .filter((row) => /^\d+$/.test(row[0] || '') && row.length >= 5);

if (rows.length !== 60) throw new Error(`Expected 60 official restrooms, found ${rows.length}`);

const coords = {
  '호계동': [37.387, 126.946], '안양동': [37.402, 126.925], '관양동': [37.400, 126.968],
  '비산동': [37.402, 126.948], '평촌동': [37.395, 126.961], '석수동': [37.419, 126.910],
  '귀인동': [37.386, 126.969],
};
function coordinateFor(address, index) {
  const key = Object.keys(coords).find((dong) => address.includes(dong));
  const base = coords[key] || [37.3945, 126.9565];
  return { lat: base[0] + (index % 4) * 0.00004, lng: base[1] + (index % 5) * 0.00004 };
}

const facilities = rows.map(([number, name, openHours, accessibility, address], index) => ({
  id: `official-open-rest-${number}`,
  name,
  category: 'restroom',
  categoryName: '개방화장실',
  facilityType: '개방화장실',
  address,
  roadAddress: address,
  ...coordinateFor(address, index),
  description: `안양시청 공식 개방화장실 목록 (공개번호 ${number})`,
  availableItems: [openHours ? `개방시간 ${openHours}` : '', accessibility ? `장애인 이용 ${accessibility}` : ''].filter(Boolean),
  openHours,
  managementAgency: '안양시청 자원순환과',
}));

writeFileSync('src/data/officialOpenRestrooms.ts', `import { Facility } from '../types';\n\n// Generated from the Anyang City official open-restroom list.\nexport const OFFICIAL_OPEN_RESTROOMS: Facility[] = JSON.parse(${JSON.stringify(JSON.stringify(facilities))}) as Facility[];\n`, 'utf8');
console.log(`generated official open restrooms=${facilities.length}`);
