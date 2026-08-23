export const SectionCard = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <h3 className="font-bold text-slate-700 text-sm tracking-wide ">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

