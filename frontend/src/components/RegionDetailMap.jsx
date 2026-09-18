import { useMemo } from "react";
import { geoCentroid, geoMercator } from "d3-geo";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { KOREA_MUNICIPALITIES_GEOJSON_URLS, municipalityFeaturesForRegion } from "../data/koreaGeo";
import useKoreaGeoJson from "../hooks/useKoreaGeoJson";
import "./KoreaRegionMap.css";

const MAP_WIDTH = 980;
const MAP_HEIGHT = 650;

const districtFromFeature = (region, feature) => {
  const code = String(feature?.properties?.code || "");
  const name = feature?.properties?.name || "세부 지역";
  const [longitude, latitude] = geoCentroid(feature);
  const catalogDistrict = region?.districts?.find((district) => district.name === name || district.detail === name);
  const airportCodes = catalogDistrict?.airportCodes || region?.airportCodes || [];
  return {
    ...catalogDistrict,
    id: catalogDistrict?.id || `${region.id}-${code}`,
    administrativeCode: code,
    countryCode: "KR",
    regionCode: region.regionCode,
    region: region.name,
    name,
    detail: name,
    latitude: catalogDistrict?.latitude ?? latitude,
    longitude: catalogDistrict?.longitude ?? longitude,
    airportCodes,
    airportCode: catalogDistrict?.airportCode || airportCodes[0] || null,
    apiSearchKeyword: `${region.name} ${name}`,
    needsGeocoding: false,
  };
};

export default function RegionDetailMap({ region, selectedDistrictId = null, selectDistrict, ariaLabel }) {
  const { data, error, loading } = useKoreaGeoJson(KOREA_MUNICIPALITIES_GEOJSON_URLS);
  const features = useMemo(() => municipalityFeaturesForRegion(data, region?.id), [data, region?.id]);
  const featureCollection = useMemo(() => ({ type: "FeatureCollection", features }), [features]);
  const districtByCode = useMemo(() => new Map(features.map((feature) => {
    const district = districtFromFeature(region, feature);
    return [String(feature.properties.code), district];
  })), [features, region]);
  const projection = useMemo(() => {
    if (!features.length) return geoMercator().center([region?.longitude || 127.5, region?.latitude || 36]).scale(8500).translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
    return geoMercator().fitExtent([[34, 28], [MAP_WIDTH - 34, MAP_HEIGHT - 36]], featureCollection);
  }, [featureCollection, features.length, region?.latitude, region?.longitude]);

  const handleKeyDown = (event, district) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectDistrict?.(district);
  };
  const jejuGroups = region?.id === "jeju"
    ? region.districts.map((district) => ({
        id: district.id,
        name: `${district.name} 권역`,
        districts: district.children || [district],
      }))
    : null;
  const sortedDistricts = [...districtByCode.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));

  const QuickSelect = () => {
    if (!jejuGroups) {
      return (
        <section className="region-detail-quick-select" aria-label={`${region.name} 빠른 지역 선택`}>
          <div><b>이름으로 빠르게 선택</b><small>지도가 촘촘한 지역은 아래 큰 버튼을 이용하세요.</small></div>
          <div className="region-detail-quick-list">
            {sortedDistricts.map((district) => (
              <button className={selectedDistrictId === district.id ? "is-selected" : ""} type="button" key={district.id} onClick={() => selectDistrict?.(district)}>{district.name}</button>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className="region-detail-quick-select is-grouped" aria-label={`${region.name} 읍면동 빠른 선택`}>
        <div><b>이름으로 빠르게 선택</b><small>읍·면·동 권역을 바로 선택하세요.</small></div>
        <div className="region-detail-quick-groups">
          {jejuGroups.map((group) => (
            <div className="region-detail-quick-group" key={group.id}>
              <strong>{group.name}</strong>
              <div>
                {group.districts.map((district) => (
                  <button className={selectedDistrictId === district.id ? "is-selected" : ""} type="button" key={district.id} onClick={() => selectDistrict?.(district)}>{district.name}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  if (loading) return <div className="region-detail-map-shell"><div className="administrative-map-status" role="status"><span className="administrative-map-spinner" /><b>{region?.name} 시·군·구 지도를 불러오고 있어요.</b></div></div>;

  if (error || !features.length) {
    return (
      <div className="region-detail-map-shell administrative-map-error">
        <b>세부 지도를 불러오지 못했어요.</b><small>아래 지역 목록에서 선택할 수 있습니다.</small>
        <QuickSelect />
      </div>
    );
  }

  return (
    <div className="region-detail-map-shell">
      <ComposableMap className="region-detail-map" width={MAP_WIDTH} height={MAP_HEIGHT} projection={projection} role="group" aria-label={ariaLabel || `${region.name} 시군구 선택 지도`}>
        <Geographies geography={featureCollection}>
          {({ geographies }) => (
            <>
              {geographies.map((geography) => {
                const district = districtByCode.get(String(geography.properties.code));
                const selected = selectedDistrictId === district?.id || selectedDistrictId === district?.administrativeCode;
                return (
                  <Geography
                    key={geography.rsmKey}
                    geography={geography}
                    className={`administrative-geography district-geography${selected ? " is-selected" : ""}`}
                    role="button"
                    aria-label={`${region.name} ${district?.name || "세부 지역"}${selected ? ", 선택됨" : ""}`}
                    aria-pressed={selected}
                    onClick={() => selectDistrict?.(district)}
                    onKeyDown={(event) => handleKeyDown(event, district)}
                  />
                );
              })}
              {geographies.map((geography) => {
                const district = districtByCode.get(String(geography.properties.code));
                if (!district) return null;
                return <Marker key={`label-${district.administrativeCode}`} coordinates={geoCentroid(geography)}><text className={`administrative-district-label${selectedDistrictId === district.id ? " is-selected" : ""}`}>{district.name}</text></Marker>;
              })}
            </>
          )}
        </Geographies>
      </ComposableMap>
      <div className="region-detail-map-meta"><b>{region.name} 전체 {features.length}개 시·군·구</b><span>지도에서 지역 이름을 눌러 선택하세요.</span></div>
      <QuickSelect />
    </div>
  );
}
