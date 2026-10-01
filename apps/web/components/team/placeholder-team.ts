// TODO: replace with the real team type from @dsc-hunt/types once the data
// model lands. This shape only exists so the rough-in UI has something to render.
export interface PlaceholderTeam {
  name: string;
  code: string;
  members: string[];
}

export const PLACEHOLDER_TEAM: PlaceholderTeam = {
  name: "The Pumpkin Patch",
  code: "31031",
  members: ["You", "Teammate Two", "Teammate Three"],
};
