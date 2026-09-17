# Portfolio

백엔드 · AI 개발자 포트폴리오 — 정적 사이트(GitHub Pages).

**8개 프로젝트의 설계 판단 · 실측값 · 한계**를 프로젝트별 상세 페이지로 정리했습니다.

## 구성

```
index.html              랜딩 — 프로젝트 카드 · 일하는 방식 · 기술 스택 · 공개 모델
p/emour.html            01 Emour — 커플 대화 감정 분석 메신저
p/pixg.html             02 PixG — AI 픽셀 스프라이트 시트 생성기 (최우수상)
p/blind-dating.html     03 Blind Dating — 성향 기반 블라인드 소개팅
p/dream-shaper.html     04 Dream Shaper — AI 음성 커버 생성 서비스
p/yolo-app.html         05 엄마 이게뭐야 — YOLOv8 실시간 객체 탐지 앱
p/nestjs-sns.html       06 SNS Clone — NestJS 백엔드
p/lol-winrate.html      07 LoL 승률 예측 시스템
p/hlauncher.html        08 H런처 — StarCraft 안티치트 런처 (진행 중)
assets/css/style.css    공용 스타일 (다크 테마 · 반응형)
assets/img/             이미지 · GIF 35개
assets/video/           Emour 시연 영상 (mp4)
```

빌드 도구 없이 **HTML + CSS 만으로** 되어 있습니다. 파일을 고치고 push 하면 그대로 반영됩니다.

## GitHub Pages 켜기

```
Settings → Pages
  Source  : Deploy from a branch
  Branch  : main  /  (root)
  → Save
```

1~2분 뒤 `https://<username>.github.io/<repo>/` 로 열립니다.

> `.nojekyll` 파일이 있어야 Jekyll 처리를 건너뜁니다. 이미 포함돼 있습니다.

## 로컬에서 확인

```bash
python -m http.server 8000
# → http://localhost:8000
```

## 이 포트폴리오의 원칙

> **모든 수치는 코드·로그·체크포인트에서 직접 확인한 실측값입니다.**
> 확인되지 않는 항목은 적지 않았고, 측정하지 않은 것은 「측정하지 않았다」 로 남겼습니다.

각 프로젝트 페이지에는 성과뿐 아니라 **알려진 한계**를 함께 적었습니다.
