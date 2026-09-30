# 05. Git 워크플로

혼자 하는 프로젝트라도 **PR 단위로 일하는 습관**이 포트폴리오에서 제일 잘 보인다.

## 브랜치 (GitHub Flow)

```
main ──●────────●────────●──── (항상 배포 가능)
        \      /  \      /
         feat/1.4-combo   fix/1.5-pause-on-hidden
```

- `main` 에 직접 커밋 금지. 모든 작업은 브랜치 → PR → squash merge
- 브랜치 이름: `타입/WBS번호-요약` 예) `feat/1.4-combo`, `fix/2.5-save-migration`, `docs/2.1-balance`

## 커밋 메시지 (Conventional Commits)

```
feat(engine): 연속 성공 콤보 배율 추가 (#12)
fix(loop): 탭 복귀 시 dt 폭주로 울음이 터지는 문제
docs(balance): 분당 수익 추정치 갱신
test(engine): 오답 페널티 상한 케이스
chore(ci): node 캐시 설정
```

| 타입     | 용도                     |
| -------- | ------------------------ |
| feat     | 기능 추가                |
| fix      | 버그 수정                |
| refactor | 동작 변화 없는 구조 개선 |
| test     | 테스트만                 |
| docs     | 문서만                   |
| chore    | 빌드, 설정, 의존성       |
| style    | CSS/포맷만               |

## PR 규칙

- PR 제목 = squash 후 커밋 메시지. 위 컨벤션 그대로
- 본문에 `Closes #이슈번호` 로 이슈 자동 종료
- CI(`npm run check`) 초록불 전 머지 금지
- 템플릿: `.github/pull_request_template.md`

## 태그 & 릴리스

마일스톤 완료 시 태그: `v0.1.0`(M1) → `v0.2.0`(M2) → `v0.3.0`(M3) → `v1.0.0`(M4 출시)

```bash
git tag -a v0.1.0 -m "M1: 코어 루프"
git push origin v0.1.0
```
