import request from '@/utils/request'

// 查询AI 聊天消息列表
export function listMessage(query) {
  return request({
    url: '/ai/chat/message/page',
    method: 'get',
    params: query
  })
}

// 删除AI 聊天消息
export function delMessage(id) {
  return request({
    url: '/ai/chat/message/delete',
    method: 'delete',
    params: { id: id }
  })
}
