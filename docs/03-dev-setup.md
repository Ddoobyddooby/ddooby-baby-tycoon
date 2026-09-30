# 03. 개발 환경 & 아키텍처

## 요구 사항

- Node.js 22 (`.nvmrc` 참고, `nvm use`)
- VS Code 권장 확장: ESLint, Prettier, Vitest (`.vscode/extensions.json`)

## 명령어

| 명령                              | 설명                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `npm install`                     | 의존성 설치                                                                            |
| `npm run dev`                     | 개발 서버 (http://localhost:5173, 같은 와이파이 폰으로 보려면 `npm run dev -- --host`) |
| `npm test`                        | 단위 테스트 1회 실행                                                                   |
| `npm run test:watch`              | 테스트 감시 모드                                                                       |
| `npm run lint` / `npm run format` | 린트 / 포맷                                                                            |
| `npm run check`                   | **PR 전 필수**: lint → typecheck → test → build (CI와 동일)                            |

## 스택

| 영역   | 선택                | 이유                                                         |
| ------ | ------------------- | ------------------------------------------------------------ |
| 빌드   | Vite                | 설정 거의 없음, HMR 빠름                                     |
| UI     | React + TypeScript  | 이미 아는 도구로 재미 검증에 집중                            |
| 상태   | Zustand (+ persist) | 보일러플레이트 최소, 루프에서 `getState()` 로 직접 접근 가능 |
| 테스트 | Vitest              | Vite 설정 공유                                               |
| 배포   | Vercel              | Git push = 배포, PR마다 프리뷰 URL                           |

선택 근거는 `docs/adr/0001-react-zustand.md`.

## 폴더 구조

```
src/
├── game/            ← 순수 로직. React 몰라도 됨
│   ├── balance.ts   ← 모든 수치 (밸런싱은 여기만 고친다)
│   ├── engine.ts    ← tick / resolve / buy 순수 함수
│   ├── engine.test.ts
│   └── loop.ts      ← requestAnimationFrame 루프
├── store/
│   └── gameStore.ts ← 엔진을 감싸는 Zustand 스토어 + 저장
├── components/      ← 화면. 스토어만 읽고 액션만 호출
│   ├── Hud.tsx
│   ├── Crib.tsx
│   ├── ActionBar.tsx
│   └── Shop.tsx
└── styles/global.css ← 디자인 토큰 + 스타일
```

## 아키텍처 규칙

```
components  ──읽기/액션──▶  store  ──호출──▶  game/engine (순수 함수)
                              ▲
             game/loop ──tick─┘
```

1. **게임 규칙은 `game/engine.ts` 에만** 쓴다. 컴포넌트에 `if (cry > 75)` 같은 규칙이 생기면 엔진으로 옮긴다 (단, 표시용 판단은 예외)
2. 엔진 함수는 **입력 상태 → 새 상태**. 기존 객체를 수정하지 않는다
3. 랜덤은 `rng` 인자로 주입해서 테스트에서 고정한다
4. 새 규칙을 넣으면 **테스트를 먼저** 쓴다 (엔진은 테스트가 쉬운 구조라 TDD가 제일 빠르다)
5. 컴포넌트는 필요한 값만 selector 로 구독한다: `useGame((s) => s.coins)`. 스토어 통째로 구독 금지 (매 프레임 전체 리렌더)

## 배포 (Vercel)

1. vercel.com → Add New Project → GitHub 레포 선택
2. Framework Preset: **Vite** (자동 감지), 나머지 기본값
3. 이후 `main` push = 프로덕션, PR = 프리뷰 URL 자동 생성
