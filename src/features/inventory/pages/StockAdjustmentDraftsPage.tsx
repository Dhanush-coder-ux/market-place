import { useState, useEffect } from "react";
import { Bookmark, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { DraftCard } from "@/components/common/DraftCard";

const StockAdjustmentDraftsPage = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<any[]>([]);
  const { setActions } = useHeader();
  const { showToast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);

  useEffect(() => {
    setActions(null);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => {
    const storedDrafts = JSON.parse(localStorage.getItem("stock_adjustment_drafts") || "[]");
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
    localStorage.setItem("stock_adjustment_drafts", JSON.stringify(updated));
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
          title="No active drafts"
          description="Start a new stock adjustment and save progress to see them here."
          actionText="New Stock Adjustment"
          onAction={() => navigate("/stock-adjustment")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              title={draft.displayName || "Untitled Adjustment"}
              timestamp={draft.timestamp}
              icon={Package}
              onEdit={() => navigate(`/stock-adjustment?draftId=${draft.id}`)}
              onDelete={() => confirmDelete(draft.id)}
              onComplete={() => navigate(`/stock-adjustment?draftId=${draft.id}`)}
            />
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

export default StockAdjustmentDraftsPage;
