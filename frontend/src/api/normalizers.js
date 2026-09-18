const compact = (value) => String(value ?? '').replace(/,/g, '').trim();

export const finiteNumber = (value, fallback = null) => {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(compact(value));
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const booleanValue = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    if (/^(true|y|yes|1)$/i.test(value.trim())) return true;
    if (/^(false|n|no|0)$/i.test(value.trim())) return false;
  }
  return fallback;
};

export function normalizeGeoPoint(value = {}) {
  const coordinates = Array.isArray(value) ? value : value?.coordinates;
  const longitude = finiteNumber(
    value?.longitude ?? value?.lng ?? value?.lon ?? value?.x ?? coordinates?.[0],
  );
  const latitude = finiteNumber(
    value?.latitude ?? value?.lat ?? value?.y ?? coordinates?.[1],
  );
  if (latitude == null || longitude == null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return { latitude: null, longitude: null };
  }
  return { latitude, longitude };
}

export function normalizeLocationItem(item = {}) {
  const point = normalizeGeoPoint(item.point ?? item.location?.point ?? item.coordinate ?? item.coordinates ?? item);
  return {
    ...item,
    id: String(item.id ?? item.placeId ?? item.locationId ?? item.contentId ?? ''),
    name: item.name ?? item.placeName ?? item.place_name ?? item.title ?? '',
    region: item.region ?? item.administrativeArea ?? item.region_1depth_name ?? '',
    district: item.district ?? item.localArea ?? item.region_2depth_name ?? '',
    address: item.address ?? item.roadAddress ?? item.road_address_name ?? item.address_name ?? '',
    category: item.category ?? item.categoryName ?? item.category_name ?? '',
    point,
    latitude: point.latitude,
    longitude: point.longitude,
    externalId: String(item.externalId ?? item.providerId ?? item.id ?? ''),
    deepLink: item.deepLink ?? item.placeUrl ?? item.place_url ?? null,
    distanceKm: finiteNumber(item.distanceKm, finiteNumber(item.distanceMeters ?? item.distance) == null ? null : finiteNumber(item.distanceMeters ?? item.distance) / 1000),
  };
}

const vertexPairs = (values = []) => {
  const points = [];
  for (let index = 0; index < values.length - 1; index += 2) {
    const point = normalizeGeoPoint([values[index], values[index + 1]]);
    if (point.latitude != null) points.push(point);
  }
  return points;
};

export function normalizeRouteResult(payload = {}, requestedProvider = 'auto') {
  const root = payload?.data ?? payload?.routeResult ?? payload;
  const kakaoRoute = root?.routes?.[0];
  const kakaoSummary = kakaoRoute?.summary;
  const tmapFeatures = root?.features ?? root?.route?.features ?? [];
  const tmapProperties = tmapFeatures.map((feature) => feature?.properties ?? {}).find(
    (properties) => properties.totalDistance != null || properties.totalTime != null,
  ) ?? root?.properties ?? {};
  const distanceMeters = finiteNumber(
    root?.distanceMeters ?? kakaoSummary?.distance ?? tmapProperties.totalDistance,
  );
  const durationSeconds = finiteNumber(
    root?.durationSeconds ?? kakaoSummary?.duration ?? tmapProperties.totalTime,
  );
  const distanceKm = finiteNumber(root?.distanceKm, distanceMeters == null ? null : distanceMeters / 1000);
  const durationMinutes = finiteNumber(root?.durationMinutes, durationSeconds == null ? null : durationSeconds / 60);
  if (distanceKm == null || durationMinutes == null) {
    throw new TypeError('경로 응답에 유효한 거리 또는 소요 시간이 없습니다.');
  }
  const kakaoPolyline = (kakaoRoute?.sections ?? []).flatMap((section) =>
    (section?.roads ?? []).flatMap((road) => vertexPairs(road?.vertexes)),
  );
  const tmapPolyline = tmapFeatures.flatMap((feature) => {
    const coordinates = feature?.geometry?.coordinates ?? [];
    if (feature?.geometry?.type === 'LineString') return coordinates.map(normalizeGeoPoint).filter((point) => point.latitude != null);
    if (feature?.geometry?.type === 'MultiLineString') return coordinates.flat().map(normalizeGeoPoint).filter((point) => point.latitude != null);
    return [];
  });
  const canonicalPolyline = (root?.polyline ?? []).map(normalizeGeoPoint).filter((point) => point.latitude != null);
  return {
    id: root?.id ?? payload?.id ?? null,
    dayIndex: finiteNumber(root?.dayIndex ?? payload?.dayIndex),
    fromEventId: root?.fromEventId ?? payload?.fromEventId ?? null,
    toEventId: root?.toEventId ?? payload?.toEventId ?? null,
    provider: root?.provider ?? (kakaoRoute ? 'KAKAO_MOBILITY' : tmapFeatures.length ? 'TMAP' : requestedProvider),
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMinutes: Math.max(1, Math.ceil(durationMinutes)),
    tollFee: Math.max(0, Math.round(finiteNumber(root?.tollFee ?? kakaoSummary?.fare?.toll ?? tmapProperties.tollFare ?? tmapProperties.totalFare, 0))),
    taxiFee: Math.max(0, Math.round(finiteNumber(root?.taxiFee ?? kakaoSummary?.fare?.taxi ?? tmapProperties.taxiFare, 0))),
    fuelFee: Math.max(0, Math.round(finiteNumber(root?.fuelFee, 0))),
    parkingFee: Math.max(0, Math.round(finiteNumber(root?.parkingFee, 0))),
    polyline: canonicalPolyline.length ? canonicalPolyline : kakaoPolyline.length ? kakaoPolyline : tmapPolyline,
    legs: root?.legs ?? kakaoRoute?.sections?.map((section) => ({
      distanceKm: finiteNumber(section.distance, 0) / 1000,
      durationMinutes: Math.ceil(finiteNumber(section.duration, 0) / 60),
      instruction: section.name ?? '',
    })) ?? [],
    deepLink: root?.deepLink ?? null,
    calculatedAt: root?.calculatedAt ?? new Date().toISOString(),
    trafficObservedAt: root?.trafficObservedAt ?? null,
    quoteExpiresAt: root?.quoteExpiresAt ?? null,
    assumptions: Array.isArray(root?.assumptions) ? root.assumptions : [],
  };
}

export function normalizeOffer(item = {}, kind = item.kind ?? 'unknown') {
  const priceObject = typeof item.price === 'object' ? item.price : {};
  const pricePerPerson = finiteNumber(
    item.pricePerPerson ?? item.perPerson ?? item.farePerPerson ?? priceObject.perPerson ?? priceObject.amount ?? item.fare,
  );
  if (!item.id || pricePerPerson == null) return null;
  return {
    ...item,
    id: String(item.id),
    kind: item.kind ?? kind,
    provider: item.provider ?? item.vendor ?? '',
    title: item.title ?? item.name ?? '',
    pricePerPerson: Math.max(0, Math.round(pricePerPerson)),
    currency: item.currency ?? priceObject.currency ?? 'KRW',
    isMock: booleanValue(item.isMock, false),
    priceStatus: item.priceStatus ?? (booleanValue(item.isMock, false) ? 'MOCK' : 'LIVE'),
    sourceLabel: item.sourceLabel ?? item.provider ?? '',
    refreshedAt: item.refreshedAt ?? null,
    quoteExpiresAt: item.quoteExpiresAt ?? null,
  };
}

export function normalizeOfferEnvelope(payload = {}, kind) {
  const root = payload?.data ?? payload;
  const source = Array.isArray(root) ? root : root?.items ?? root?.offers ?? root?.results ?? [];
  return {
    ...(!Array.isArray(root) ? root : {}),
    items: source.map((item) => normalizeOffer(item, kind)).filter(Boolean),
    isMock: booleanValue(root?.isMock, false),
    sourceLabel: root?.sourceLabel ?? root?.provider ?? '',
    refreshedAt: root?.refreshedAt ?? null,
  };
}

export function normalizeContentEnvelope(payload = {}) {
  const root = payload?.data ?? payload;
  const source = Array.isArray(root) ? root : root?.items ?? root?.documents ?? root?.results ?? [];
  return {
    ...(!Array.isArray(root) ? root : {}),
    items: source.map(normalizeLocationItem).filter((item) => item.id && item.name),
    isMock: booleanValue(root?.isMock, false),
    sourceLabel: root?.sourceLabel ?? root?.provider ?? '',
  };
}

export function normalizeRestaurantDetail(payload = {}) {
  const root = payload?.data ?? payload?.restaurant ?? payload;
  const location = normalizeLocationItem(root);
  const sourceMenus = root?.menus ?? root?.menuItems ?? root?.menuList ?? [];
  const representativeImageUrl =
    root?.representativeImageUrl ?? root?.representative_image_url ?? null;
  const imageUrls = [
    representativeImageUrl,
    ...(Array.isArray(root?.imageUrls) ? root.imageUrls : []),
    ...(Array.isArray(root?.images) ? root.images.map((image) => typeof image === 'string' ? image : image?.url) : []),
    root?.imageUrl,
  ].filter((url, index, list) => typeof url === 'string' && /^https:\/\//i.test(url) && list.indexOf(url) === index);
  return {
    ...location,
    representativeImageUrl:
      /^https:\/\//i.test(representativeImageUrl || '') ? representativeImageUrl : null,
    imageUrls,
    menus: sourceMenus.map((menu, index) => ({
      id: String(menu?.id ?? `menu-${index + 1}`),
      name: menu?.name ?? menu?.menuName ?? menu?.title ?? '',
      price: finiteNumber(menu?.price ?? menu?.amount),
      description: menu?.description ?? menu?.summary ?? '',
      imageUrl: /^https:\/\//i.test(menu?.imageUrl ?? menu?.image ?? '') ? (menu.imageUrl ?? menu.image) : null,
      isSignature: booleanValue(menu?.isSignature ?? menu?.representative, false),
    })).filter((menu) => menu.name),
    rating: finiteNumber(root?.rating ?? root?.reviewRating),
    reviewCount: Math.max(0, Math.round(finiteNumber(root?.reviewCount ?? root?.reviewsCount, 0))),
    reviewSummary: root?.reviewSummary ?? root?.reviews?.summary ?? '',
    reviewKeywords: Array.isArray(root?.reviewKeywords) ? root.reviewKeywords : (root?.reviews?.keywords ?? []),
    businessHours: root?.businessHours ?? root?.openingHours ?? '',
    phone: root?.phone ?? root?.telephone ?? '',
    placeUrl: root?.placeUrl ?? root?.place_url ?? location.deepLink ?? null,
    naverMapUrl: root?.naverMapUrl ?? root?.deepLinks?.naverMap ?? null,
    provider: root?.provider ?? '',
    isMock: booleanValue(root?.isMock, false),
    sourceLabel: root?.sourceLabel ?? root?.source ?? root?.provider ?? '',
    refreshedAt: root?.refreshedAt ?? root?.updatedAt ?? null,
  };
}

export function normalizeCostEstimate(payload = {}, travelers = 1) {
  const root = payload?.data ?? payload?.costEstimate ?? payload;
  if (!root || (
    root.total == null
    && root.grandTotal == null
    && root.perPerson == null
    && !Array.isArray(root.items)
    && !Array.isArray(root.lineItems)
  )) {
    throw new TypeError('비용 응답에 합계 또는 상세 항목이 없습니다.');
  }
  const safeTravelers = Math.max(1, Math.round(finiteNumber(travelers, 1)));
  const items = (root?.items ?? root?.lineItems ?? []).map((item, index) => {
    const scope = item.scope === 'shared' ? 'shared' : 'personal';
    const suppliedPerPerson = finiteNumber(item.perPerson);
    const suppliedTotal = finiteNumber(item.total ?? item.amount);
    const total = Math.max(0, Math.round(
      suppliedTotal ?? (suppliedPerPerson != null ? suppliedPerPerson * safeTravelers : 0),
    ));
    const perPerson = Math.max(0, Math.round(
      suppliedPerPerson ?? total / safeTravelers,
    ));
    return { ...item, id: item.id ?? `cost-${index + 1}`, scope, total, perPerson, approximate: booleanValue(item.approximate, false) };
  });
  const calculatedTotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(0, Math.round(finiteNumber(root?.total ?? root?.grandTotal, calculatedTotal)));
  return {
    ...root,
    total,
    perPerson: Math.max(0, Math.round(finiteNumber(root?.perPerson, total / safeTravelers))),
    currency: root?.currency ?? 'KRW',
    items,
    assumptions: Array.isArray(root?.assumptions) ? root.assumptions : [],
    isMock: booleanValue(root?.isMock, false),
    calculatedAt: root?.calculatedAt ?? null,
  };
}

const OPINET_PRODUCT_CODES = { gasoline: 'B027', diesel: 'D047', lpg: 'K015' };
export function normalizeFuelPrice(payload = {}, fuelType = 'gasoline') {
  const root = payload?.data ?? payload;
  const oils = root?.RESULT?.OIL ?? root?.result?.oil ?? root?.items ?? [];
  const productCode = OPINET_PRODUCT_CODES[fuelType] ?? OPINET_PRODUCT_CODES.gasoline;
  const item = oils.find((oil) => (oil.PRODCD ?? oil.productCode) === productCode) ?? oils[0] ?? root;
  const pricePerL = finiteNumber(item?.PRICE ?? item?.pricePerL ?? item?.price);
  if (pricePerL == null) throw new TypeError('유가 응답에 유효한 리터당 가격이 없습니다.');
  return {
    fuelType,
    productCode: item?.PRODCD ?? item?.productCode ?? productCode,
    productName: item?.PRODNM ?? item?.productName ?? fuelType,
    pricePerL,
    observedDate: item?.TRADE_DT ?? item?.observedDate ?? null,
    difference: finiteNumber(item?.DIFF ?? item?.difference, 0),
    provider: root?.provider ?? 'OPINET',
  };
}
