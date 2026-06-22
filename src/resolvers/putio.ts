/**
 * Put.io resolver.
 *
 * Put.io API v2: api.put.io/v2. Endpoints:
 *   - POST /transfers/add (url=magnet, save_parent_id=0)
 *   - GET /transfers/{id}                → status + file_id
 *   - GET /files/{id}/download           → 302 redirect to actual URL
 *
 * Put.io does NOT expose an instant-availability endpoint. We mark all
 * candidates as "available" (false) and let the resolve step decide — the
 * pipeline will still try put.io if it's the only enabled resolver, but
 * won't prefer it over RD/AD when their cached checks pass.
 *
 * Auth: Bearer OAuth token.
 */
import type { StreamAccountRow } from "@forge/types";
import type { Resolver, StreamCandidate } from "../types";
import { fetchAuthed, magnetFromHash } from "./base";

const PUTIO_HOST = "https://api.put.io/v2";

type PutioAddResponse = {
  transfer?: { id: number; status?: string; file_id?: number };
};
type PutioTransferResponse = {
  transfer?: { id: number; status: string; file_id?: number };
};

export class PutioResolver implements Resolver {
  readonly provider = "putio";
  readonly accepts = ["torrent"] as const;
  private readonly apiKey: string;

  constructor(private readonly row: StreamAccountRow) {
    this.apiKey = row.api_key ?? "";
  }

  async checkAvailability(
    candidates: StreamCandidate[],
    _signal?: AbortSignal,
  ): Promise<Map<string, boolean>> {
    // No batch cache endpoint — return all false. The pipeline still treats
    // these as candidates; resolve() will run for the user-selected stream.
    const out = new Map<string, boolean>();
    for (const c of candidates) if (c.infoHash) out.set(c.id, false);
    return out;
  }

  // hint currently ignored — Put.io doesn't expose a per-file picker in
  // the v2 transfers flow; the returned file_id is the parent folder if
  // the torrent contains multiple files. Walking /files/{id}/children to
  // pick by S×E is a follow-up; for now Put.io continues to serve the
  // root file as the prior code did.
  async resolve(
    candidate: StreamCandidate,
    signal?: AbortSignal,
    _hint?: import("../types").ResolveHint,
  ): Promise<string | null> {
    if (!this.apiKey || !candidate.infoHash) return null;
    const body = new URLSearchParams({
      url: magnetFromHash(candidate.infoHash),
      save_parent_id: "0",
    });
    const added = await fetchAuthed<PutioAddResponse>(
      `${PUTIO_HOST}/transfers/add`,
      this.apiKey,
      {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
      },
    );
    const id = added?.transfer?.id;
    if (!id) return null;
    let fileId: number | undefined = added.transfer!.file_id;
    if (!fileId) {
      for (let attempt = 0; attempt < 4 && !fileId; attempt++) {
        await new Promise<void>((r) => setTimeout(r, 2000));
        const status = await fetchAuthed<PutioTransferResponse>(
          `${PUTIO_HOST}/transfers/${id}`,
          this.apiKey,
          { signal },
        );
        fileId = status?.transfer?.file_id;
      }
    }
    if (!fileId) return null;
    // The /download endpoint returns a 302; let the caller redirect, but we
    // can also return the canonical signed URL by fetching the Location.
    return `${PUTIO_HOST}/files/${fileId}/download?oauth_token=${encodeURIComponent(this.apiKey)}`;
  }
}
