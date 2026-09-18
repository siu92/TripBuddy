import { useMemo } from "react";
import { geoCentroid, geoMercator } from "d3-geo";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { KOREA_PROVINCES_GEOJSON_URLS, regionIdForProvinceFeature, shortRegionName } from "../data/koreaGeo";
import useKoreaGeoJson from "../hooks/useKoreaGeoJson";
import "./KoreaRegionMap.css";

const MAP_WIDTH = 600;
const MAP_HEIGHT = 700;
const LABEL_OFFSETS = {
  seoul: [8, -7], incheon: [-14, 4], sejong: [-4, 5], daejeon: [5, 7],
  daegu: [9, 2], ulsan: [11, 3], busan: [9, 8], gwangju: [-2, 8],
};

const RegionListFallback = ({ regions, onSelect }) => (
  <div className="korea-map-fallback" role="list" aria-label="대한민국 17개 시도 목록">
    {regions.map((region) => (
      <button type="button" role="listitem" key={region.id} onClick={() => onSelect?.(region)}>
        {shortRegionName(region.name) || region.name}
      </button>
    ))}
  </div>
);

export default function KoreaRegionMap({ regions = [], selectedId = null, onSelect, ariaLabel = "대한민국 17개 시도 선택 지도" }) {
  const { data, error, loading } = useKoreaGeoJson(KOREA_PROVINCES_GEOJSON_URLS);
  const regionById = useMemo(() => new Map(regions.map((region) => [region.id, region])), [regions]);
  const displayData = useMemo(() => {
    if (!data) return null;
    return {
      ...data,
      features: data.features.map((feature) => {
        if (feature.geometry?.type !== "MultiPolygon" || regionIdForProvinceFeature(feature) === "jeju") return feature;
        return {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: feature.geometry.coordinates.filter((coordinates) => {
              const [longitude] = geoCentroid({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates } });
              return longitude >= 125.65 && longitude <= 130.05;
            }),
          },
        };
      }),
    };
  }, [data]);
  const projection = useMemo(() => {
    if (!displayData) return geoMercator().center([127.8, 36]).scale(5300).translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
    return geoMercator().fitExtent([[16, 12], [MAP_WIDTH - 16, MAP_HEIGHT - 14]], displayData);
  }, [displayData]);

  const handleKeyDown = (event, region) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect?.(region);
  };

  return (
    <div className="korea-svg-map-shell">
      {loading ? (
        <div className="administrative-map-status" role="status"><span className="administrative-map-spinner" /><b>대한민국 행정경계를 불러오고 있어요.</b></div>
      ) : error || !displayData ? (
        <div className="administrative-map-error"><b>지도를 불러오지 못했어요.</b><small>지역 목록에서 동일하게 선택할 수 있습니다.</small><RegionListFallback regions={regions} onSelect={onSelect} /></div>
      ) : (
        <ComposableMap className="korea-svg-map" width={MAP_WIDTH} height={MAP_HEIGHT} projection={projection} role="group" aria-label={ariaLabel}>
          <Geographies geography={displayData}>
            {({ geographies }) => (
              <>
                {geographies.map((geography) => {
                  const regionId = regionIdForProvinceFeature(geography);
                  const region = regionById.get(regionId);
                  if (!region) return null;
                  const selected = selectedId === regionId;
                  return (
                    <Geography
                      key={geography.rsmKey}
                      geography={geography}
                      className={`administrative-geography${selected ? " is-selected" : ""}`}
                      aria-label={`${region.name}${selected ? ", 선택됨" : ""}`}
                      aria-pressed={selected}
                      role="button"
                      onClick={() => onSelect?.(region)}
                      onKeyDown={(event) => handleKeyDown(event, region)}
                    />
                  );
                })}
                {geographies.map((geography) => {
                  const regionId = regionIdForProvinceFeature(geography);
                  const region = regionById.get(regionId);
                  if (!region) return null;
                  const [dx = 0, dy = 0] = LABEL_OFFSETS[regionId] || [];
                  return (
                    <Marker key={`label-${regionId}`} coordinates={geoCentroid(geography)}>
                      <text className={`administrative-region-label${selectedId === regionId ? " is-selected" : ""}`} x={dx} y={dy}>{shortRegionName(region.name)}</text>
                    </Marker>
                  );
                })}
              </>
            )}
          </Geographies>
        </ComposableMap>
      )}
      <p className="korea-map-a11y-note">시·도를 누르면 실제 행정경계 기준의 세부 시·군·구 지도가 열립니다.</p>
    </div>
  );
}
