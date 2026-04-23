import { useState, useEffect } from "react";
import { Bookmark, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { DraftCard } from "@/components/common/DraftCard";

const EmployeeDraftsPage = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<any[]>([]);
  const { setActions } = useHeader();
  const { showToast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);

  useEffect(() => {
    setActions(null);
    return () => setActions(null);
  }, [setActions]);

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
            <DraftCard
              key={index}
              title={draft.name || "Untitled Draft"}
              timestamp={draft.updatedAt}
              icon={User}
              onEdit={() => navigate(`/employee/add?draftId=${draft.id}`)}
              onDelete={() => confirmDelete(index)}
              onComplete={() => navigate(`/employee/add?draftId=${draft.id}`)}
            />
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
