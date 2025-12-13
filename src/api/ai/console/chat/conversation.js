import request from '@/utils/request'

// 查询AI 聊天对话列表
export function listConversation(query) {
  return request({
    url: '/ai/chat/conversation/page',
    method: 'get',
    params: query
  })
}

// 删除AI 聊天对话
export function delConversation(id) {
  return request({
    url: '/ai/chat/conversation/delete-by-admin',
    method: 'delete',
    params: { id: id }
  })
}
