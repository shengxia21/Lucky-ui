import request from '@/utils/request'

// 查询AI API 秘钥列表
export function listKey(query) {
  return request({
    url: '/ai/api-key/page',
    method: 'get',
    params: query
  })
}

// 查询AI API 秘钥详细
export function getKey(id) {
  return request({
    url: '/ai/api-key/get',
    method: 'get',
    params: { id: id }
  })
}

// 新增AI API 秘钥
export function addKey(data) {
  return request({
    url: '/ai/api-key/create',
    method: 'post',
    data: data
  })
}

// 修改AI API 秘钥
export function updateKey(data) {
  return request({
    url: '/ai/api-key/update',
    method: 'put',
    data: data
  })
}

// 删除API 秘钥
export function delKey(id) {
  return request({
    url: '/ai/api-key/delete',
    method: 'delete',
    params: { id: id }
  })
}
