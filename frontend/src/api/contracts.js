/**
 * TripBuddy API 계약(Contract) 모음
 *
 * 화면은 이 파일의 DTO만 알고, 실제 외부 API(Naver/TMAP/관광공사/제휴사)는
 * 백엔드가 호출합니다. 브라우저에 API 키를 넣지 않는 것이 원칙입니다.
 */

/** @typedef {'KR' | 'INTL'} CountryCode */
/** @typedef {'CAR' | 'KTX' | 'FLIGHT' | 'FERRY' | 'BUS' | 'RENTAL' | 'PUBLIC_TRANSIT' | 'TAXI' | 'WALK'} TransportMode */

/**
 * @typedef {Object} GeoPoint
 * @property {number|null} latitude WGS84 위도
 * @property {number|null} longitude WGS84 경도
 */

/**
 * @typedef {Object} ApiLocation
 * @property {string} id 안정적인 내부 식별자
 * @property {string} name 화면에 보이는 장소명
 * @property {string} region 시·도 또는 국가/권역
 * @property {string=} district 시·군·구 또는 세부 지역
 * @property {CountryCode=} countryCode
 * @property {string=} regionCode 백엔드/지도 제공자 매핑용 코드
 * @property {GeoPoint} point 좌표. 직접 입력은 null 값 허용
 * @property {string[]=} airportCodes 인근 공항 IATA 코드
 * @property {boolean=} needsGeocoding 자유 입력 장소면 true
 * @property {string[]=} administrativePath ["대한민국", "경기도", "파주시"]처럼 표시·검색에 쓰는 행정 경로
 * @property {'COUNTRY'|'REGION'|'DISTRICT'|'PLACE'|'CUSTOM'=} placeType
 * @property {string=} timezone IANA 표준. 국내는 Asia/Seoul
 * @property {string=} source 좌표·행정구역의 제공 출처
 * @property {string=} sourceUpdatedAt 출처 기준 갱신 시각 ISO-8601
 */

/**
 * @typedef {Object} PlaceSearchRequest
 * @property {string} query
 * @property {'origin'|'destination'|'waypoint'=} role
 * @property {CountryCode=} countryCode
 * @property {string=} regionCode
 * @property {number=} limit
 */

/**
 * @typedef {Object} Place
 * @property {string} id 제공자 고유 ID
 * @property {string} name
 * @property {string} category
 * @property {string} address
 * @property {GeoPoint} point
 * @property {string=} provider Naver, TMAP, KTO 등
 * @property {string=} externalId 원 제공자 ID
 * @property {boolean=} isOpen 식당/매장 영업 상태
 * @property {string=} verifiedAt 마지막 검증 ISO 시간
 */

/**
 * @typedef {Object} RouteRequest
 * @property {ApiLocation} origin
 * @property {ApiLocation} destination
 * @property {ApiLocation[]=} waypoints
 * @property {TransportMode} mode
 * @property {string=} departureAt ISO-8601
 * @property {string=} arrivalAt ISO-8601. 귀가/도착 제약이 있는 일정에서 사용
 * @property {'fastest'|'lowest_cost'|'balanced'=} strategy
 * @property {{fuelType?:'gasoline'|'diesel'|'lpg'|'electric', fuelEfficiencyKmPerL?:number, vehicleClass?:string, isRoundTrip?:boolean}=} vehicle
 */

/**
 * @typedef {Object} RouteResult
 * @property {string} provider
 * @property {number} distanceKm
 * @property {number} durationMinutes
 * @property {number=} tollFee
 * @property {number=} taxiFee
 * @property {number=} fuelFee
 * @property {number=} parkingFee
 * @property {Array<{latitude:number, longitude:number}>} polyline WGS84 경로점
 * @property {Array<{instruction:string, distanceKm:number, durationMinutes:number}>} legs
 * @property {string=} deepLink
 * @property {string=} calculatedAt
 * @property {string=} trafficObservedAt 실시간 교통을 반영한 시각
 * @property {string=} quoteExpiresAt 통행료·교통 추정의 유효 기한
 * @property {string[]=} assumptions 경유지/통행료/교통량에 대한 가정
 */

/**
 * @typedef {Object} TourismSearchRequest
 * @property {ApiLocation} near
 * @property {string[]=} themes 맛집, 관광, 휴식 등
 * @property {{cuisineCodes:string[], matchMode:'ANY'|'ALL', noPreference:boolean, prioritizeNearby:boolean}=} diningPreferences 식당 검색용 음식 선호 필터
 * @property {number=} radiusMeters
 * @property {number=} limit
 */

/**
 * @typedef {Object} TourismSpot
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} address
 * @property {GeoPoint} point
 * @property {string=} imageUrl
 * @property {string[]=} imageUrls 상세/대체 장소 카드용 이미지 목록
 * @property {string=} representativeMenu 식당 대표 메뉴
 * @property {number=} distanceKm 현재 일정 장소에서의 도로 기준 거리
 * @property {number=} durationMinutes 현재 일정 장소에서의 예상 이동 시간
 * @property {string=} routeProvider TMAP 등 경로 계산 제공자
 * @property {string} source KTO 등 출처
 * @property {string=} updatedAt
 * @property {string=} contentId 한국관광공사 등 원천 콘텐츠 ID
 * @property {boolean=} isOfficialSource 정부·공공기관 원천 여부
 */

/**
 * @typedef {Object} RestaurantEligibility
 * @property {string} placeId
 * @property {boolean} eligible 추천 노출 가능 여부
 * @property {'OPEN'|'CLOSED'|'UNKNOWN'} businessStatus
 * @property {string=} licenseNumber
 * @property {string=} lastVerifiedAt
 * @property {string[]=} reasons
 * @property {string=} source 식품의약품안전처·지방행정 인허가 등 원천
 * @property {string=} sourceUpdatedAt 원천 데이터의 갱신 시각
 * @property {string=} matchedBy 사업장 매칭 기준(인허가번호/주소/명칭)
 */

/**
 * @typedef {Object} RestaurantDetail
 * @property {string} id 백엔드가 관리하는 안정적인 장소 ID
 * @property {string} name
 * @property {string=} category
 * @property {string=} address
 * @property {GeoPoint=} point
 * @property {string=} representativeImageUrl DB representative_image_url 대표 이미지
 * @property {string[]=} imageUrls 권한과 만료 정책을 확인한 이미지 URL
 * @property {{name:string,price:number|null,description?:string,imageUrl?:string,isSignature?:boolean}[]} menus
 * @property {number|null=} rating
 * @property {number=} reviewCount
 * @property {string=} reviewSummary 원문 전체가 아닌 백엔드가 허용된 출처로 생성한 요약
 * @property {string[]=} reviewKeywords
 * @property {string=} businessHours
 * @property {string=} phone
 * @property {string=} placeUrl 카카오플레이스 장소 URL
 * @property {string=} naverMapUrl 네이버 지도 검색 또는 장소 딥링크
 * @property {string=} provider
 * @property {boolean=} isMock
 * @property {string=} sourceLabel
 * @property {string=} refreshedAt
 */

/**
 * @typedef {Object} TransportSearchRequest
 * @property {ApiLocation} origin
 * @property {ApiLocation} destination
 * @property {string} departureDate YYYY-MM-DD
 * @property {string=} returnDate YYYY-MM-DD
 * @property {number} travelers
 * @property {'outbound'|'return'=} leg
 * @property {string=} preferredDepartureTime HH:mm
 * @property {string=} preferredArrivalTime HH:mm
 * @property {'lowest_price'|'earliest'|'fastest'|'recommended'=} sort
 */

/**
 * @typedef {Object} JourneyOptionsRequest
 * @property {ApiLocation} origin
 * @property {ApiLocation} destination
 * @property {string} departureDate YYYY-MM-DD
 * @property {string=} returnDate YYYY-MM-DD
 * @property {number} travelers
 */

/**
 * @typedef {Object} JourneyOption
 * @property {TransportMode} mode
 * @property {boolean} available
 * @property {string} label
 * @property {string=} unavailableReason
 * @property {string[]=} requiredSteps 예: ["항공편 선택", "제주 현지 이동 선택"]
 * @property {number=} estimatedDurationMinutes
 * @property {number=} estimatedPricePerPerson
 * @property {boolean=} isMock
 */

/**
 * @typedef {Object} TravelOffer
 * @property {string} id
 * @property {'flight'|'ktx'|'ferry'|'bus'|'lodging'|'rental'} kind
 * @property {string} provider
 * @property {string} title
 * @property {number} pricePerPerson
 * @property {string} currency
 * @property {string=} departureAt
 * @property {string=} arrivalAt
 * @property {number=} durationMinutes
 * @property {boolean} isMock 실제 가격이 아닌 시연용이면 true
 * @property {string} sourceLabel 사용자가 이해할 수 있는 출처 표기
 * @property {string=} refreshedAt
 * @property {string=} quoteExpiresAt
 * @property {'LIVE'|'PARTNER'|'MOCK'|'UNAVAILABLE'=} priceStatus
 * @property {number=} originalPricePerPerson 할인 전 금액. 없으면 가격 비교 문구를 노출하지 않는다.
 * @property {number=} discountRate
 * @property {number=} remainingInventory
 * @property {Record<string, unknown>=} details
 */

/**
 * @typedef {Object} CostEstimateRequest
 * @property {RouteRequest} route
 * @property {number} travelers
 * @property {number} nights
 * @property {number=} localTravelKm
 * @property {number=} fuelEfficiencyKmPerL
 * @property {number=} fuelPricePerL
 * @property {number=} parkingFee
 * @property {number=} ferryFare 이전 화면 호환용 차량 선적/배편 공통비
 * @property {number=} vehicleFerryFare 차량 선적 등 공통 배편 비용
 * @property {number=} ferryPassengerFarePerPerson 승객 1인 배편 비용
 * @property {number=} selectedTransportPrice
 * @property {number=} selectedLodgingTotal
 * @property {number=} selectedRentalTotal
 * @property {number=} estimatedMealsPerPerson
 * @property {number=} estimatedActivitiesPerPerson
 * @property {{type?:string, fuelEfficiencyKmPerL?:number, fuelPricePerL?:number, priceSource?:string, priceObservedAt?:string}=} vehicle
 * @property {{tollSource?:string, tollObservedAt?:string, parkingSource?:string, parkingObservedAt?:string}=} priceSources
 * @property {boolean=} roundTrip
 */

/**
 * @typedef {Object} CostLineItem
 * @property {'personal'|'shared'} scope
 * @property {string} category
 * @property {string} label
 * @property {number} total
 * @property {number} perPerson
 * @property {boolean=} approximate
 * @property {string=} note
 */

/**
 * @typedef {Object} CostEstimate
 * @property {number} total
 * @property {number} perPerson
 * @property {string} currency
 * @property {CostLineItem[]} items
 * @property {string[]} assumptions
 * @property {boolean} isMock
 * @property {string} calculatedAt
 */

/**
 * @typedef {Object} FuelPrice
 * @property {'gasoline'|'diesel'|'lpg'} fuelType
 * @property {string} productCode 오피넷 유종 코드
 * @property {string} productName
 * @property {number} pricePerL 원/L
 * @property {string=} observedDate 오피넷 기준일
 * @property {number=} difference 전일 대비 원/L
 * @property {string} provider
 */

export const API_ENDPOINTS = Object.freeze({
  locations: {
    regions: '/api/locations/regions',
    districts: (regionCode) => `/api/locations/regions/${encodeURIComponent(regionCode)}/districts`,
    search: '/api/locations/search',
    geocode: '/api/locations/geocode',
  },
  journey: {
    options: '/api/journey-options',
  },
  routing: {
    route: '/api/routing/route',
  },
  tourism: {
    spots: '/api/tourism/spots',
    restaurantEligibility: '/api/restaurants/eligibility',
    restaurants: '/api/restaurants/search',
    restaurantDetail: (placeId) => `/api/restaurants/${encodeURIComponent(placeId)}`,
    cafeDetail: (placeId) => `/api/cafes/${encodeURIComponent(placeId)}`,
  },
  offers: {
    flights: '/api/offers/flights',
    ktx: '/api/offers/ktx',
    ferries: '/api/offers/ferries',
    lodging: '/api/offers/lodging',
    rentalCars: '/api/offers/rental-cars',
  },
  costs: {
    estimate: '/api/costs/estimate',
  },
  fuel: {
    average: '/api/fuel-prices/average',
  },
  plans: {
    generate: '/api/trips/plans',
    status: (planId) => `/api/trips/plans/${encodeURIComponent(planId)}`,
    recalculate: (planId) => `/api/trips/plans/${encodeURIComponent(planId)}/recalculate`,
    share: (planId) => `/api/trips/plans/${encodeURIComponent(planId)}/share`,
  },
});

export const API_SOURCE_LABELS = Object.freeze({
  mock: '시연용 더미 데이터',
  naver: '네이버 지도 연동',
  tmap: '티맵 경로 연동',
  kto: '한국관광공사 관광정보 연동',
  license: '인허가·영업상태 확인 연동',
  foodsafety: '식품의약품안전처 식품접객업정보 연동',
  opinet: '오피넷 유가정보 연동',
  partner: '제휴사 제공 데이터',
});
