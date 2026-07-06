/**
 * raceCommandHandoff — Builds handoff URLs from 13 (UI Command Center)
 * to 15 (Race Command Center) via query params.
 *
 * Flow: 13 opens a new tab → 15 parses query params → creates session
 * if no existing session in localStorage.
 *
 * This is a ONE-WAY handoff. 15 never calls back to 13.
 */

export interface RaceCommandHandoffParams {
  /** Target route on 15, e.g. "pitwall", "launch", "copilot". */
  route: string;
  /** Origin identifier. Default: "13-gateway". */
  source?: string;
  /** Bike node ID. Default: "demo-ruben". */
  node?: string;
  /** Bike identifier. Default: "yamaha-r1". */
  bike?: string;
  /** Circuit ID. Default: "mugello". */
  circuit?: string;
  /** Session mode. Default: "preview". */
  mode?: string;
  /** Optional access token for future auth bridge. */
  accessToken?: string;
}

/**
 * Build a full handoff URL pointing to a 15-race-command-center route.
 *
 * @param baseUrl — The 15 base URL (e.g. "https://czdpamk9.insforge.site")
 * @param params  — Handoff parameters
 * @returns Fully qualified URL with query params
 */
export function buildRaceCommandHandoffUrl(
  baseUrl: string,
  params: RaceCommandHandoffParams,
): string {
  const url = new URL(`/${params.route}`, baseUrl);
  url.searchParams.set("handoff", "preview");
  url.searchParams.set("source", params.source ?? "13-gateway");
  url.searchParams.set("node", params.node ?? "demo-ruben");
  url.searchParams.set("bike", params.bike ?? "yamaha-r1");
  url.searchParams.set("circuit", params.circuit ?? "mugello");
  url.searchParams.set("mode", params.mode ?? "preview");
  if (params.accessToken) {
    url.searchParams.set("access_token", params.accessToken);
  }
  return url.toString();
}
