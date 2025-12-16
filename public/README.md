# 이미지 파일 설정 안내

이 폴더에 다음 이미지 파일을 저장해주세요:

## 1. logo.png
- **파일명**: `logo.png`
- **설명**: 가로 로고 이미지 (NexGen NEXT GENERATION)
- **권장 크기**: 높이 80-120px (너비 자동)
- **형식**: PNG (투명 배경 권장)

## 2. favicon.png
- **파일명**: `favicon.png`
- **설명**: 파비콘 아이콘 (X 모양)
- **권장 크기**: 512x512px 또는 256x256px
- **형식**: PNG

## 저장 방법

1. 첨부된 이미지 2개를 다운로드
2. 첫 번째 가로 이미지를 `logo.png`로 저장
3. 두 번째 아이콘 이미지를 `favicon.png`로 저장
4. 이 폴더(`public/`)에 복사

## 파일 구조

```
public/
├── logo.png          ← 가로 로고
├── favicon.png       ← 파비콘
└── README.md         ← 이 파일
```

이미지 저장 후 프로젝트를 다시 빌드하고 배포하세요:

```bash
npm run build
firebase deploy
```


