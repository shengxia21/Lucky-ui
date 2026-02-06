import request from '@/utils/request'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { getToken } from '@/utils/auth'

// 获得指定对话的消息列表
export function getChatMessageListByConversationId(id) {
  return request({
    url: '/ai/chat/message/list-by-conversation-id',
    method: 'get',
    params: { conversationId: id }
  })
}

// 删除指定消息
export function deleteChatMessage(id) {
  return request({
    url: '/ai/chat/message/delete',
    method: 'delete',
    params: { id: id }
  })
}

// 删除指定对话的消息
export function deleteChatMessageByConversationId(id) {
  return request({
    url: '/ai/chat/message/delete-by-conversation-id',
    method: 'delete',
    params: { conversationId: id }
  })
}

// 发送 Stream 消息
export function sendChatMessageStream(
  conversationId,
  content,
  enableContext,
  enableWebSearch,
  attachmentUrls,
  ctrl,
  onMessage,
  onError,
  onClose
) {
  return fetchEventSource(import.meta.env.VITE_APP_BASE_API + '/ai/chat/message/send-stream', {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + getToken(),
      'Content-Type': 'application/json'
    },
    openWhenHidden: true, //保持页面在后台（不可见时）的连接活跃
    body: JSON.stringify({
      conversationId,
      content,
      useContext: enableContext,
      useSearch: enableWebSearch,
      attachmentUrls: attachmentUrls || []
    }),
    signal: ctrl.signal,
    onmessage: onMessage,
    onerror: onError,
    onclose: onClose
  })
}
