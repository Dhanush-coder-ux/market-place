import { useState, useEffect } from "react";
import { Bookmark, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { DraftCard } from "@/components/common/DraftCard";

const PurchaseDraftsPage = () => {
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
    const storedDrafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
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
    localStorage.setItem("purchase_drafts", JSON.stringify(updated));
    showToast("Draft removed", "success");
    setDraftToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-4 md:p-6 font-[Inter,sans-serif]">
      
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
          description="Start a new purchase and save progress to see them here."
          actionText="Add New Purchase"
          onAction={() => navigate("/purchase/add")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              title={draft.displayName || "Untitled Draft"}
              timestamp={draft.timestamp}
              icon={Wallet}
              typeTag={draft.type || "PURCHASE"}
              onEdit={() => {
                let path = "/purchase/add";
                if (draft.type === "PRODUCTION") path = "/production-entry/add";
                if (draft.type === "GRN Purchase") path = "/po-grn/add";
                navigate(`${path}?draftId=${draft.id}`);
              }}
              onDelete={() => confirmDelete(draft.id)}
              onComplete={() => {
                let path = "/purchase/add";
                if (draft.type === "PRODUCTION") path = "/production-entry/add";
                if (draft.type === "GRN Purchase") path = "/po-grn/add";
                navigate(`${path}?draftId=${draft.id}`);
              }}
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

export default PurchaseDraftsPage;
