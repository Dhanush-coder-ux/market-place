import { configureStore } from "@reduxjs/toolkit";
import InventoryReducer from '@/features/inventory/InventorySlice'

export const store = configureStore({
    devTools:true,
    reducer:{
        inventory:InventoryReducer
    },
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;