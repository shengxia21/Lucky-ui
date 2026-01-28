import request from '@/utils/request'

// 查询AI 聊天角色列表
export function listRole(query) {
  return request({
    url: '/ai/chat-role/page',
    method: 'get',
    params: query
  })
}

// 查询AI 聊天角色详细
export function getRole(id) {
  return request({
    url: '/ai/chat-role/get',
    method: 'get',
    params: { id: id }
  })
}

// 新增AI 聊天角色
export function addRole(data) {
  return request({
    url: '/ai/chat-role/create',
    method: 'post',
    data: data
  })
}

// 修改AI 聊天角色
export function updateRole(data) {
  return request({
    url: '/ai/chat-role/update',
    method: 'put',
    data: data
  })
}

// 删除AI 聊天角色
export function delRole(id) {
  return request({
    url: '/ai/chat-role/delete',
    method: 'delete',
    params: { id: id }
  })
}

// 查询【我的】AI 聊天角色列表
export function listMyRole(query) {
  return request({
    url: '/ai/chat-role/my-page',
    method: 'get',
    params: query
  })
}

// 查询【我的】AI 聊天角色详细
export function getMyRole(id) {
  return request({
    url: '/ai/chat-role/get-my',
    method: 'get',
    params: { id: id }
  })
}

// 新增【我的】AI 聊天角色
export function addMyRole(data) {
  return request({
    url: '/ai/chat-role/create-my',
    method: 'post',
    data: data
  })
}

// 修改【我的】AI 聊天角色
export function updateMyRole(data) {
  return request({
    url: '/ai/chat-role/update-my',
    method: 'put',
    data: data
  })
}

// 删除【我的】AI 聊天角色
export function delMyRole(id) {
  return request({
    url: '/ai/chat-role/delete-my',
    method: 'delete',
    params: { id: id }
  })
}

// 获取聊天角色分类列表
export function getCategoryList() {
  return request({
    url: '/ai/chat-role/category-list',
    method: 'get'
  })
}
