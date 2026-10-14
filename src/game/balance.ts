/**
 * 게임의 모든 수치는 이 파일에만 둔다.
 * 밸런싱은 docs/04-balance.md 의 표와 함께 수정할 것.
 */

export const NEEDS = ["hungry", "diaper", "sleepy", "bored"] as const;
export type Need = (typeof NEEDS)[number];

export interface NeedMeta {
  label: string;
  icon: string;
  /** 준비 슬롯에서 시작하는 준비 동작 (행동 버튼 이름) */
  action: string;
  /** 준비 시간을 넘겨 망쳤을 때의 문구 (붕어빵이 타는 것에 해당) */
  spoiled: string;
}

export const NEED_META: Record<Need, NeedMeta> = {
  hungry: { label: "배고파요", icon: "🍼", action: "분유 데우기", spoiled: "너무 뜨거워요" },
  diaper: { label: "기저귀", icon: "🧷", action: "물티슈 데우기", spoiled: "물티슈가 말랐어요" },
  sleepy: { label: "졸려요", icon: "😴", action: "자장가 틀기", spoiled: "노래가 끝났어요" },
  bored: { label: "심심해요", icon: "🧸", action: "비눗방울 불기", spoiled: "비눗방울이 터졌어요" },
};

export const BALANCE = {
  /** 하루의 길이(초). 끝나면 정산 화면 */
  dayLength: 60,
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
  /** 콤보 1단계당 보상 배율에 더해지는 값 */
  comboBonusPerStep: 0.1,
  /** 보너스가 붙는 최대 콤보 수 (이 이상은 보너스가 늘지 않는다) */
  comboMax: 5,
  /** 준비 슬롯 수 (붕어빵 틀에 해당) */
  slotCount: 3,
  /** 준비 시작 후 '딱 좋아요'가 되기까지 걸리는 시간(초). 이전에 꺼내면 덜 된 것 */
  prepReadyAt: 2.5,
  /** 준비 시작 후 망쳐 버리는 시간(초). 이후에 꺼내면 망친 것 */
  prepSpoilAt: 6,
  /** 준비를 시작할 때 반짝 아이템(황금붕어빵)이 될 확률 */
  goldenChance: 0.08,
  /** 반짝 아이템의 보상 배율 */
  goldenMultiplier: 2,
  /** 부모 체력(생명 게이지). 매일 가득 찬 채로 시작하고 0 이 되면 그날은 끝 */
  maxHp: 100,
  /** 덜 되거나 망친 걸 꺼냈을 때 잃는 체력 */
  badServeHp: 10,
  /** 울음 폭발 때 잃는 체력 */
  meltdownHp: 20,
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
