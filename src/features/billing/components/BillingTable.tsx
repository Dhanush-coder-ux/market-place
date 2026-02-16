import React, { useMemo, useCallback } from "react";
import { LuDelete } from "react-icons/lu";
import { IoAddCircleOutline } from "react-icons/io5";
import { v4 as uuidv4 } from "uuid";
import { BillingItem, SelectOption } from "../types";
import { ReusableCombobox } from "@/components/ui/ReusableCombobox";



const inventoryItems = [
  {
    product_barcode: "PRD001",
    product_name: "Blue T-Shirt",
    product_price: 499,
  },
  {
    product_barcode: "PRD002",
    product_name: "Jeans Pant",
    product_price: 999,
  },
  {
    product_barcode: "PRD003",
    product_name: "Formal Shoes",
    product_price: 1999,
  },
];


const createEmptyRow = (): BillingItem => ({
  id: uuidv4(),
  code: "",
  name: "",
  qty: 0,
  price: 0,
  tprice: 0,
});

// -------------------- COMPONENT --------------------
const BillingTable: React.FC = () => {
  const [items, setItems] = React.useState<BillingItem[]>([createEmptyRow()]);

  // Add new row
  const handleAddRow = () => {
    setItems((prev) => [...prev, createEmptyRow()]);
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    setItems((prev) => {
      if (prev.length === 1) return [createEmptyRow()];
      return prev.filter((item) => item.id !== id);
    });
  };

  // Update row (qty, price, name etc)
  const updateItem = useCallback((id: string, updates: Partial<BillingItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const merged = { ...item, ...updates };
        return {
          ...merged,
          tprice: (merged.qty || 0) * (merged.price || 0),
        };
      })
    );
  }, []);

  // Convert inventory to select options
  const toOptions = (type: "code" | "name"): SelectOption[] =>
    inventoryItems.map((item) => ({
      value: type === "code" ? item.product_barcode : item.product_name,
      label: type === "code" ? item.product_barcode : item.product_name,
      payload: item,
    }));

  // const codeOptions = useMemo(() => toOptions("code"), []);
  const nameOptions = useMemo(() => toOptions("name"), []);



  return (
    <div className="w-full">
      <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full text-left border-collapse">
          <thead className="table-head">
            <tr>
              {/* <th className="p-4 font-bold border-b">Product Code</th> */}
              <th className="p-4 font-bold border-b">Product Name</th>
              <th className="p-4 font-bold border-b w-24">Quantity</th>
              <th className="p-4 font-bold border-b">Price</th>
              <th className="p-4 font-bold border-b">Total Price</th>
              <th className="p-4 font-bold border-b w-16 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 border-b ">

                {/* PRODUCT CODE DROPDOWN */}
                {/* <td className="p-2 border-r min-w-[200px]">
                  <ReusableCombobox
                    options={codeOptions}
                    value={item.code}
                    placeholder="Select Code"
                    onChange={(selected) => {
                      const opt = codeOptions.find((o) => o.value === selected);
                      if (!opt) return;

                      const prod = opt.payload;
                      updateItem(item.id, {
                        code: prod.product_barcode,
                        name: prod.product_name,
                        price: prod.product_price,
                        qty: item.qty === 0 ? 1 : item.qty,
                      });
                    }}
                  />

                </td> */}


                {/* PRODUCT NAME DROPDOWN */}
                <td className="p-2 border-r min-w-[200px]">

                  <ReusableCombobox
                    options={nameOptions}
                    value={item.name}
                    placeholder="Select Name"
                    onChange={(selected) => {
                      const opt = nameOptions.find((o) => o.value === selected);
                      if (!opt) return;

                      const prod = opt.payload;
                      updateItem(item.id, {
                        code: prod.product_barcode,
                        name: prod.product_name,
                        price: prod.product_price,
                        qty: item.qty === 0 ? 1 : item.qty,
                      });
                    }}
                  />

                </td>

                {/* QUANTITY */}
                <td className="p-2 border-r">
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-md"
                    value={item.qty}
                    min="0"
                    onChange={(e) =>
                      updateItem(item.id, { qty: Number(e.target.value) })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddRow();
                      }
                    }}
                  />
                </td>

                {/* PRICE */}
                <td className="p-2 border-r">
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-md "
                    value={item.price}
                    min="0"
                    disabled
                    onChange={(e) =>
                      updateItem(item.id, { price: Number(e.target.value) })
                    }
                  />
                </td>

                {/* TOTAL PRICE */}
                <td className="p-2 border-r font-semibold text-gray-800">
                  ₹ {item.tprice.toFixed(2)}
                </td>

                {/* DELETE */}
                <td className="p-2 text-center">
                  <button
                    onClick={() => handleDeleteRow(item.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-full"
                  >
                    <LuDelete size={22} />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {/* ADD ROW BUTTON */}
        <div className="p-4 bg-gray-50 border-t">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <IoAddCircleOutline size={22} />
            Add New Line Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingTable;
