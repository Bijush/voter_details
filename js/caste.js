// ===============================
// 🧬 CASTE DETECTION MODULE
// ===============================

export function detectCaste(nameRaw) {
  if (!nameRaw) return "General";

  const parts = nameRaw.trim().toLowerCase().split(/\s+/);
  const lastWord = parts[parts.length - 1];

  const SC  = ["roy","mallick","mallik","das","namashudra","namasudra","namsudra","sarkar","debnath","majhi"];
  const ST  = ["tudu","hansda","murmu","basumatary"];
  const OBC = ["dey","sukla","suklabaidya","bhadra"];
  const MUSLIM = ["laskar","uddin","hussain","hossain","begum","khatun","barbhuiya","mia"];

  if (SC.includes(lastWord)) return "SC";
  if (ST.includes(lastWord)) return "ST";
  if (OBC.includes(lastWord)) return "OBC";
  if (MUSLIM.includes(lastWord)) return "Muslim";

  return "General";
}