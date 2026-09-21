/**
 * 브라우저용 공통 HTTP 클라이언트.
 * 외부 지도/관광/사업자 API 키는 절대 여기서 직접 호출하지 않고 백엔드 BFF를 통한다.
 */

const VITE_ENV = import.meta.env ?? {};

const CONFIGURED_BASE_URL = String(VITE_ENV.VITE_API_BASE_URL ?? "").trim();
const IS_LOCAL_API_URL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(
  CONFIGURED_BASE_URL,
);

const DEFAULT_BASE_URL =
  VITE_ENV.PROD && IS_LOCAL_API_URL ? "" : CONFIGURED_BASE_URL;

const ACCESS_TOKEN_KEY = "tripbuddy.accessToken";
const LEGACY_ACCESS_TOKEN_KEY = "accessToken";

/**
 * JWT Access Token 조회
 *
 * 기존 코드에서 "accessToken" 키로 저장했던 경우도
 * 임시 호환한다.
 */
export function getAccessToken() {
  const token =
    localStorage.getItem(ACCESS_TOKEN_KEY) ??
    localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);

  return token || null;
}

/**
 * JWT Access Token 저장
 */
export function saveAccessToken(token) {
  if (!token) {
    removeAccessToken();
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token);

  // 기존 키가 남아 있으면 제거해서 하나로 통일
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
}

/**
 * JWT Access Token 삭제
 */
export function removeAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
}

export class ApiClientError extends Error {
  constructor(
    message,
    {
      status = 0,
      code = "API_ERROR",
      payload = null,
      cause,
    } = {},
  ) {
    super(message, { cause });

    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

function toQueryString(query = {}) {
  const pairs = Object.entries(query).flatMap(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.map((item) => [
        key,
        String(item),
      ]);
    }

    return [[key, String(value)]];
  });

  return new URLSearchParams(pairs).toString();
}

async function parseBody(response) {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (cause) {
      throw new ApiClientError(
        "백엔드 응답 형식이 올바르지 않습니다.",
        {
          status: response.status,
          code: "INVALID_RESPONSE",
          cause,
        },
      );
    }
  }

  const text = await response.text();

  return text
    ? {
        message: text,
      }
    : null;
}

/**
 * @param {{
 *   baseUrl?: string,
 *   getToken?: () => string|null|undefined,
 *   fetchImpl?: typeof fetch
 * }} options
 */
export function createApiClient({
  baseUrl = DEFAULT_BASE_URL,
  getToken,
  fetchImpl = fetch,
  enableAuthRefresh = false,
} = {}) {
  let refreshPromise = null;

  const emitAuthExpired = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("tripbuddy:auth-expired"),
      );
    }
  };

  async function refreshSession() {
    if (refreshPromise) {
      return refreshPromise;
    }

    const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

    refreshPromise = (async () => {
      const response = await fetchImpl(
        `${normalizedBaseUrl}/api/users/refresh`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const payload = await parseBody(response);
      const data = payload?.data ?? payload;

      if (!response.ok || !data?.accessToken) {
        removeAccessToken();
        emitAuthExpired();

        throw new ApiClientError(
          payload?.message ?? "로그인이 만료되었습니다.",
          {
            status: response.status,
            code: "AUTH_EXPIRED",
            payload,
          },
        );
      }

      saveAccessToken(data.accessToken);
      return data;
    })().finally(() => {
      refreshPromise = null;
    });

    return refreshPromise;
  }

  async function request(
    path,
    {
      method = "GET",
      query,
      body,
      headers,
      signal,
      timeoutMs = 15000,
      skipAuthRefresh = false,
    } = {},
  ) {
    const queryString = toQueryString(query);

    const normalizedBaseUrl =
      baseUrl.replace(/\/$/, "");

    const normalizedPath =
      path.startsWith("/") ? path : `/${path}`;

    const url =
      `${normalizedBaseUrl}${normalizedPath}` +
      `${queryString ? `?${queryString}` : ""}`;

    const token = getToken?.();

    const controller = new AbortController();

    const relayAbort = () => {
      controller.abort(signal?.reason);
    };

    if (signal?.aborted) {
      relayAbort();
    } else {
      signal?.addEventListener(
        "abort",
        relayAbort,
        {
          once: true,
        },
      );
    }

    const timeoutId = setTimeout(
      () => controller.abort("timeout"),
      Math.max(1, timeoutMs),
    );

    try {
      const response = await fetchImpl(url, {
        method,
        signal: controller.signal,
        credentials: "include",

        headers: {
          Accept: "application/json",

          ...(body !== undefined &&
          body !== null
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),

          ...headers,
        },

        ...(body !== undefined &&
        body !== null
          ? {
              body: JSON.stringify(body),
            }
          : {}),
      });

      const payload =
        await parseBody(response);

      if (
        response.status === 401 &&
        enableAuthRefresh &&
        !skipAuthRefresh &&
        !normalizedPath.startsWith("/api/users/")
      ) {
        await refreshSession();

        return request(path, {
          method,
          query,
          body,
          headers,
          signal,
          timeoutMs,
          skipAuthRefresh: true,
        });
      }

      if (!response.ok) {
        /**
         * Access Token이 만료됐거나 유효하지 않은 경우
         * 저장된 토큰 제거
         */
        if (response.status === 401) {
          removeAccessToken();
          emitAuthExpired();
        }

        throw new ApiClientError(
          payload?.message ??
            "API 요청에 실패했습니다.",
          {
            status: response.status,
            code:
              payload?.code ??
              "HTTP_ERROR",
            payload,
          },
        );
      }

      /**
       * 백엔드 응답:
       *
       * {
       *   success: true,
       *   message: "...",
       *   data: {...}
       * }
       *
       * 형태라면 data만 반환한다.
       */
      return payload?.data ?? payload;
    } catch (cause) {
      if (cause instanceof ApiClientError) {
        throw cause;
      }

      const code = signal?.aborted
        ? "REQUEST_ABORTED"
        : controller.signal.aborted
          ? "TIMEOUT"
          : "NETWORK_ERROR";

      throw new ApiClientError(
        "백엔드 서버에 연결할 수 없습니다.",
        {
          code,
          cause,
        },
      );
    } finally {
      clearTimeout(timeoutId);

      signal?.removeEventListener(
        "abort",
        relayAbort,
      );
    }
  }

  return {
    request,
    refreshSession,
    baseUrl,
  };
}

/**
 * 모든 API 요청에서 localStorage JWT를 읽는다.
 *
 * 로그인 후 토큰이 존재하면:
 *
 * Authorization: Bearer {token}
 *
 * 헤더가 자동으로 추가된다.
 */
export const apiClient = createApiClient({
  getToken: getAccessToken,
  enableAuthRefresh: true,
});

export function isMockModeEnabled() {
  /**
   * 명시적으로 VITE_USE_MOCK=true인 경우에만 mock 사용.
   *
   * 운영 배포에서는 기본적으로 실제 API를 사용한다.
   */
  return (
    String(
      VITE_ENV.VITE_USE_MOCK ??
        "false",
    ).toLowerCase() === "true"
  );
}

/**
 * 실제 API 우선,
 * 서버 장애 또는 mock 모드에서 mock으로 폴백한다.
 */
export async function withMockFallback(
  liveRequest,
  mockRequest,
  {
    forceMock = isMockModeEnabled(),
  } = {},
) {
  if (forceMock) {
    return mockRequest();
  }

  try {
    return await liveRequest();
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (
        error.status >= 500 ||
        error.code === "NETWORK_ERROR" ||
        error.code === "TIMEOUT"
      )
    ) {
      return mockRequest();
    }

    throw error;
  }
}
