import { useState, useEffect } from "react";
import { X, Bookmark, Trash2, Edit3, Clock, User, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";

const EmployeeDraftsPage = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<any[]>([]);
  const { setActions } = useHeader();
  const { showToast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);

  useEffect(() => {
    setActions(
      <button 
        onClick={() => navigate("/employee/all")}
        className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm flex items-center justify-center"
      >
        <ChevronLeft size={20} />
      </button>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => {
    const storedDrafts = JSON.parse(localStorage.getItem("employee_drafts") || "[]");
    setDrafts(storedDrafts);
  }, []);

  const confirmDelete = (index: number) => {
    setIndexToDelete(index);
    setIsDeleteDialogOpen(true);
  };

  const deleteDraft = () => {
    if (indexToDelete === null) return;
    const updated = [...drafts];
    updated.splice(indexToDelete, 1);
    setDrafts(updated);
    localStorage.setItem("employee_drafts", JSON.stringify(updated));
    showToast("Draft removed", "success");
    setIsDeleteDialogOpen(false);
    setIndexToDelete(null);
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
          title="No active drafts"
          description="Capture employee details and save them as drafts to resume later."
          actionText="Create New Employee"
          onAction={() => navigate("/employee/add")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((draft, index) => (
            <div key={index} className="group bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <User size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate(`/employee/add?draftId=${draft.id}`)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    title="Edit Draft"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => confirmDelete(index)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                    title="Delete Draft"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800 tracking-tight">{draft.name || "Untitled Draft"}</h4>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <Clock size={12} />
                  Saved {new Date(draft.updatedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Role</p>
                  <p className="text-xs font-bold text-slate-600 capitalize">{draft.role || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Contact</p>
                  <p className="text-xs font-bold text-slate-600 truncate">{draft.email || "—"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={deleteDraft}
        title="Remove Draft"
        description="Are you sure you want to delete this employee draft? This action cannot be undone."
        confirmText="Delete Draft"
        type="danger"
      />
    </div>
  );
};

export default EmployeeDraftsPage;
