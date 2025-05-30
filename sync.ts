import { listRecords, deleteRecords, createRecords, type EvRecord } from "./api";

export const syncRecords = async (lines: Array<EvRecord>) => {
  const tableId = process.env?.EV_TABLE_ID ?? "";

  const records = await listRecords(tableId);
  await deleteRecords(tableId, records.filter(r => !!r.Id).map(r => ({ Id: r.Id })).sort((a, b) => b.Id - a.Id));
  createRecords(tableId, lines);
};

