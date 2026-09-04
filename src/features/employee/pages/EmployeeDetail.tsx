import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mail, Phone, Pencil, User, Trash2, MapPin,
  Database, Shield, Calendar
} from "lucide-react";
import {
  InfoRow, SectionCard, DetailItem,
  ProfileHeaderCard,
  Modal
} from "@/components/common/SuperUI";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { useHeader } from "@/context/HeaderContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { employeeApi } from "@/services/api/employee";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import type { EmployeeRecord } from "@/types/api";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

// ── Main page ───────────────────────────────────────────────────────────────
export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData, deleteData } = useApi();
  const { showToast } = useToast();
  const { setBottomActions } = useHeader();

  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewValue, setViewValue] = useState<{ label: string, value: string } | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center justify-end w-full animate-in fade-in slide-in-from-right-4 duration-300">
        <button 
          type="button"
          onClick={() => navigate("/employee")}
          className="px-6 h-8 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all flex items-center shadow-sm"
        >
          Clear
        </button>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, navigate]);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    getData(`${ENDPOINTS.EMPLOYEES}/by/${SHOP_ID}/${id}`)
      .then((res) => {
        if (res?.data) {
          setEmployee(Array.isArray(res.data) ? res.data[0] : res.data);
        }
      })
      .finally(() => setRecordLoading(false));
  }, [id, getData]);

  const handleDelete = async () => {
    if (!employee) return;
    try {
      await deleteData(`${ENDPOINTS.EMPLOYEES}/${SHOP_ID}/${employee.id}`);
      showToast("Employee removed successfully", "success");
      navigate("/employee/all");
    } catch (_err) {
      showToast("Failed to remove employee", "error");
    }
  };

  const handleResendVerification = async () => {
    if (!employee?.id) return;
    setResendingVerification(true);
    try {
      await employeeApi.resendVerificationEmail({
        id: employee.id,
        shop_id: employee.shop_id || SHOP_ID
      });
      showToast("Verification email sent again", "success");
    } catch (_err) {
      showToast("Failed to send verification email", "error");
    } finally {
      setResendingVerification(false);
    }
  };

  if (recordLoading) return <SkeletonLoader variant="detail" />;
  if (!employee) return (
    <div className="p-20 text-center space-y-6">
      <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center mx-auto shadow-xl shadow-rose-100">
        <User size={40} />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-black text-slate-800">Employee Not Found</h2>
        <p className="text-slate-400 font-bold text-xs">The record might have been removed or the ID is incorrect.</p>
      </div>
      <button onClick={() => navigate("/employee/all")} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-black text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
        Back to Directory
      </button>
    </div>
  );

  const name = employee.name || "Unknown Member";
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50/50 font-sans overflow-hidden relative">
      
      {/* Profile Header Card */}
      <div className="flex-none p-1 pb-0 animate-in fade-in duration-500">
        <ProfileHeaderCard
          name={name}
          initials={initials}
          subText={`Employee ID: ${employee.ui_id || employee.id?.slice(0, 8).toUpperCase()}`}
          badges={[
            { text: String(employee.role || "Staff"), variant: "primary" },
            {
              text: employee.accepted ? "Accepted" : "Pending",
              variant: employee.accepted ? "success" : "warning",
              showPulse: !employee.accepted
            }
          ]}
          infoItems={[
            { icon: Mail, text: String(employee.email || "No email") },
            { icon: Phone, text: String(employee.mobile_number || "No phone") }
          ]}
          actions={
            <div className="flex items-center gap-2">
              {!employee.accepted && (
                <button
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="h-10 px-3 flex items-center gap-2 bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-[11px] font-black"
                  title="Send verification email again"
                >
                  <Mail size={16} />
                  {resendingVerification ? "Sending" : "Resend"}
                </button>
              )}
              <button
                onClick={() => navigate(`/employee/${id}/edit`)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-lg transition-all shadow-sm active:scale-95"
                title="Edit Member"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-300 rounded-lg hover:text-rose-600 transition-all shadow-sm active:scale-95"
                title="Remove Member"
              >
                <Trash2 size={18} />
              </button>
            </div>
          }
        />
      </div>

      {/* Main Content Area (scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-1 pt-3 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Professional Profile Information Card */}
          <div className="lg:col-span-8 space-y-4">
            <SectionCard title="Professional Profile Information" className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 p-2">
                <DetailItem
                  icon={User} label="Full Name" value={name}
                  onClick={() => setViewValue({ label: "Full Name", value: name })}
                />
                <DetailItem
                  icon={Mail} label="Email Address" value={String(employee.email || "—")}
                  onClick={() => setViewValue({ label: "Email Address", value: String(employee.email || "—") })}
                />
                <DetailItem
                  icon={Phone} label="Mobile Number" value={String(employee.mobile_number || "—")}
                  onClick={() => setViewValue({ label: "Mobile Number", value: String(employee.mobile_number || "—") })}
                />
                <DetailItem
                  icon={Shield} label="Access Role" value={String(employee.role || "—")}
                  onClick={() => setViewValue({ label: "Access Role", value: String(employee.role || "—") })}
                />
                <DetailItem
                  icon={Calendar} label="Joining Date" value={String(employee.joined_date || "—")}
                  onClick={() => setViewValue({ label: "Joining Date", value: String(employee.joined_date || "—") })}
                />
                <DetailItem
                  icon={Database} label="Salary Range" value={employee.datas?.salary_range ? `₹${employee.datas.salary_range}` : "—"}
                  onClick={() => setViewValue({ label: "Salary Range", value: String(employee.datas?.salary_range || "—") })}
                />
                <DetailItem
                  icon={MapPin} label="Full Address" value={employee.datas?.address?.full_address || "—"}
                  onClick={() => setViewValue({ label: "Full Address", value: employee.datas?.address?.full_address || "—" })}
                />
                <DetailItem
                  icon={MapPin} label="Zip Code" value={employee.datas?.address?.zip_code || "—"}
                  onClick={() => setViewValue({ label: "Zip Code", value: employee.datas?.address?.zip_code || "—" })}
                />

                {/* Dynamic fields */}
                {Object.entries(employee).map(([key, val]) => {
                  if (["name", "email", "mobile_number", "role", "department", "joined_date", "employee_id", "shop_id", "account_id", "is_accepted", "added_by", "id", "datas", "ui_id", "created_at", "updated_at"].includes(key)) return null;
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <DetailItem
                      key={key}
                      icon={Database}
                      label={label}
                      value={String(val ?? "—")}
                      onClick={() => setViewValue({ label, value: String(val ?? "—") })}
                    />
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* Right Sidebar - System Context */}
          <div className="lg:col-span-4 space-y-6">
            <SectionCard title="System Context">
              <div className="space-y-4">
                <InfoRow label="Employee ID" value={String(employee.id || "—")} />
                <InfoRow label="Shop ID" value={String(employee.shop_id || SHOP_ID)} />
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Modal: View Full Value */}
        <Modal
          show={!!viewValue}
          onClose={() => setViewValue(null)}
          title={viewValue?.label || "Field Detail"}
          className="max-w-md"
        >
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-sm font-bold text-slate-700 break-words leading-relaxed select-all">
              {viewValue?.value}
            </p>
          </div>
          <p className="mt-4 text-[10px] font-bold text-slate-400 text-center">
            Double click the text to select and copy
          </p>
        </Modal>

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Remove Employee"
          description={`Are you sure you want to remove ${name}? They will lose all system access immediately.`}
          confirmText="Remove Member"
          type="danger"
        />
      </div>
    </div>
  );
}


