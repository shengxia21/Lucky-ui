import request from '@/utils/request'

// 注册方法
export function register(data) {
  return request({
    url: '/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 获取注册状态
export function getRegisterEnabled() {
  return request({
    url: '/register/enabled',
    headers: {
      isToken: false
    },
    method: 'get'
  })
}
