import request from '@/utils/request'

// 生成图片
export function drawImage(data) {
  return request({
    url: '/ai/image/draw',
    method: 'post',
    data: data
  })
}

// 获取【我的】绘图分页
export function getMyImagePage(query) {
  return request({
    url: '/ai/image/my-page',
    method: 'get',
    params: query
  })
}

// 获取【我的】绘图记录
export function getImageMy(id) {
  return request({
    url: '/ai/image/get-my',
    method: 'get',
    params: { id: id }
  })
}

// 获取【我的】绘图记录列表
export function getImageListMyByIds(ids) {
  return request({
    url: '/ai/image/my-list-by-ids',
    method: 'get',
    params: { ids: ids.join(',') }
  })
}

// 删除【我的】绘图记录
export function deleteImageMy(id) {
  return request({
    url: '/ai/image/delete-my',
    method: 'delete',
    params: { id: id }
  })
}
