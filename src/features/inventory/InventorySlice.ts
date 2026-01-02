import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
} from "@reduxjs/toolkit";
import { InventoryItem, InventoryState } from "./types";


export const inventoryAdapter = createEntityAdapter<InventoryItem>();

const initialState = inventoryAdapter.getInitialState({
  loading: false,
  error: null as string | null,
}) as InventoryState;


const InventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    setInventory(state, action: PayloadAction<InventoryItem[]>) {
      inventoryAdapter.setAll(state, action.payload);
    },
    addItem(state, action: PayloadAction<InventoryItem>) {
      inventoryAdapter.addOne(state, action.payload);
    },
    updateItem(state, action: PayloadAction<InventoryItem>) {
      inventoryAdapter.upsertOne(state, action.payload);
    },
    deleteItem(state, action: PayloadAction<string>) {
      inventoryAdapter.removeOne(state, action.payload);
    },
  },
});


export const { setInventory, addItem, updateItem, deleteItem } =
  InventorySlice.actions;

export default InventorySlice.reducer;
 
export const inventorySelectors = inventoryAdapter.getSelectors(
  (state: any) => state.inventory
);
