# 유화페인팅 프로젝트 요약 (ChromaFlow Workflow Manager)

## 📋 프로젝트 개요

**프로젝트 명**: ChromaFlow Workflow Manager  
**목적**: 도장 공정 워크플로우 관리 시스템  
**기술 스택**: React 19 + TypeScript + Vite + Firebase  
**프로젝트 버전**: 0.0.0

### 주요 기능
- 제품 아이템의 도장 공정 단계별 상태 관리
- CSV 파일 Import/Export를 통한 데이터 관리
- 작업장(Shop) 별 작업 분류 및 추적
- 실시간 대시보드 통계
- Google 인증 기반 관리자/읽기 전용 권한 관리

---

## 🏗️ 프로젝트 구조

```
yuhwapainting/
├── App.tsx                    # 메인 애플리케이션 컴포넌트
├── index.tsx                  # 엔트리 포인트
├── firebase.ts                # Firebase 설정 및 초기화
├── types.ts                   # TypeScript 타입 정의
├── constants.tsx              # 상수 및 워크플로우 시퀀스 정의
├── components/                # React 컴포넌트
│   ├── Dashboard.tsx          # 통계 대시보드
│   ├── DataGrid.tsx           # 제품 목록 테이블
│   ├── ActionBar.tsx          # 선택된 아이템 액션바
│   ├── RibbonFilter.tsx       # 필터 및 검색 리본 UI
│   ├── Modal.tsx              # 재사용 가능한 모달 컴포넌트
│   └── ShopSelectModal.tsx    # 작업장 선택 모달
├── services/
│   └── workflowService.ts     # 데이터 처리 로직 (CSV 파싱, localStorage)
├── public/                    # 정적 파일
├── dist/                      # 빌드 결과물
├── vite.config.ts             # Vite 설정
├── tsconfig.json              # TypeScript 설정
└── package.json               # 프로젝트 의존성
```

---

## 🔧 기술 스택 상세

### 프론트엔드
- **React 19.2.3**: 최신 React 버전
- **TypeScript 5.8.2**: 타입 안정성 보장
- **Vite 6.2.0**: 빠른 개발 환경 및 빌드

### UI 라이브러리
- **lucide-react 0.561.0**: 아이콘 라이브러리
- **Tailwind CSS**: 유틸리티 기반 스타일링 (코드에서 확인)

### 백엔드/인프라
- **Firebase 12.6.0**: 
  - Firebase Authentication (Google OAuth)
  - Firestore Database (설정되어 있으나 현재는 localStorage 사용)

### 데이터 저장
- **localStorage**: 현재 데이터는 클라이언트 측에 저장 (향후 Firestore 전환 가능)

---

## 📊 데이터 모델

### WorkflowStatus (워크플로우 상태)
공정의 8단계 진행 상태:
1. **Unreceived** - 미수령
2. **Received (Inbound)** - 입고됨
3. **Blasting** - 블라스팅 작업
4. **Shop Sorting** - 작업장 분류
5. **Painting** - 도장 작업
6. **Packing** - 포장
7. **Awaiting Shipment** - 출하 대기
8. **Shipped** - 출하 완료

### ShopLocation (작업장 위치)
- **None** - 미할당
- **Shop A ~ E**: 5개 작업장

### ProductItem (제품 아이템)
```typescript
interface ProductItem {
  id: string;           // 제품 번호 (NO.)
  item: string;         // 품목명
  assembly: string;     // 조립 정보
  description: string;  // 상세 설명
  material: string;     // 재질 (Steel, Alum 등)
  length: number;       // 길이 (mm)
  qty: number;          // 수량
  weight: number;       // 무게 (kg)
  area: number;         // 면적 (m²)
  fp: string;           // FP 구분
  status: WorkflowStatus;  // 현재 공정 단계
  shop: ShopLocation;      // 할당된 작업장
  updatedAt: string;       // 최종 수정일시
}
```

---

## 🎯 핵심 기능 상세

### 1. 인증 시스템
- **Google OAuth 로그인**
- **관리자 계정**: `aiRIAdVAKpO43zmynBX0T5C5PA02`
- 관리자만 데이터 수정 가능, 일반 사용자는 읽기 전용

### 2. CSV 데이터 관리
- **Import**: CSV 파일 업로드로 제품 목록 일괄 등록
  - BOM (Byte Order Mark) 처리
  - 따옴표로 감싸진 필드 내 쉼표 처리
  - 다양한 줄바꿈 형식 지원 (CRLF, LF, CR)
- **Export**: 현재 데이터를 CSV로 다운로드
- **기본 컬럼**: NO., ITEM, ASSEMBLY, DESCRIPTION, MATERIAL, LENGTH, Q'TY, WEIGHT, Area, FP

### 3. 필터링 및 검색
- **검색**: ID, 품목명, 설명으로 검색
- **상태 필터**: 워크플로우 단계별 필터링
- **품목 필터**: 품목 타입별 필터링
- **작업장 필터**: Shop A~E 별 필터링
- **보기 전환**: Active Workflow ↔ Shipped Archive

### 4. 워크플로우 관리
- **Complete Step**: 선택한 아이템을 다음 단계로 진행
- **Shop Sorting → Painting 전환 시**: 작업장 선택 모달 표시
- **Force Status Update**: 특정 상태로 직접 변경 (관리자용)
- **Assign Shop**: 특정 작업장 직접 할당

### 5. 대시보드 통계
실시간으로 각 단계별 아이템 수와 비율 표시:
- Inbound (입고)
- Blasting (블라스팅)
- Painting (도장)
- Packing (포장)
- Waiting (출하대기)
- Shipped (출하완료)

### 6. 데이터 그리드
- **정렬 기능**: Status, Item/Desc, ID 기준 정렬 (오름차순/내림차순)
- **체크박스 선택**: 개별 선택 및 전체 선택
- **기술 스펙 표시**: 재질, 치수, 수량, 무게, 면적 등
- **업데이트 시간**: 마지막 수정 시각 표시

### 7. 액션바
선택된 아이템이 있을 때 하단에 나타남:
- 선택된 아이템 수 표시
- **Complete Step**: 다음 단계로 진행
- **Exceptions / Jump**: 예외 처리 및 단계 건너뛰기
- **Delete**: 선택 아이템 삭제
- **Clear**: 선택 해제

---

## 🎨 UI/UX 특징

### 디자인 시스템
- **컬러 스킴**: 
  - Brand Color: 브랜드 색상 (brand-600 등)
  - 단계별 색상: 각 워크플로우 단계마다 고유 색상
  - 시맨틱 컬러: 성공(emerald), 경고(amber), 위험(red)
  
### 반응형 디자인
- Mobile-first 접근
- Grid 레이아웃 (2/3/6 columns)
- 스크롤 가능한 데이터 테이블

### 인터랙션
- Hover 효과
- 애니메이션 (fade-in, zoom-in, slide-in)
- 모달 오버레이 with backdrop blur
- 로딩 상태 표시

### 아이콘 시스템 (lucide-react)
각 워크플로우 단계별 직관적인 아이콘:
- Circle: Unreceived
- ArrowRightCircle: Received
- SprayCan: Blasting
- LayoutGrid: Shop Sorting
- Palette: Painting
- Package: Packing
- Archive: Awaiting Shipment
- Truck: Shipped

---

## 🔐 Firebase 설정

```
Project ID: yuhwapainting
Auth Domain: yuhwapainting.firebaseapp.com
Storage Bucket: yuhwapainting.firebasestorage.app
```

### 사용 중인 Firebase 서비스
1. **Authentication**: Google 로그인
2. **Firestore**: 설정되어 있으나 아직 미사용 (향후 확장)

---

## 📦 데이터 저장 방식

### 현재: localStorage
- **Storage Key**: `chromaflow_db_v3`
- 클라이언트 측 저장으로 빠른 응답
- 브라우저별 독립적 데이터

### 향후: Firestore (마이그레이션 가능)
- `workflowService.ts`에서 localStorage 호출을 Firestore 쿼리로 교체
- 다중 사용자 동기화 가능
- 실시간 업데이트 가능

---

## 🚀 실행 방법

### 개발 서버 실행
```bash
npm install
npm run dev
```
- 포트: 3000
- 주소: http://localhost:3000

### 프로덕션 빌드
```bash
npm run build
npm run preview
```

---

## 🔄 주요 워크플로우

### 1. 초기 데이터 로딩
```
App 마운트 → loadItems() → localStorage 체크 
→ 데이터 있으면 로드 / 없으면 MOCK_CSV_DATA 사용
```

### 2. CSV Import 플로우
```
사용자 파일 선택 → FileReader로 읽기 → parseCSV() 
→ 기존 데이터 있으면 확인 모달 → 데이터 교체 → localStorage 저장
```

### 3. 아이템 진행 플로우
```
사용자가 아이템 선택 → Complete Step 클릭 
→ Blasting/Shop Sorting이면 Shop 선택 모달 표시
→ executeAdvance() → 다음 status로 변경 → localStorage 저장
```

### 4. 필터링 플로우
```
사용자 필터 변경 → filteredItems useMemo 재계산 
→ sortedItems useMemo 재계산 → 그리드 렌더링
```

---

## 📈 성능 최적화

### useMemo 활용
- `uniqueItemTypes`: 품목 타입 목록
- `filteredItems`: 필터링된 아이템 목록
- `sortedItems`: 정렬된 최종 목록
- `stats`: 대시보드 통계

### useRef 활용
- `fileInputRef`: 숨겨진 파일 input 참조

### useState 최적화
- Set 자료구조 사용 (`selectedIds`)으로 O(1) 조회

---

## 🎯 향후 개선 방향

### 1. Firestore 마이그레이션
- localStorage → Firestore로 데이터 저장소 변경
- 실시간 동기화 구현
- 다중 사용자 동시 작업 지원

### 2. 권한 관리 강화
- 역할 기반 접근 제어 (RBAC)
- Shop별 권한 분리

### 3. 히스토리 추적
- 상태 변경 로그
- 작업자별 변경 이력

### 4. 알림 시스템
- 공정 완료 알림
- 지연 작업 경고

### 5. 데이터 분석
- 공정별 소요 시간 분석
- 작업장별 생산성 리포트
- 차트 및 시각화

### 6. 모바일 앱
- PWA (Progressive Web App) 전환
- 오프라인 지원

---

## 🐛 알려진 제약사항

1. **localStorage 한계**
   - 브라우저별 독립적 (동기화 안됨)
   - 용량 제한 (5-10MB)
   - 서버 백업 없음

2. **CSV Import**
   - 컬럼 순서가 고정되어 있음
   - 대용량 파일 처리 시 브라우저 멈춤 가능

3. **권한 관리**
   - 관리자 UID가 코드에 하드코딩됨
   - 세밀한 권한 제어 부족

---

## 📝 코드 품질

### TypeScript 활용
- 엄격한 타입 체크
- Interface 및 Enum 활용
- Type Safety 보장

### 컴포넌트 설계
- 재사용 가능한 컴포넌트 구조
- Props Interface 명확히 정의
- 관심사 분리 (UI / 비즈니스 로직)

### 서비스 레이어
- `workflowService.ts`로 비즈니스 로직 분리
- 순수 함수 중심 설계
- 테스트 가능한 구조

---

## 🌟 프로젝트의 강점

1. **직관적인 UX**: 도장 공정에 최적화된 워크플로우
2. **빠른 응답성**: 클라이언트 측 데이터 처리
3. **CSV 호환성**: 기존 엑셀 데이터와 연동 가능
4. **확장 가능한 구조**: Firestore 마이그레이션 준비됨
5. **현대적 기술**: 최신 React, TypeScript, Vite 사용
6. **깔끔한 디자인**: Tailwind CSS 기반 일관된 디자인 시스템

---

## 📞 연락처 및 배포

### Firebase 호스팅 정보
- Project: yuhwapainting
- Hosting URL: (설정 필요)

### Google AI Studio
- App URL: https://ai.studio/apps/drive/1Pg96vMYPqhmPyT1Q2qNHmUFRUJL3tA_S

---

## 📚 의존성 상세

### Production Dependencies
```json
{
  "firebase": "^12.6.0",        // Firebase SDK
  "lucide-react": "^0.561.0",   // 아이콘 라이브러리
  "react": "^19.2.3",           // React 프레임워크
  "react-dom": "^19.2.3"        // React DOM 렌더러
}
```

### Development Dependencies
```json
{
  "@types/node": "^22.14.0",           // Node.js 타입 정의
  "@vitejs/plugin-react": "^5.0.0",    // Vite React 플러그인
  "typescript": "~5.8.2",              // TypeScript 컴파일러
  "vite": "^6.2.0"                     // 빌드 도구
}
```

---

## 🔍 주요 파일 설명

### App.tsx (500줄)
- 애플리케이션의 메인 컨트롤러
- 상태 관리 (items, filters, sorting, modals)
- 인증 로직 (Google OAuth)
- 핸들러 함수 (import, export, advance, delete 등)

### types.ts (47줄)
- WorkflowStatus enum
- ShopLocation enum
- ProductItem interface
- DashboardStats interface

### constants.tsx (55줄)
- WORKFLOW_SEQUENCE: 공정 순서 배열
- STATUS_COLORS: 상태별 색상 매핑
- STATUS_ICONS: 상태별 아이콘 매핑
- MOCK_CSV_DATA: 테스트용 샘플 데이터

### workflowService.ts (142줄)
- parseCSV: CSV 파싱 로직 (BOM, 따옴표 처리)
- loadItems / saveItems: localStorage 연동
- calculateStats: 대시보드 통계 계산
- getNextStatus: 다음 워크플로우 단계 반환

---

## 💡 설계 패턴

### 1. Container/Presentation Pattern
- App.tsx: 로직과 상태 관리 (Container)
- components/: UI 렌더링 (Presentation)

### 2. Service Layer Pattern
- workflowService.ts: 비즈니스 로직 분리

### 3. Custom Hooks (잠재적 개선)
- 현재는 App.tsx에 모든 로직
- 향후 useWorkflow, useAuth 등으로 분리 가능

---

## 🎓 학습 포인트

이 프로젝트는 다음을 학습하기에 좋은 예제입니다:

1. **React 19 최신 기능**: useState, useEffect, useMemo, useRef
2. **TypeScript**: 실전 타입 정의 및 활용
3. **Firebase**: Authentication, Firestore 설정
4. **Vite**: 현대적 빌드 도구 사용
5. **상태 관리**: 복잡한 필터링, 정렬, 선택 로직
6. **CSV 파싱**: 실전 데이터 처리
7. **UI/UX**: Tailwind CSS를 활용한 모던 디자인

---

## 📋 체크리스트 (운영 전 확인사항)

- [ ] Firebase 프로젝트 설정 완료
- [ ] 관리자 계정 설정 (ADMIN_UID 변경)
- [ ] 프로덕션 환경 변수 설정
- [ ] Firestore 보안 규칙 설정
- [ ] 백업 전략 수립
- [ ] 사용자 매뉴얼 작성
- [ ] 성능 테스트 (대용량 데이터)
- [ ] 크로스 브라우저 테스트

---

**문서 작성일**: 2025-12-15  
**프로젝트 버전**: 0.0.0  
**작성자**: AI Assistant


