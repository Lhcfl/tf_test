export interface GroupNames {
  basic: Group;
}

export type Group = {
  name: string;
  description: string;
  weight?: number;
}

export type Answer = {
  raw: string;
  /** 选中该答案的分数。 */
  score?: number
}

export type Problem = {
  raw: string;
  ans: Answer[];
  dont_shuffle?: boolean;
  /** 如无，默认single */
  type?: "multi" | "single";
  /** 在某组中的比重 */
  group: { [K in keyof GroupNames]?: number };
  note?: string;
}

export type Data = {
  groups: { [K in keyof GroupNames]: GroupNames[K] } & Record<string, Group>;
  problems: Problem[];
}