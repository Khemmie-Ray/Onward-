"use client";

import { useState } from "react";
import { LeaderboardView, type BoardEntry } from "./LeaderboardView";

// DUMMY DATA. Quests aren't resolved yet, so the Quest tab runs on placeholder
// standings. Swap this for a real fetch once the quest scoring exists.
const NAMES = [
  "john_ade",
  "gift.okon",
  "pauline_m",
  "chidi_n",
  "amaka_u",
  "joseph_k",
  "zainab_m",
  "tobi_x",
  "ada.eth",
  "kwame_b",
  "ngozi_p",
  "emeka_d",
  "fatima_l",
  "bola_t",
  "ifeoma_k",
  "yusuf_a",
  "chioma_e",
  "sade_o",
  "musa_g",
  "halima_r",
  "obi_n",
  "funke_a",
  "deji_s",
  "nkechi_u",
  "segun_b",
  "rita_c",
  "hassan_m",
  "uche_v",
  "temi_w",
  "kelvin_z",
];

const DUMMY: BoardEntry[] = NAMES.map((name, i) => ({
  rank: i + 1,
  name,
  score: 1104 - i * 37,
}));

const PAGE = 7;

export function QuestBoard() {
  const [page, setPage] = useState(1);

  const top3 = DUMMY.filter((e) => e.rank <= 3);
  const listAll = DUMMY.filter((e) => e.rank >= 4);
  const pageCount = Math.max(1, Math.ceil(listAll.length / PAGE));
  const pageEntries = listAll.slice((page - 1) * PAGE, page * PAGE);

  return (
    <LeaderboardView
      heroTitle="Join the champions."
      heroSubtitle="Participate in daily tasks or quests to earn a spot."
      top3={top3}
      pageEntries={pageEntries}
      total={DUMMY.length}
      page={page}
      pageCount={pageCount}
      onPageChange={setPage}
      scoreLabel="score"
      emptyMessage="Quests haven't started yet."
    />
  );
}
