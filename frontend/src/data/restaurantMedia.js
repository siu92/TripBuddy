const VISIT_JEJU_FLOWER_MEAL = "https://api.cdn.visitjeju.net/photomng/imgpath/202305/19/3aa4cf3f-d1a8-4f65-b515-75fd764a2c93.webp";

const CURATED_RESTAURANT_MEDIA = [
  {
    match: /(?:애월.*갈치.*암행어사|암행어사)/,
    representativeImageUrl: "https://media.triple.guide/triple-cms/c_limit%2Cf_auto%2Ch_2048%2Cw_2048/2963688a-9eae-46ba-9e30-3f052ba9b256.jpeg",
    imageUrls: [
      "https://media.triple.guide/triple-cms/c_limit%2Cf_auto%2Ch_2048%2Cw_2048/2963688a-9eae-46ba-9e30-3f052ba9b256.jpeg",
      "https://media.triple.guide/triple-cms/c_limit%2Cf_auto%2Ch_2048%2Cw_2048/9ae48606-6da1-4289-9a3d-657044241401.jpeg",
    ],
  },
  {
    match: /김희선.*(?:제주)?(?:흑돼지)?두루치기|김희선제주두루치기/,
    representativeImageUrl: "https://media.triple.guide/triple-cms/c_limit%2Cf_auto%2Ch_2048%2Cw_2048/60e9f80e-6306-4e7e-b19a-3f724d92c317.jpeg",
    imageUrls: [
      "https://media.triple.guide/triple-cms/c_limit%2Cf_auto%2Ch_2048%2Cw_2048/60e9f80e-6306-4e7e-b19a-3f724d92c317.jpeg",
    ],
  },
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
