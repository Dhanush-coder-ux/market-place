import { useState, useEffect } from "react";
import { X, Bookmark, Trash2, Edit3, Clock, Building2, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";

const SupplierDraftsPage = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<any[]>([]);
  const { setActions } = useHeader();
  const { showToast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);

  useEffect(() => {
    setActions(null);
    return () => setActions(null);
  }, [setActions]);

  useEffect(() => {
    const storedDrafts = JSON.parse(localStorage.getItem("supplier_drafts") || "[]");
    setDrafts(storedDrafts);
  }, []);

  const confirmDelete = (id: string) => {
    setDraftToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const deleteDraft = () => {
    if (!draftToDelete) return;
    const updated = drafts.filter((d) => d.id !== draftToDelete);
    setDrafts(updated);
    localStorage.setItem("supplier_drafts", JSON.stringify(updated));
    showToast("Draft removed", "success");
    setDraftToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-4 md:p-6">
      
      {/* Notice */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-3 text-blue-700 flex items-center gap-3">
        <Bookmark size={16} className="text-blue-500 shrink-0" />
        <p className="text-sm font-semibold">
          <span className="font-bold mr-2 uppercase text-[10px] bg-blue-100 px-1.5 py-0.5 rounded tracking-wider">Notice:</span>
          Drafts are saved locally in your browser and will be removed if you clear your site data.
        </p>
      </div>

      {drafts.length === 0 ? (
        <EmptyState 
          title="No active supplier drafts"
          description="Start a new registration and save progress to see them here."
          actionText="Register New Supplier"
          onAction={() => navigate("/supplier/add")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((draft) => (
            <div key={draft.id} className="group bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <Building2 size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate(`/supplier/add?draftId=${draft.id}`)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    title="Edit Draft"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => confirmDelete(draft.id)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                    title="Delete Draft"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-lg line-clamp-1">{draft.displayName || "Untitled Supplier"}</h4>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <Clock size={12} />
                  {new Date(draft.timestamp).toLocaleDateString()} at {new Date(draft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Local Draft</span>
                <button 
                  onClick={() => navigate(`/supplier/add?draftId=${draft.id}`)}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  Complete Now →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={deleteDraft}
        title="Delete Draft"
        description="Are you sure you want to remove this draft? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default SupplierDraftsPage;
