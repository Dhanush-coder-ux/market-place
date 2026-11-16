import React, { useCallback, useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Trash2,
  Pencil,
  Tag,
  SlidersHorizontal,
  AlertTriangle,
  X,
  Loader2,
  Globe,
  Calendar,
  Hash,
  Type,
  ToggleLeft,
  ListFilter,
  Search,
  Info,
  Database,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SHOP_ID, getShopId } from "@/services/endpoints";
import { utilityApi } from "@/services/api/utility";
import { inventoryCustomFieldsApi, InventoryCustomFieldDefinition } from "@/services/api/inventory";
import { useToast } from "@/context/ToastContext";
import { ReusableSelect } from "@/components/ui/ReusableSelect";

interface CustomFieldsSettingsProps {
  isEmbedded?: boolean;
}

type CategoryOption = {
  id: string;
  name: string;
};

const normalizeCategories = (res: any): CategoryOption[] => {
  const data = res?.data ?? res;
  const rawItems = Array.isArray(data)
    ? data
    : data?.datas ?? data?.items ?? data?.results ?? [];

  return (Array.isArray(rawItems) ? rawItems : [])
    .map((item: any) => ({
      id: String(item.id ?? item.datas?.id ?? ""),
      name: String(item.name ?? item.datas?.name ?? item.value ?? "").trim(),
    }))
    .filter((item: CategoryOption) => item.id && item.name);
};

export const CustomFieldsSettings: React.FC<CustomFieldsSettingsProps> = ({ isEmbedded: _isEmbedded = false }) => {
  const { showToast } = useToast();
  const [fields, setFields] = useState<InventoryCustomFieldDefinition[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<InventoryCustomFieldDefinition | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [labelName, setLabelName] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [categoryId, setCategoryId] = useState("");
  const [required, setRequired] = useState(false);
  const [visibleOnline, setVisibleOnline] = useState(false);
  const [optionsStr, setOptionsStr] = useState("");
  const [defaultValue, setDefaultValue] = useState("");

  // Delete Modal State
  const [deleteModalField, setDeleteModalField] = useState<InventoryCustomFieldDefinition | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const activeShopId = getShopId() || SHOP_ID;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch paginated custom fields from backend
  const fetchCustomFields = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryCustomFieldsApi.getPaginatedFields(activeShopId, {
        search: debouncedSearch.trim() || undefined,
        category_id: filterCategory !== "ALL" ? filterCategory : undefined,
        field_type: filterType !== "ALL" ? filterType : undefined,
        page,
        limit,
      });
      setFields(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 0);
    } catch (err: any) {
      console.error("Failed to load custom fields:", err);
      showToast("Failed to load custom fields", "error");
    } finally {
      setLoading(false);
    }
  }, [activeShopId, debouncedSearch, filterCategory, filterType, page, limit, showToast]);

  useEffect(() => {
    fetchCustomFields();
  }, [fetchCustomFields]);

  // Fetch shop categories once
  useEffect(() => {
    utilityApi
      .getShopCategories(activeShopId, { limit: "100", offset: "1" })
      .then((catsRes) => {
        setCategories(normalizeCategories(catsRes));
      })
      .catch(() => setCategories([]));
  }, [activeShopId]);

  // Category filter dropdown options
  const categoryFilterOptions = useMemo(() => {
    const list = [
      { value: "ALL", label: "All Categories & Global" },
      { value: "global", label: "Global Only (All Categories)" },
    ];
    categories.forEach((cat) => {
      list.push({ value: cat.id, label: cat.name });
    });
    return list;
  }, [categories]);

  // Type filter dropdown options
  const typeFilterOptions = useMemo(
    () => [
      { value: "ALL", label: "All Types" },
      { value: "text", label: "Text" },
      { value: "number", label: "Number" },
      { value: "boolean", label: "Yes / No" },
      { value: "select", label: "Dropdown" },
      { value: "date", label: "Date" },
    ],
    []
  );

  // Modal Category dropdown options
  const modalCategoryOptions = useMemo(() => {
    const list = [
      { value: "", label: "All Categories (Global across all products)" },
    ];
    categories.forEach((c) => {
      list.push({ value: c.id, label: c.name });
    });
    return list;
  }, [categories]);

  // Modal Type dropdown options
  const modalTypeOptions = useMemo(
    () => [
      { value: "text", label: "Text (Single-line string)" },
      { value: "number", label: "Number (Integer / Decimal)" },
      { value: "boolean", label: "Yes / No (Boolean Switch)" },
      { value: "select", label: "Dropdown / Select (Choose from list)" },
      { value: "date", label: "Date (Calendar picker)" },
    ],
    []
  );

  const handleCategoryFilterChange = (val: string) => {
    setFilterCategory(val);
    setPage(1);
  };

  const handleTypeFilterChange = (val: string) => {
    setFilterType(val);
    setPage(1);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingField(null);
    setLabelName("");
    setFieldName("");
    setFieldType("text");
    setCategoryId(filterCategory !== "ALL" && filterCategory !== "global" ? filterCategory : "");
    setRequired(false);
    setVisibleOnline(false);
    setOptionsStr("");
    setDefaultValue("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (field: InventoryCustomFieldDefinition) => {
    setEditingField(field);
    setLabelName(field.label_name || "");
    setFieldName(field.field_name || "");
    setFieldType(field.type || "text");
    setCategoryId(field.category_id || "");
    setRequired(!!field.required);
    setVisibleOnline(!!field.visible_online);
    if (Array.isArray(field.options)) {
      setOptionsStr(field.options.join(", "));
    } else if (typeof field.options === "string") {
      setOptionsStr(field.options);
    } else {
      setOptionsStr("");
    }
    setDefaultValue(field.default_value || "");
    setIsModalOpen(true);
  };

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelName.trim()) {
      showToast("Field Label is required", "error");
      return;
    }

    const trimmedLabel = labelName.trim();
    const finalFieldName =
      fieldName.trim() ||
      trimmedLabel
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "_");

    const categoryIdVal = categoryId.trim() || null;
    const parsedOptions =
      fieldType === "select" || fieldType === "dropdown"
        ? optionsStr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : null;

    setIsSubmitting(true);
    try {
      if (editingField) {
        // Update field
        const hasValues = (editingField.usage_count ?? 0) > 0 || !!editingField.has_values;
        await inventoryCustomFieldsApi.updateField({
          shop_id: activeShopId,
          field_id: editingField.id,
          label_name: trimmedLabel,
          category_id: categoryIdVal,
          type: hasValues ? undefined : fieldType,
          required,
          visible_online: visibleOnline,
          options: parsedOptions,
          default_value: defaultValue.trim() || null,
        });
        showToast("Custom field updated successfully", "success");
      } else {
        // Create field
        await inventoryCustomFieldsApi.createField({
          shop_id: activeShopId,
          field_infos: [
            {
              field_name: finalFieldName,
              label_name: trimmedLabel,
              type: fieldType,
              category_id: categoryIdVal,
              required,
              visible_online: visibleOnline,
              options: parsedOptions,
              default_value: defaultValue.trim() || null,
            },
          ],
        });
        showToast("Custom field created successfully", "success");
      }

      setIsModalOpen(false);
      await fetchCustomFields();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail?.msg ||
        err?.detail?.msg ||
        err?.detail ||
        err?.message ||
        "Failed to save custom field";
      showToast(typeof msg === "string" ? msg : "Failed to save custom field", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Cascade Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalField) return;
    setDeleteLoading(true);
    try {
      await inventoryCustomFieldsApi.deleteField(activeShopId, deleteModalField.id);
      const usageCount = deleteModalField.usage_count ?? (deleteModalField.has_values ? 1 : 0);
      if (usageCount > 0) {
        showToast(
          `Custom field and its values across ${usageCount} product(s) permanently deleted.`,
          "success"
        );
      } else {
        showToast("Custom field deleted successfully.", "success");
      }
      setDeleteModalField(null);
      if (fields.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await fetchCustomFields();
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail?.msg ||
        err?.detail?.msg ||
        err?.detail ||
        err?.message ||
        "Failed to delete custom field";
      showToast(typeof msg === "string" ? msg : "Failed to delete custom field", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Helper to get category name
  const getCategoryName = (catId?: string | null) => {
    if (!catId) return "All Categories";
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : "Category Specific";
  };

  // Helper to render type badge
  const renderTypeBadge = (type: string) => {
    switch (type) {
      case "number":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Hash size={11} /> Number
          </span>
        );
      case "boolean":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50/60 text-emerald-900 border border-emerald-200">
            <ToggleLeft size={12} /> Yes / No
          </span>
        );
      case "select":
      case "dropdown":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <ListFilter size={11} /> Dropdown
          </span>
        );
      case "date":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Calendar size={11} /> Date
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Type size={11} /> Text
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#286038] shadow-xs">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Product Custom Fields
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Create and manage custom attributes for specific categories or across all products.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#286038] hover:bg-[#1e4a2b] text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus size={15} />
          Add Custom Field
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search custom fields by label or key…"
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#286038]/20 focus:border-[#286038] font-medium transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Category Filter using ReusableSelect */}
          <div className="flex items-center gap-2 w-56 sm:w-64">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Category:</span>
            <div className="flex-1">
              <ReusableSelect
                size="sm"
                value={filterCategory}
                onValueChange={handleCategoryFilterChange}
                options={categoryFilterOptions}
                placeholder="All Categories & Global"
                className="h-9 text-xs font-semibold rounded-xl border-slate-200 focus:border-[#286038] focus:ring-[#286038]/20"
              />
            </div>
          </div>

          {/* Type Filter using ReusableSelect */}
          <div className="flex items-center gap-2 w-40 sm:w-44">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Type:</span>
            <div className="flex-1">
              <ReusableSelect
                size="sm"
                value={filterType}
                onValueChange={handleTypeFilterChange}
                options={typeFilterOptions}
                placeholder="All Types"
                className="h-9 text-xs font-semibold rounded-xl border-slate-200 focus:border-[#286038] focus:ring-[#286038]/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fields List Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 size={28} className="animate-spin text-[#286038] mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading custom fields…</p>
          </div>
        ) : fields.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <SlidersHorizontal size={22} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">No custom fields found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {searchQuery || filterCategory !== "ALL" || filterType !== "ALL"
                ? "No custom fields match your current filters. Try resetting the search or filters."
                : "Add custom fields to store extra product details like warranty, material, or rack location."}
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#286038] border border-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={14} /> Create Custom Field
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Field Label &amp; Key</th>
                  <th className="py-3 px-4">Category Scope</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Attributes</th>
                  <th className="py-3 px-4">Product Usage</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {fields.map((field) => {
                  const usageCount = field.usage_count ?? (field.has_values ? 1 : 0);
                  const isGlobal = !field.category_id;

                  return (
                    <tr
                      key={field.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Field Label & Key */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{field.label_name}</span>
                          {field.required && (
                            <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              Required
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {field.field_name}
                          </code>
                          {field.default_value && (
                            <span className="text-[10px] text-slate-400">
                              Default: &quot;{field.default_value}&quot;
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category Scope */}
                      <td className="py-3.5 px-4">
                        {isGlobal ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Globe size={11} className="text-slate-500" /> All Categories
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Tag size={11} className="text-emerald-600" />{" "}
                            {getCategoryName(field.category_id)}
                          </span>
                        )}
                      </td>

                      {/* Field Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          {renderTypeBadge(field.type)}
                          {(field.type === "select" || field.type === "dropdown") && field.options && (
                            <span className="text-[10px] text-slate-400 font-medium max-w-[160px] truncate" title={Array.isArray(field.options) ? field.options.join(", ") : String(field.options)}>
                              Options: {Array.isArray(field.options) ? field.options.join(", ") : String(field.options)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Attributes */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {field.visible_online ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Globe size={10} /> Online
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">
                              POS only
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Product Usage Count */}
                      <td className="py-3.5 px-4">
                        {usageCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                            <Database size={11} className="text-[#286038]" />
                            Used in {usageCount} product{usageCount === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            Not used yet
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(field)}
                            title="Edit Custom Field"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#286038] hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-colors cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModalField(field)}
                            title={
                              usageCount > 0
                                ? `Used in ${usageCount} product(s) - click to cascade delete`
                                : "Delete Custom Field"
                            }
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && total > 0 && (
          <div className="px-4 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-bold text-slate-800">{Math.min(page * limit, total)}</span> of{" "}
              <span className="font-bold text-slate-800">{total}</span> custom fields
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 1 && p <= page + 1)
                  ) {
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          p === page
                            ? "bg-[#286038] text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === page - 2 || p === page + 2) {
                    return (
                      <span key={p} className="px-1 text-slate-400 font-bold">
                        …
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                type="button"
                disabled={page >= totalPages || totalPages === 0}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── CREATE / EDIT MODAL ────────────────────────────────────────── */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/40 via-white to-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#286038] border border-emerald-100 flex items-center justify-center font-bold">
                    <SlidersHorizontal size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {editingField ? "Edit Custom Field" : "Create New Custom Field"}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {editingField
                        ? "Update field label, category scope, and display settings"
                        : "Define a new custom attribute for products"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {editingField && (editingField.usage_count ?? 0) > 0 && (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-900 text-xs font-medium leading-relaxed">
                    <Info size={16} className="shrink-0 mt-0.5 text-[#286038]" />
                    <span>
                      This field has saved values across{" "}
                      <strong>{editingField.usage_count} product(s)</strong>. The field type is
                      locked to preserve existing product data.
                    </span>
                  </div>
                )}

                {/* Field Label */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Field Label (Display Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={labelName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLabelName(val);
                      if (!editingField) {
                        setFieldName(
                          val
                            .toLowerCase()
                            .replace(/[^a-z0-9\s]/g, "")
                            .trim()
                            .replace(/\s+/g, "_")
                        );
                      }
                    }}
                    placeholder="e.g. Warranty Period, Rack Number, Fabric Type"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#286038]/20 focus:border-[#286038] font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    The human-readable label shown on product forms and invoice/details.
                  </p>
                </div>

                {/* Field Key */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Field Key (Internal Identifier) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingField}
                    value={fieldName}
                    onChange={(e) =>
                      setFieldName(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "")
                      )
                    }
                    placeholder="e.g. warranty_period"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-[#286038]/20 focus:border-[#286038] disabled:opacity-75"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Unique key used internally (auto-generated from label in snake_case).
                  </p>
                </div>

                {/* Applicable Category Selection using ReusableSelect */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Applicable Category Scope
                  </label>
                  <ReusableSelect
                    value={categoryId}
                    onValueChange={(val) => setCategoryId(val)}
                    options={modalCategoryOptions}
                    placeholder="All Categories (Global across all products)"
                    className="w-full text-xs rounded-xl border-slate-200 focus:border-[#286038] focus:ring-[#286038]/20 font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Choose a specific category so this field only appears for that category, or keep
                    &quot;All Categories&quot; to apply globally.
                  </p>
                </div>

                {/* Field Type Selection using ReusableSelect */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Field Type</label>
                  <ReusableSelect
                    value={fieldType}
                    disabled={!!(editingField && ((editingField.usage_count ?? 0) > 0 || editingField.has_values))}
                    onValueChange={(val) => setFieldType(val)}
                    options={modalTypeOptions}
                    placeholder="Select field type"
                    className="w-full text-xs rounded-xl border-slate-200 focus:border-[#286038] focus:ring-[#286038]/20 font-semibold disabled:bg-slate-50 disabled:opacity-75"
                  />
                </div>

                {/* Dropdown Options (if select type) */}
                {(fieldType === "select" || fieldType === "dropdown") && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dropdown Options (Comma separated) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={optionsStr}
                      onChange={(e) => setOptionsStr(e.target.value)}
                      placeholder="e.g. Small, Medium, Large, Extra Large"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#286038]/20 focus:border-[#286038] font-semibold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Enter options separated by commas. Each will be selectable from a dropdown.
                    </p>
                  </div>
                )}

                {/* Default Value */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Default Value <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={defaultValue}
                    onChange={(e) => setDefaultValue(e.target.value)}
                    placeholder="Optional default pre-filled value"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#286038]/20 focus:border-[#286038] font-semibold"
                  />
                </div>

                {/* Toggles */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  {/* Mandatory Toggle */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 cursor-pointer select-none">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Mandatory Field</span>
                      <span className="text-[10px] text-slate-500">
                        Require users to provide a value when saving a product.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={required}
                      onChange={(e) => setRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-[#286038] focus:ring-[#286038] accent-[#286038] cursor-pointer"
                    />
                  </label>

                  {/* Visible Online Toggle */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 cursor-pointer select-none">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Visible Online</span>
                      <span className="text-[10px] text-slate-500">
                        Expose this field in storefront and public product catalogs.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={visibleOnline}
                      onChange={(e) => setVisibleOnline(e.target.checked)}
                      className="w-4 h-4 rounded text-[#286038] focus:ring-[#286038] accent-[#286038] cursor-pointer"
                    />
                  </label>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#286038] hover:bg-[#1e4a2b] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>{editingField ? "Update Field" : "Create Field"}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ─── CASCADE DELETE CONFIRMATION MODAL ──────────────────────────── */}
      {deleteModalField &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
              {/* Alert Header */}
              <div className="p-6 text-center">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    (deleteModalField.usage_count ?? 0) > 0 || deleteModalField.has_values
                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}
                >
                  <AlertTriangle size={24} />
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {(deleteModalField.usage_count ?? 0) > 0 || deleteModalField.has_values
                    ? "Permanently Delete Custom Field?"
                    : "Delete Custom Field?"}
                </h3>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4 inline-block text-left w-full">
                  <div className="text-xs font-bold text-slate-800">
                    {deleteModalField.label_name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    key: {deleteModalField.field_name} • Scope: {getCategoryName(deleteModalField.category_id)}
                  </div>
                </div>

                {/* Warning details based on usage count */}
                {(deleteModalField.usage_count ?? 0) > 0 || deleteModalField.has_values ? (
                  <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl text-left text-xs text-rose-900 space-y-2 mb-4 leading-relaxed font-medium">
                    <p>
                      ⚠️ <strong>Warning:</strong> This custom field is currently used in{" "}
                      <strong>
                        {deleteModalField.usage_count ?? (deleteModalField.has_values ? 1 : 0)} product(s)
                      </strong>
                      .
                    </p>
                    <p className="text-[11px] text-rose-700">
                      Deleting it will <strong>permanently remove</strong> this field and all of its saved values across all{" "}
                      {deleteModalField.usage_count ?? (deleteModalField.has_values ? 1 : 0)} products in both your primary and search databases.
                    </p>
                    <p className="text-[11px] font-bold text-rose-800">
                      This action cannot be undone.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Are you sure you want to delete this custom field? No products are currently
                    using it.
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={() => setDeleteModalField(null)}
                    className="flex-1 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={handleConfirmDelete}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Deleting…
                      </>
                    ) : (
                      <>
                        {(deleteModalField.usage_count ?? 0) > 0 || deleteModalField.has_values
                          ? "Permanently Delete"
                          : "Delete Field"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
