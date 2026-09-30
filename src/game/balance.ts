/**
 * 게임의 모든 수치는 이 파일에만 둔다.
 * 밸런싱은 docs/04-balance.md 의 표와 함께 수정할 것.
 */

export const NEEDS = ["hungry", "diaper", "sleepy", "bored"] as const;
export type Need = (typeof NEEDS)[number];

export const NEED_META: Record<Need, { label: string; icon: string; action: string }> = {
  hungry: { label: "배고파요", icon: "🍼", action: "분유 주기" },
  diaper: { label: "기저귀", icon: "🧷", action: "기저귀 갈기" },
  sleepy: { label: "졸려요", icon: "😴", action: "재우기" },
  bored: { label: "심심해요", icon: "🧸", action: "놀아주기" },
};

export const BALANCE = {
  /** 요구가 없을 때 새 요구가 생기는 초당 발생률 (포아송 λ) */
  needRatePerSec: 0.5,
  /** 요구가 있을 때 울음 게이지(0~100)가 초당 차오르는 양 */
  baseCrySpeed: 14,
  /** 잘못된 대응을 하면 즉시 오르는 울음 */
  wrongActionCry: 10,
  /** 울음이 100에 닿았을 때 잃는 코인 */
  meltdownPenalty: 5,
  /** 해결 시 기본 보상. 빨리 해결할수록 보상이 크다 */
  baseReward: 10,
  /** 울음 100 직전에 해결해도 받는 최소 보상 비율 */
  minRewardRatio: 0.3,
  /** 프레임이 길게 끊겼을 때(탭 전환 등) 한 번에 처리할 최대 dt */
  maxDt: 0.25,
} as const;

export type UpgradeId = "bottleWarmer" | "diaperStacker" | "mobile" | "rattle" | "lullaby";

export interface UpgradeDef {
  name: string;
  desc: string;
  icon: string;
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
  /** 대상 요구의 울음 속도를 레벨당 줄이는 비율 */
  crySlow?: { need: Need; perLevel: number };
  /** 모든 보상에 레벨당 더해지는 배율 */
  rewardBonusPerLevel?: number;
}

export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  bottleWarmer: {
    name: "젖병 워머",
    desc: "배고파서 우는 속도가 느려져요",
    icon: "🍼",
    baseCost: 30,
    costGrowth: 1.6,
    maxLevel: 5,
    crySlow: { need: "hungry", perLevel: 0.12 },
  },
  diaperStacker: {
    name: "기저귀 스태커",
    desc: "기저귀 때문에 우는 속도가 느려져요",
    icon: "🧷",
    baseCost: 30,
    costGrowth: 1.6,
    maxLevel: 5,
    crySlow: { need: "diaper", perLevel: 0.12 },
  },
  mobile: {
    name: "회전 모빌",
    desc: "졸려서 우는 속도가 느려져요",
    icon: "🌙",
    baseCost: 30,
    costGrowth: 1.6,
    maxLevel: 5,
    crySlow: { need: "sleepy", perLevel: 0.12 },
  },
  rattle: {
    name: "딸랑이",
    desc: "심심해서 우는 속도가 느려져요",
    icon: "🪇",
    baseCost: 30,
    costGrowth: 1.6,
    maxLevel: 5,
    crySlow: { need: "bored", perLevel: 0.12 },
  },
  lullaby: {
    name: "자장가 스피커",
    desc: "모든 보상이 늘어나요",
    icon: "🎵",
    baseCost: 80,
    costGrowth: 2.0,
    maxLevel: 5,
    rewardBonusPerLevel: 0.2,
  },
};

export const UPGRADE_IDS = Object.keys(UPGRADES) as UpgradeId[];
