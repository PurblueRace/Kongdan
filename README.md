# 콩단 (KongDan) - 패턴 영어 학습 앱 📚

하루 4개의 영어 패턴과 20개의 문장을 학습하는 웹 애플리케이션입니다.
GitHub Pages를 통해 정적 웹사이트로 배포되어 언제 어디서나 학습할 수 있습니다.

## 🌟 주요 기능

- **Day별 학습**: 총 20일 과정, 하루 4개 패턴 학습
- **주요 단어 학습**: 각 문장에서 추출한 핵심 단어 20개 미리 학습
- **음성 듣기 (TTS)**: 원어민 발음으로 문장 및 단어 듣기 지원
- **음성 인식 시험**: 마이크를 통해 직접 말하며 시험 보기 (Chrome 권장)
- **복습 시스템**: 틀린 문제와 즐겨찾기한 문장 복습
- **Day 잠금 해제**: 이전 Day 시험을 100% 통과해야 다음 Day 해금

## 🚀 GitHub Pages 배포 방법

이 프로젝트는 GitHub Pages를 통해 무료로 배포할 수 있습니다.

1. **GitHub 저장소 생성**
   - GitHub에 로그인 후 `New repository` 클릭
   - 저장소 이름 입력 (예: `kongdan-english`)
   - `Public` 선택 후 `Create repository`

2. **파일 업로드**
   - 생성된 저장소에 이 폴더의 모든 파일을 업로드합니다.
   - (Git 사용 시)
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin [저장소 URL]
     git push -u origin main
     ```

3. **GitHub Pages 설정**
   - 저장소의 **Settings** 탭 클릭
   - 좌측 메뉴에서 **Pages** 클릭
   - **Build and deployment** 섹션의 **Source**를 `Deploy from a branch`로 선택
   - **Branch**를 `main`, 폴더를 `/docs`로 설정 후 **Save**
   - (중요: 반드시 `/docs` 폴더를 선택해야 합니다!)

4. **배포 확인**
   - 잠시 후 상단에 배포된 URL이 표시됩니다.
   - 예: `https://[사용자명].github.io/[저장소명]/`

## 📱 모바일 사용
반응형 디자인이 적용되어 있어 스마트폰에서도 쾌적하게 학습할 수 있습니다.
홈 화면에 추가하여 앱처럼 사용해보세요!
