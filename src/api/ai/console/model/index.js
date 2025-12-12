import request from '@/utils/request'

// 查询AI 模型列表
export function listModel(query) {
  return request({
    url: '/ai/model/page',
    method: 'get',
    params: query
  })
}

// 查询AI 模型详细
export function getModel(id) {
  return request({
    url: '/ai/model/get',
    method: 'get',
    params: { id: id }
  })
}

// 新增AI 模型
export function addModel(data) {
  return request({
    url: '/ai/model/create',
    method: 'post',
    data: data
  })
}

// 修改AI 模型
export function updateModel(data) {
  return request({
    url: '/ai/model/update',
    method: 'put',
    data: data
  })
}

// 删除AI 模型
export function delModel(id) {
  return request({
    url: '/ai/model/delete',
    method: 'delete',
    params: { id: id }
  })
}

// 获得AI 模型列表
export function getModelSimpleList(type) {
  return request({
    url: '/ai/model/simple-list',
    method: 'get',
    params: { type: type }
  })
}
