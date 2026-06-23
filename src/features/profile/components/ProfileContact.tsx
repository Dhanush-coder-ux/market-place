// ─── ProfileContact — All contact & location rows ───────────────────────────

import React from "react";
import { Phone, Mail, MapPin, Hash, Building2 } from "lucide-react";
import SectionCard from "./ui/SectionCard";
import InfoRow from "./ui/InfoRow";
import type { NormalisedShop } from "../types";

interface ProfileContactProps {
  shop: NormalisedShop;
}

const ProfileContact: React.FC<ProfileContactProps> = ({ shop }) => {
  const { phone, email, address, landmark, zipcode, city } = shop;

  return (
    <SectionCard
      title="Contact & Location"
      subtitle="Physical and digital reach"
      icon={<Phone size={16} className="text-emerald-600" />}
      iconBg="bg-emerald-50"
    >
      <div>
        <InfoRow
          icon={<Phone size={14} />}
          label="Phone Number"
          value={phone}
          accent="blue"
        />
        <InfoRow
          icon={<Mail size={14} />}
          label="Email Address"
          value={email}
          accent="purple"
        />
        <InfoRow
          icon={<MapPin size={14} />}
          label="Street Address"
          value={address}
          accent="emerald"
        />
        <InfoRow
          icon={<MapPin size={14} />}
          label="Landmark"
          value={landmark}
          accent="orange"
        />
        <InfoRow
          icon={<Building2 size={14} />}
          label="City"
          value={city}
          accent="emerald"
        />
        <InfoRow
          icon={<Hash size={14} />}
          label="ZIP / Pincode"
          value={zipcode}
          accent="blue"
        />
      </div>
    </SectionCard>
  );
};

export default ProfileContact;
