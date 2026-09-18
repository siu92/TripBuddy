import {
  apiClient,
  getAccessToken,
  saveAccessToken,
  removeAccessToken,
} from "./apiClient";

/**
 * 로그인
 *
 * POST /api/users/login
 *
 * Request
 * {
 *   "email": "...",
 *   "password": "..."
 * }
 */
export async function login(email, password) {
  const response = await apiClient.request(
    "/api/users/login",
    {
      method: "POST",
      body: {
        email,
        password,
      },
    },
  );

  if (!response?.accessToken) {
    throw new Error(
      "로그인 응답에 Access Token이 없습니다.",
    );
  }

  saveAccessToken(response.accessToken);

  return response;
}

/**
 * 로그아웃
 */
export async function logout() {
  removeAccessToken();

  try {
    await apiClient.request("/api/users/logout", {
      method: "POST",
      timeoutMs: 5000,
    });
  } catch {
    // 로컬 토큰은 이미 삭제했다. 서버 쿠키 만료는 다음 요청에서 재시도한다.
  }
}

export async function restoreSession() {
  if (getAccessToken()) {
    return true;
  }

  try {
    await apiClient.refreshSession();
    return true;
  } catch {
    return false;
  }
}

/**
 * 현재 로그인 여부
 */
export function isLoggedIn() {
  return Boolean(getAccessToken());
}
