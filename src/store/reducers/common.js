import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  userInfo: {},
}

export const common = createSlice({
  name: 'common',
  initialState,
  reducers: {
    setUserInfo: (state, action) => {
      state.userInfo = action.payload
    },
  },
})

export const { setUserInfo } = common.actions

export default common.reducer
