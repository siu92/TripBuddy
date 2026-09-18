const VISIT_JEJU_FLOWER_MEAL = "https://api.cdn.visitjeju.net/photomng/imgpath/202305/19/3aa4cf3f-d1a8-4f65-b515-75fd764a2c93.webp";

const CURATED_RESTAURANT_MEDIA = [
  {
    match: /^꽃밥$/,
    representativeImageUrl: VISIT_JEJU_FLOWER_MEAL,
    imageUrls: [
      VISIT_JEJU_FLOWER_MEAL,
      "https://api.cdn.visitjeju.net/photomng/imgpath/202305/19/5159450c-7ea7-48bf-9e8b-371f5e119cf8.webp",
      "https://api.cdn.visitjeju.net/photomng/imgpath/202305/19/97c79735-0b75-4fed-8385-77edfb362765.webp",
      "https://api.cdn.visitjeju.net/photomng/imgpath/202305/19/dd59981c-a7d9-430b-b947-6229ab00a5e4.webp",
    ],
  },
];

export function applyCuratedRestaurantMedia(detail, requestedName) {
  const name = String(detail?.name || requestedName || "").trim();
  const curated = CURATED_RESTAURANT_MEDIA.find(({ match }) => match.test(name));
  if (!curated) return detail;

  return {
    ...detail,
    representativeImageUrl: curated.representativeImageUrl,
    imageUrls: [...new Set([
      ...curated.imageUrls,
      ...(Array.isArray(detail?.imageUrls) ? detail.imageUrls : []),
    ])],
  };
}
