# 🍼 육아 타이쿤

> 새벽 3시, 아기가 운다. 뭘 원하는지 맞혀라.

붕어빵 타이쿤식 주문-대응 루프를 육아로 옮긴 캐주얼 웹 게임. 모바일 브라우저 우선, 반응형.

<!-- M4에서 플레이 GIF 추가 -->

## 빠른 시작

```bash
nvm use          # Node 22
npm install
npm run dev      # http://localhost:5173
```

폰으로 바로 보려면 `npm run dev -- --host` 후 같은 와이파이에서 표시된 주소로 접속.

## 지금 되는 것 (v0.1 초안)

- 아기가 4가지 요구(배고픔·기저귀·졸림·심심)를 랜덤으로 표현
- 울음 링 게이지가 차오르고, 75% 넘으면 빨갛게 흔들림, 100%면 폭발
- 맞는 행동을 빨리 할수록 코인 많이 획득, 틀리면 울음 급상승
- 육아템 상점 5종 (울음 속도 감소 / 보상 증가)
- 코인·업그레이드 자동 저장

## 문서

| 문서                                       | 내용                                               |
| ------------------------------------------ | -------------------------------------------------- |
| [01 기획서](docs/01-planning.md)           | 컨셉, 코어 루프, 규칙 명세, 화면, MVP 범위, 리스크 |
| [02 WBS](docs/02-wbs.md)                   | 마일스톤 5개, 태스크별 예상 시간, 완료 조건        |
| [03 개발 환경](docs/03-dev-setup.md)       | 명령어, 폴더 구조, 아키텍처 규칙, 배포             |
| [04 밸런스](docs/04-balance.md)            | 수치 근거, 분당 수익 추정, 조정 메모               |
| [05 Git 워크플로](docs/05-git-workflow.md) | 브랜치, 커밋 컨벤션, PR, 태그                      |
| [ADR 0001](docs/adr/0001-react-zustand.md) | 왜 Phaser/Unity 대신 React + Zustand 인가          |

## 스택

Vite · React · TypeScript · Zustand · Vitest · ESLint · Prettier · GitHub Actions · Vercel

## GitHub 초기 세팅

```bash
# 1. 레포 생성 & push (GitHub CLI)
gh repo create baby-tycoon --private --source=. --push

# 2. 라벨 · 마일스톤 · WBS 이슈 25개 일괄 생성
./scripts/bootstrap-github.sh
```
