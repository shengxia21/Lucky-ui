import request from '@/utils/request'

// 查询AI 绘画列表
export function listImage(query) {
  return request({
    url: '/ai/image/page',
    method: 'get',
    params: query
  })
}

// 修改AI 绘画
export function updateImage(data) {
  return request({
    url: '/ai/image/update',
    method: 'put',
    data: data
  })
}

// 删除AI 绘画
export function delImage(id) {
  return request({
    url: '/ai/image/delete',
    method: 'delete',
    params: { id: id }
  })
}
