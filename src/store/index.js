import commonReducer from '@/store/reducers/common'
import { configureStore } from '@reduxjs/toolkit'

export const store = configureStore({
  reducer: {
    common: commonReducer,
  },
})
