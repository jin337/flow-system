import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  userInfo: {},
  userInfoMobile: {},
  // 审核状态
  LOG_STATUS_MAP: {
    1: '待签批',
    2: '同意',
    3: '不同意',
    4: '弃权',
  },
  // 任务状态
  ORDER_STATUS_MAP: {
    1: '待发布',
    2: '待签批',
    3: '已完成',
    4: '已撤回',
  },
  // 组织类型
  ORGANIZATION_MAP: {
    1: '董事会',
    2: '股东会',
  },
}

export const common = createSlice({
  name: 'common',
  initialState,
  reducers: {
    setUserInfo: (state, action) => {
      state.userInfo = action.payload
    },
    setUserInfoMobile: (state, action) => {
      state.userInfoMobile = action.payload
    },
  },
})

export const { setUserInfo, setUserInfoMobile } = common.actions

export default common.reducer
