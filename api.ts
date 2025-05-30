import { PassThrough } from "stream";

const getToken = () => process?.env?.NOCODB_TOKEN ?? "";
const getApiUrl = () => `${process?.env?.NOCODB_HOST ?? ""}${process?.env?.NOCODB_API_BASE ?? ""}`;

type ListingResponse<T> = {
  list: Array<T>;
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
    isFirstPage: boolean;
    isLastPage: boolean;
  };
};

type EntityId = {
  Id: number;
}

type EntityMeta = {
  CreatedAt: string;
  UpdatedAt: string | null;
}

export type EvRecord = {
  availability: string;
  model: string;
  starting_price: number | null;
  driving_range_km: number | null;
  battery_size_kwh: number | null;
};

export type PersistedEvRecord = EntityId & EntityMeta & EvRecord;

const handleHttpError = async (response: Response) => {
  if (!response.ok) {
    const r = response.clone();
    throw { statusCode: response.status, statusText: response.statusText, message: await r.text() };
  }
};

const callApi = (url: string, method: string = "GET", additionalHeaders: Record<string, string | string[]> = {}, body: any | undefined = undefined) => {
  const headers = {
    ...{
      "Content-Type": "application/json",
      "xc-token": getToken()
    },
    ...additionalHeaders
  }
  const options = {
    method,
    headers,
    ...typeof (body) !== "undefined" && { body: JSON.stringify(body) }
  };
  return fetch(`${getApiUrl()}${url}`, options);
};

const listPaginatedRecords = async (tableId: string, offset: number = 0, limit: number = 50): Promise<ListingResponse<PersistedEvRecord>> => {
  const response = await callApi(`/tables/${tableId}/records?offset=${offset}&limit=${limit}`);
  handleHttpError(response);
  const json: ListingResponse<PersistedEvRecord> = await response.json();
  return json;
};

export const listRecords = async (tableId: string, pageSize: number = 50): Promise<Array<PersistedEvRecord>> => {
  let isLastPage = false;
  let offset = 0;
  let responses = [];
  while (!isLastPage) {
    const json = await listPaginatedRecords(tableId, offset, pageSize);
    isLastPage = json.pageInfo.isLastPage;
    offset += pageSize;
    responses.push(json.list)
  }
  return responses.flat() as Array<PersistedEvRecord>;
};

export const deleteRecords = async (tableId: string, records: Array<EntityId>): Promise<Array<EntityId>> => {
  const response = await callApi(`/tables/${tableId}/records`, "DELETE", {}, records);
  handleHttpError(response);
  const json: Array<EntityId> = await response.json();
  return json;
};

export const deleteRecord = async (tableId: string, id: Number): Promise<number> => {
  const response = await callApi(`/tables/${tableId}/records`, "DELETE", {}, { Id: id });
  handleHttpError(response);
  const json: EntityId = await response.json();
  return json.Id;
};

export const createRecords = async (tableId: string, records: Array<EvRecord>): Promise<Array<EntityId>> => {
  const response = await callApi(`/tables/${tableId}/records`, "POST", {}, records);
  handleHttpError(response);
  const json: Array<EntityId> = await response.json();
  return json;
};
