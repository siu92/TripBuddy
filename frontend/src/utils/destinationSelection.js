export function toSpotDestination(destination, spot, index) {
  return {
    ...destination,
    ...spot,
    subSpots: undefined,
    id: spot.id || `${destination.id}-spot-${index + 1}`,
    parentDestinationId: destination.id,
    title: spot.name,
    subtitle: destination.title,
    detail: spot.name,
    requestName: spot.name,
    countryCode: "KR",
    scope: "domestic",
    apiSearchKeyword: `${destination.title} ${spot.name}`,
    needsGeocoding: false,
  };
}
