const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
const demoSetting = (import.meta.env.VITE_DEMO_MODE || '').trim().toLowerCase()

export const isDemoMode = demoSetting === 'true' || (demoSetting !== 'false' && !API_BASE_URL)

const errorMessages = {
  400: 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra và thử lại.',
  401: 'Yêu cầu này cần đăng nhập.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu được yêu cầu.',
  409: 'Yêu cầu xung đột với thao tác trước đó. Vui lòng kiểm tra lại.',
  422: 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra và thử lại.',
}

export class ApiError extends Error {
  constructor(message, { status, fieldErrors } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL || isDemoMode) throw new ApiError('API chưa được bật hoặc chưa có địa chỉ.')

  const headers = new Headers(options.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch (error) {
    if (options.signal?.aborted || error.name === 'AbortError') throw error
    throw new ApiError('Không kết nối được với API. Vui lòng thử lại.')
  }

  if (!response.ok) {
    const body = response.status === 400 || response.status === 422
      ? await response.json().catch(() => null)
      : null
    const fieldErrors = body?.fieldErrors && typeof body.fieldErrors === 'object' && !Array.isArray(body.fieldErrors)
      ? body.fieldErrors
      : undefined
    const message = errorMessages[response.status]
      ?? (response.status >= 500 ? 'Máy chủ đang gặp sự cố. Vui lòng thử lại.' : `Yêu cầu thất bại (HTTP ${response.status}).`)
    throw new ApiError(message, { status: response.status, fieldErrors })
  }
  if (response.status === 204) return null

  try {
    return await response.json()
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError('Máy chủ trả dữ liệu với định dạng không hợp lệ.', { status: response.status })
  }
}
