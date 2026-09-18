import { API_SOURCE_LABELS } from './contracts';

const point = (latitude, longitude) => ({ latitude, longitude });

// 실제 좌표를 사용한 화면 시연용 최소 장소 목록. 운영에서는 백엔드 위치 검색 결과가 우선한다.
export const MOCK_PLACES = [
  { id: 'seoul-gyeongbokgung', name: '경복궁', category: '관광지', address: '서울특별시 종로구 사직로 161', point: point(37.5796, 126.9770), provider: 'KTO' },
  { id: 'busan-haeundae', name: '해운대해수욕장', category: '관광지', address: '부산광역시 해운대구 해운대해변로 264', point: point(35.1587, 129.1604), provider: 'KTO' },
  { id: 'incheon-songdo', name: '송도센트럴파크', category: '관광지', address: '인천광역시 연수구 컨벤시아대로 196', point: point(37.3921, 126.6395), provider: 'KTO' },
  { id: 'gyeonggi-suwon', name: '수원화성', category: '관광지', address: '경기도 수원시 장안구 영화동', point: point(37.2861, 127.0157), provider: 'KTO' },
  { id: 'gangwon-seorak', name: '설악산국립공원', category: '관광지', address: '강원특별자치도 속초시 설악산로 833', point: point(38.1194, 128.4656), provider: 'KTO' },
  { id: 'jeju-hyeopjae', name: '협재해수욕장', category: '관광지', address: '제주특별자치도 제주시 한림읍 협재리', point: point(33.3939, 126.2394), provider: 'KTO' },
  { id: 'jeju-cheonjeyeon', name: '천제연폭포', category: '관광지', address: '제주특별자치도 서귀포시 천제연로 132', point: point(33.2522, 126.4184), provider: 'KTO' },
  { id: 'gyeongju-daereungwon', name: '대릉원', category: '관광지', address: '경상북도 경주시 황남동', point: point(35.8385, 129.2128), provider: 'KTO' },
  { id: 'jeonju-hanok', name: '전주한옥마을', category: '관광지', address: '전북특별자치도 전주시 완산구 기린대로 99', point: point(35.8150, 127.1530), provider: 'KTO' },
].map((item) => ({ ...item, source: API_SOURCE_LABELS.kto, updatedAt: '2026-08-27T00:00:00+09:00' }));

export const MOCK_REGION_SUMMARIES = [
  ['서울특별시', 'SEOUL', 37.5665, 126.9780],
  ['부산광역시', 'BUSAN', 35.1796, 129.0756],
  ['대구광역시', 'DAEGU', 35.8714, 128.6014],
  ['인천광역시', 'INCHEON', 37.4563, 126.7052],
  ['광주광역시', 'GWANGJU', 35.1595, 126.8526],
  ['대전광역시', 'DAEJEON', 36.3504, 127.3845],
  ['울산광역시', 'ULSAN', 35.5384, 129.3114],
  ['세종특별자치시', 'SEJONG', 36.4800, 127.2890],
  ['경기도', 'GYEONGGI', 37.4138, 127.5183],
  ['강원특별자치도', 'GANGWON', 37.8228, 128.1555],
  ['충청북도', 'CHUNGBUK', 36.6357, 127.4914],
  ['충청남도', 'CHUNGNAM', 36.6588, 126.6728],
  ['전북특별자치도', 'JEONBUK', 35.8200, 127.1088],
  ['전라남도', 'JEONNAM', 34.8679, 126.9910],
  ['경상북도', 'GYEONGBUK', 36.4919, 128.8889],
  ['경상남도', 'GYEONGNAM', 35.4606, 128.2132],
  ['제주특별자치도', 'JEJU', 33.4890, 126.4983],
].map(([name, regionCode, latitude, longitude]) => ({
  id: `kr-${regionCode.toLowerCase()}`,
  name,
  region: name,
  regionCode,
  countryCode: 'KR',
  point: point(latitude, longitude),
}));

export function mockRoute({ origin, destination, mode = 'CAR' }) {
  const start = origin?.point ?? point(37.5665, 126.9780);
  const end = destination?.point ?? point(33.4890, 126.4983);
  const latitudeDistance = Math.abs((start.latitude ?? 0) - (end.latitude ?? 0)) * 111;
  const longitudeDistance = Math.abs((start.longitude ?? 0) - (end.longitude ?? 0)) * 88;
  const straightDistance = Math.round(Math.sqrt(latitudeDistance ** 2 + longitudeDistance ** 2));
  const multiplier = mode === 'CAR' ? 1.22 : mode === 'KTX' ? 1.08 : 1;
  const distanceKm = Math.max(1, Math.round(straightDistance * multiplier));
  const speed = mode === 'CAR' ? 68 : mode === 'KTX' ? 150 : mode === 'FLIGHT' ? 620 : 40;

  return {
    provider: 'mock-route',
    distanceKm,
    durationMinutes: Math.max(20, Math.round((distanceKm / speed) * 60)),
    tollFee: mode === 'CAR' ? Math.round(distanceKm * 67) : 0,
    polyline: [start, { latitude: (start.latitude + end.latitude) / 2, longitude: (start.longitude + end.longitude) / 2 }, end],
    legs: [{ instruction: `${origin?.name ?? '출발지'}에서 ${destination?.name ?? '도착지'}까지 이동`, distanceKm, durationMinutes: Math.max(20, Math.round((distanceKm / speed) * 60)) }],
    calculatedAt: new Date().toISOString(),
    isMock: true,
    sourceLabel: API_SOURCE_LABELS.mock,
  };
}

function seededPrice(seed, base, spread) {
  const sum = String(seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return base + (sum % spread);
}

export function mockTransportOffers(request, kind) {
  const suffix = request.leg === 'return' ? '도착편' : '가는 편';
  const base = kind === 'flight' ? 62900 : kind === 'ktx' ? 43800 : kind === 'ferry' ? 31500 : 27500;
  const providers = kind === 'flight'
    ? ['대한항공', '아시아나항공', '제주항공', '진에어']
    : kind === 'ktx'
      ? ['KTX', 'KTX-이음', 'ITX-새마을']
      : kind === 'ferry'
        ? ['연안여객선', '카페리']
        : ['시외버스', '고속버스'];

  return providers.map((provider, index) => {
    const hour = String(7 + index * 3).padStart(2, '0');
    const arrivalHour = String((10 + index * 3) % 24).padStart(2, '0');
    return {
      id: `mock-${kind}-${request.leg ?? 'outbound'}-${index + 1}`,
      kind,
      provider,
      title: `${provider} ${suffix}`,
      pricePerPerson: seededPrice(`${provider}-${request.departureDate}`, base, 29000),
      currency: 'KRW',
      departureAt: `${request.departureDate}T${hour}:00:00+09:00`,
      arrivalAt: `${request.departureDate}T${arrivalHour}:15:00+09:00`,
      durationMinutes: kind === 'flight' ? 75 : kind === 'ktx' ? 160 : kind === 'ferry' ? 280 : 210,
      isMock: true,
      sourceLabel: API_SOURCE_LABELS.mock,
      refreshedAt: new Date().toISOString(),
      details: { leg: request.leg ?? 'outbound', note: '실시간 운임 연동 전 시연용 데이터입니다.' },
    };
  });
}

export function mockLodgingOffers(request) {
  const area = request.destination?.district ?? request.destination?.region ?? '여행지';
  return ['스테이', '호텔', '레지던스', '리조트'].map((type, index) => ({
    id: `mock-lodging-${index + 1}`,
    kind: 'lodging',
    provider: '제휴 숙소 데모',
    title: `${area} ${type} ${index + 1}`,
    pricePerPerson: 52000 + index * 17500,
    currency: 'KRW',
    isMock: true,
    sourceLabel: API_SOURCE_LABELS.mock,
    refreshedAt: new Date().toISOString(),
    details: { nights: request.nights ?? 1, note: '제휴 숙소 API 연결 전 시연용 견적입니다.' },
  }));
}

export function mockRentalOffers(request) {
  return ['경차', '준중형', 'SUV', '전기차'].map((vehicleClass, index) => ({
    id: `mock-rental-${index + 1}`,
    kind: 'rental',
    provider: '렌터카 제휴 데모',
    title: `${vehicleClass} · ${request.days ?? 1}일 대여`,
    pricePerPerson: Math.round((79000 + index * 28500) / Math.max(request.travelers ?? 1, 1)),
    currency: 'KRW',
    isMock: true,
    sourceLabel: API_SOURCE_LABELS.mock,
    refreshedAt: new Date().toISOString(),
    details: {
      totalRentalPrice: 79000 + index * 28500,
      insurance: index === 0 ? '자차 미포함' : '기본 자차 포함',
      returnPolicy: index >= 2 ? '24시간 전 무료 취소' : '전일 17시 전 무료 취소',
    },
  }));
}
