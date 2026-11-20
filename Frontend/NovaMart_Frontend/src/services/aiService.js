import { apiRequest, isDemoMode } from './apiClient'

export const isNovaDemo = isDemoMode

export async function askNovaAssistant(message, { signal } = {}) {
  if (!isNovaDemo) {
    const result = await apiRequest('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
      signal,
    })
    const reply = [result?.reply, result?.message].find((value) => typeof value === 'string' && value.trim())
    if (!reply) throw new Error('Phản hồi của trợ lý không hợp lệ.')
    const declaredSource = String(result.provider ?? result.source).toLowerCase()
    if (result.demo === true || declaredSource === 'demo') return { reply: reply.trim(), provider: 'demo' }
    const provider = declaredSource === 'gemini' ? 'gemini' : 'api'
    return { reply: reply.trim(), provider }
  }
  const text = message.toLowerCase()
  let reply = 'Bạn cho Nova biết thêm ngân sách và mục đích sử dụng nhé. Mình sẽ giúp bạn thu hẹp lựa chọn theo danh mục, hiệu năng và nhu cầu thực tế.'
  if (text.includes('lập trình') || text.includes('code')) reply = 'Với nhu cầu lập trình, bạn nên ưu tiên CPU đa nhân, RAM từ 16GB (tốt hơn là 32GB nếu chạy máy ảo), SSD 512GB trở lên và màn hình có độ phân giải tốt. Bạn đang dự kiến ngân sách bao nhiêu?'
  else if (text.includes('game') || text.includes('chơi')) reply = 'Nếu ưu tiên chơi game, hãy cân nhắc GPU rời, hệ thống tản nhiệt và màn hình tần số quét cao. Laptop gaming sẽ phù hợp hơn nếu bạn cần tính di động. Bạn muốn chơi game ở độ phân giải nào?'
  else if (text.includes('điện thoại')) reply = 'Khi chọn điện thoại, hãy xác định ưu tiên giữa camera, thời lượng pin và hiệu năng. Bạn có thể dùng bộ lọc giá trong danh mục để xem sản phẩm trong ngân sách.'
  else if (text.includes('văn phòng') || text.includes('học tập')) reply = 'Với học tập và văn phòng, máy mỏng nhẹ, pin tốt, RAM 16GB và SSD 512GB thường là lựa chọn cân bằng. Bạn có cần dùng thêm phần mềm đồ họa hoặc lập trình không?'
  return { reply, provider: 'demo' }
}
