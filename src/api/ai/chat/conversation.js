import request from '@/utils/request'

// 获得【我的】聊天对话
export function getChatConversationMy(id) {
  return request({
    url: '/ai/chat/conversation/get-my',
    method: 'get',
    params: { id: id }
  })
}

// 新增【我的】聊天对话
export function createChatConversationMy(data) {
  return request({
    url: '/ai/chat/conversation/create-my',
    method: 'post',
    data: data
  })
}

// 更新【我的】聊天对话
export function updateChatConversationMy(data) {
  return request({
    url: '/ai/chat/conversation/update-my',
    method: 'put',
    data: data
  })
}

// 删除【我的】聊天对话
export function deleteChatConversationMy(id) {
  return request({
    url: '/ai/chat/conversation/delete-my',
    method: 'delete',
    params: { id: id }
  })
}

// 删除【我的】所有对话，置顶除外
export function deleteChatConversationMyByUnpinned() {
  return request({
    url: '/ai/chat/conversation/delete-by-unpinned',
    method: 'delete'
  })
}

// 获得【我的】聊天对话列表
export function getChatConversationMyList() {
  return request({
    url: '/ai/chat/conversation/my-list',
    method: 'get'
  })
}
