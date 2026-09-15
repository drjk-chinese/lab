# 초급중국어읽기 — AI 챕터 학습앱 (L01)

중국어 초급 독해 수업의 AI 챕터용 모바일 우선 학습 웹앱입니다. `단어예습` /
`낭독` / `문법` 3개 탭과 교수자 전용 관리자 화면(콘텐츠 인라인 편집 +
활동현황)으로 구성되어 있습니다. 상세 기획은 프로젝트에 전달된
`claude_code_instructions.md`를 따릅니다.

## 기술 스택

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (디자인 토큰은 `src/index.css`의 `@theme`)
- React Router (클라이언트 라우팅)
- Supabase (Auth / Postgres / Storage) — **연동 전에는 데모 모드로 전체
  기능을 미리볼 수 있습니다.**
- 배포: Vercel

## 로컬 실행

```bash
npm install
npm run dev
```

`http://localhost:5173` 접속 후 학번/비밀번호를 아무 값이나 입력해
로그인하면 됩니다(데모 모드). 로그인 화면의 "관리자 화면 데모로 보기"
버튼으로 관리자 화면도 바로 확인할 수 있습니다.

```bash
npm run build   # 타입체크 + 프로덕션 빌드 (dist/)
npm run lint    # oxlint
npm run preview # 빌드 결과 로컬 미리보기
```

## 데모 모드 vs Supabase 연동 모드

환경변수(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)가 없으면 앱은
자동으로 **데모 모드**로 동작합니다:

- 로그인: 아무 학번/비밀번호로 로그인 가능(로컬 저장, 실제 계정 생성 없음)
- 콘텐츠: `src/data/vocab_L01.json`, `grammar_L01.json`,
  `sentences_L01.json`에서 읽음
- 이벤트 로깅 / 활동현황 / 관리자 콘텐츠 저장: 모두 비활성화(no-op).
  관리자 콘텐츠 편집은 화면에서만 미리보기로 동작하고 새로고침 시
  초기화됩니다.

환경변수를 설정하면 자동으로 **Supabase 연동 모드**로 전환되어 실제
로그인/로깅/콘텐츠 저장/활동현황이 동작합니다.

## Supabase 연동 방법

1. `.env.example`을 `.env`로 복사하고 Supabase 프로젝트의 Project URL /
   Publishable(anon) key를 채워 넣습니다. (Secret key는 클라이언트
   코드에 절대 넣지 않습니다.)
2. Supabase SQL 편집기에서 `supabase/schema.sql`을 실행해 다음 테이블을
   생성합니다.
   - `profiles` (student_id, role: student/admin)
   - `lesson_content` (vocab/grammar/sentences JSON — 관리자 인라인 편집이
     여기로 저장됩니다)
   - `event_logs` (student_id, lesson_id, event_type, target_id, timestamp)
   - `quiz_results` (4번째 탭용으로 테이블 구조만 미리 준비)
   - `student_activity_summary` (관리자 활동현황 표가 참조하는 뷰)
3. `lesson_content`에 초기 데이터를 넣습니다(최초 1회). Supabase
   SQL 편집기에서 `src/data/*.json` 내용을 각각 `vocab` / `grammar` /
   `sentences` kind로 upsert하면 됩니다:
   ```sql
   insert into lesson_content (lesson_id, kind, payload)
   values ('L01', 'vocab', '<vocab_L01.json 내용 붙여넣기>'::jsonb)
   on conflict (lesson_id, kind) do update set payload = excluded.payload;
   -- grammar, sentences도 동일하게 반복
   ```
4. 교수자 계정을 관리자로 승격합니다. 학생은 최초 로그인 시 자동으로
   `profiles` row가 `role='student'`로 생성됩니다(자기 자신을 admin으로
   지정하는 것은 RLS로 막혀 있습니다). 교수자 본인이 한 번 학생으로
   로그인한 뒤, Supabase 대시보드의 `profiles` 테이블에서 해당 row의
   `role`을 `admin`으로 수동 변경하세요.
5. 낭독 탭 음원: ElevenLabs로 생성한 문장별 mp3를 Supabase Storage에
   업로드하고, 해당 공개 URL을 `sentences_L01.json`(또는
   `lesson_content` 테이블의 `sentences` payload)의 각 문장
   `audio_url` 필드에 채워 넣으면 재생 버튼이 활성화됩니다. 앱이 직접
   ElevenLabs API를 호출하지 않으므로 ElevenLabs API 키는 클라이언트에
   필요 없습니다(음원 생성은 별도 오프라인 작업).

## 아직 채워지지 않은 데이터

- **본문 원문**: 전달받은 전체 지문을 4개 섹션 22문장으로 나눠
  `src/data/sentences_L01.json`에 반영했습니다(섹션 경계는 교수자가
  확인해 주신 대로: 1과 "...我想喝可乐"까지 / 2과 "我丈夫的汉语说得很好"~
  "我们感到很奇怪" / 3과 "小姐说：扣肉来了"~"小姐也笑了" / 4과
  "这时候的我"~끝). 병음·한국어 해석은 이번 구현에서 새로 작성한
  것이므로 교수자 검수를 권장합니다.
- **ElevenLabs 음원**: 아직 생성되지 않아 모든 문장의 `audio_url`이
  `null`이고, 재생 버튼은 "음원 준비중" 상태로 비활성화되어 있습니다.
  음원을 준비하시면 위 "Supabase 연동 방법" 5번대로 채워 넣으세요.
- **디자인 시안**: `design_preview.html`, `all_screens.html`은 이번
  업로드에 포함되어 있지 않아 지시문의 디자인 토큰(색상/폰트/레이아웃
  원칙)만으로 구현했습니다. 시안이 있다면 공유해 주시면 세부 스타일을
  맞출 수 있습니다.

## 이번 범위에서 제외 (지시문 기준)

- 종합 이해도 퀴즈 탭(4번째 탭) — `quiz_results` 테이블 구조만 준비됨
- 메타인지 자기주도 QNA
- 본문 이미지(핵심장면 삽화)
- HSK급수별 예문 자동생성 기능

## Vercel 배포

1. 이 저장소를 Vercel 프로젝트로 연결합니다(Framework Preset: Vite).
2. Vercel 프로젝트 환경변수에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_PLATO_SUBMIT_URL`을 설정합니다.
3. Build Command: `npm run build`, Output Directory: `dist` (Vite 프리셋
   기본값).

## 디렉터리 구조

```
src/
  data/            vocab_L01.json, grammar_L01.json, sentences_L01.json
  lib/             supabaseClient, dataSource(Supabase↔로컬 JSON), logging,
                    tokenize(본문 글로서리 토크나이저), quiz(자가퀴즈 생성), tts
  contexts/        AuthContext (Supabase Auth + 데모 모드 폴백)
  hooks/           useSessionState (세션/지문 한정 저장용)
  components/      BottomTabBar, AppHeader, WordBottomSheet
  pages/
    LoginPage.tsx
    VocabTab/      단어예습 탭 (본문+글로서리 → 체크 → 플래시카드 → 자가퀴즈 → 오답 재학습)
    ReadingTab/     낭독 탭 (문장카드, 전체듣기, 녹음, 문법 칩)
    GrammarTab/     문법 탭 (5개 문형 카드, role별 색상)
    Admin/          관리자: 콘텐츠 인라인 편집 + 활동현황
supabase/
  schema.sql        profiles / lesson_content / event_logs / quiz_results / 활동현황 뷰
```
