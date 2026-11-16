import Announcements from "./Announcement";

export default function Promotions({ onCountChange }: { onCountChange?: (total: number, active: number) => void }) {
  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1">
        <Announcements onCountChange={onCountChange} />
      </div>
    </div>
  );
}
