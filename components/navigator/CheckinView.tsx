"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useHash } from "./useHash";
import { sortCheckins } from "@/lib/navigator/rules";
import { CheckinCard } from "./CheckinCard";
import { CheckinForm } from "./CheckinForm";
import { navBtnOutline } from "./bits";
import { useNavigator } from "./NavigatorProvider";

export function CheckinView() {
  const { state } = useNavigator();
  const [showForm, setShowForm] = useState(false);
  const hash = useHash();
  const [saved, setSaved] = useState("");
  const highlight = saved || hash;

  // "Lihat check-in" links arrive with #<checkin id>.
  useEffect(() => {
    if (hash) document.getElementById(hash)?.scrollIntoView({ block: "center" });
  }, [hash]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Check-in gejala</h1>
          <p className="mt-1 text-ink-3">Keluhan dan efek samping obat dicatat terstruktur. Jawaban berbahaya ditandai otomatis; keputusan klinis tetap di dokter.</p>
        </div>
        <button type="button" onClick={() => setShowForm((v) => !v)} className={navBtnOutline}>
          {showForm ? <X aria-hidden className="size-4" /> : <Plus aria-hidden className="size-4" />}
          {showForm ? "Tutup formulir" : "Catat check-in baru"}
        </button>
      </div>
      {showForm && (
        <CheckinForm
          onSaved={(id) => {
            setSaved(id);
            setShowForm(false);
          }}
        />
      )}
      <div className="space-y-3">
        {sortCheckins(state.checkins).map((c) => (
          <CheckinCard key={c.id} checkin={c} highlight={c.id === highlight} />
        ))}
      </div>
    </div>
  );
}
