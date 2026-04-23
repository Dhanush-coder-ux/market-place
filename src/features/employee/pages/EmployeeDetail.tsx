import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mail, Phone, Pencil, User, Trash2,
  Database, Shield, Briefcase, Calendar, MapPin, Search, Star, Info
} from "lucide-react";
import {
  fmt, StatusBadge, InfoRow, SectionCard, DetailItem,
  ProfileHeaderCard,
  Modal
} from "@/components/common/SuperUI";
import { StatCard } from "@/components/common/StatsCard";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import type { EmployeeRecord } from "@/types/api";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useHeader } from "@/context/HeaderContext";

// ── Search bar ──────────────────────────────────────────────────────────────
const EmployeeQuickSearch = () => {
  const navigate = useNavigate();
  const { getData } = useApi();

  const fetchEmployees = async (q: string) => {
    if (!q) return [];
    try {
      const res = await getData(ENDPOINTS.EMPLOYEES, { limit: "8", offset: "1", q, shop_id: SHOP_ID });
      const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      return data.map((e: any) => ({
        ...e,
        displayName: e.name || e.email || e.employee_id
      }));
    } catch (error) {
      return [];
    }
  };

  return (
    <div className="w-full relative z-50">
      <SearchSelect
        labelKey="displayName"
        valueKey="employee_id"
        fetchOptions={fetchEmployees}
        placeholder="Search employee by name / ID…"
        className="w-full"
        onChange={(val) => {
          if (val) {
            navigate(`/employee/${val}`);
          }
        }}
      />
    </div>
  );
};

const TABS = ["General Info", "Performance", "Schedule", "Timeline"];

// ── Main page ───────────────────────────────────────────────────────────────
export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData, deleteData } = useApi();
  const { showToast } = useToast();
  const { setActions } = useHeader();

  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewValue, setViewValue] = useState<{ label: string, value: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    // Note: Adjust endpoint based on how your API fetches single employee
    getData(`${ENDPOINTS.EMPLOYEES}/by/${id}`)
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
      await deleteData(`${ENDPOINTS.EMPLOYEES}/${SHOP_ID}/${employee.employee_id}`);
      showToast("Employee removed successfully", "success");
      navigate("/employee/all");
    } catch (err) {
      showToast("Failed to remove employee", "error");
    }
  };

  // Header Actions

  if (recordLoading) return <div className="p-20"><Loader /></div>;
  if (!employee) return (
    <div className="p-20 text-center space-y-6">
      <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-rose-100">
        <User size={40} />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Employee Not Found</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">The record might have been removed or the ID is incorrect.</p>
      </div>
      <button onClick={() => navigate("/employee/all")} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
        Back to Directory
      </button>
    </div>
  );

  const name = employee.name || "Unknown Member";
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50/50 font-[Inter,sans-serif] animate-in fade-in duration-500">
      <div className="mx-auto  py-3 space-y-4">

        {/* Profile Header Card */}
        <ProfileHeaderCard
          name={name}
          initials={initials}
          subText={`ID: ${employee.employee_id}`}
          badges={[
            { text: String(employee.role || "Staff"), variant: "primary" },
            {
              text: employee.is_accepted ? "Accepted" : "Pending",
              variant: employee.is_accepted ? "success" : "warning",
              showPulse: !employee.is_accepted
            }
          ]}
          infoItems={[
            { icon: Mail, text: String(employee.email || "No email") },
            { icon: Phone, text: String(employee.mobile_number || "No phone") }
          ]}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/employee/${id}/edit`)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm active:scale-95"
                title="Edit Member"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-300 rounded-xl hover:text-rose-600 rounded-xl transition-all shadow-sm active:scale-95"
                title="Remove Member"
              >
                <Trash2 size={18} />
              </button>
            </div>
          }
        />

        {/* Tabs Navigation */}
        <div className="flex gap-0.5 bg-white p-1 rounded-xl border border-slate-200 w-fit overflow-x-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === i
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Quick Stats Grid */}
        <div className="flex gap-2">
          <StatCard
            icon={Briefcase}
            label="Tasks Done"
            value="0"
            iconBg="bg-blue-50 text-blue-600"
            className=" min-w-[140px]"
          />
          <StatCard
            icon={Star}
            label="Rating"
            value="5.0"
            iconBg="bg-amber-50 text-amber-600"
            className="min-w-[140px]"
          />
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Main Info Area */}
          <div className="lg:col-span-8 space-y-4">
            {activeTab === 0 && (
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

                  {/* Dynamic fields */}
                  {Object.entries(employee).map(([key, val]) => {
                    if (["name", "email", "mobile_number", "role", "employee_id", "shop_id", "account_id", "is_accepted", "added_by", "id"].includes(key)) return null;
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
            )}

            {activeTab === 1 && (
              <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <Star size={40} className="mx-auto text-amber-200 mb-4" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Performance Metrics</h3>
                <p className="text-xs text-slate-400 font-bold mt-2 uppercase">No evaluation data available for this period.</p>
              </div>
            )}

            {activeTab === 2 && (
              <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <Calendar size={40} className="mx-auto text-blue-200 mb-4" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Shift Schedule</h3>
                <p className="text-xs text-slate-400 font-bold mt-2 uppercase">No active rosters assigned to this member.</p>
              </div>
            )}

            {activeTab === 3 && (
              <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <Info size={40} className="mx-auto text-slate-200 mb-4" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Activity Timeline</h3>
                <p className="text-xs text-slate-400 font-bold mt-2 uppercase">No recent system activities tracked.</p>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <SectionCard title="System Context">
              <div className="space-y-4">
                <InfoRow label="Added By" value={String(employee.added_by || "System")} />
                <InfoRow label="Account ID" value={String(employee.account_id || "—")} />
                <InfoRow label="Shop ID" value={String(employee.shop_id || "—")} />
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
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-sm font-bold text-slate-700 break-words leading-relaxed select-all">
              {viewValue?.value}
            </p>
          </div>
          <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
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