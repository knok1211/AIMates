# 🌱 지구 정화 대작전 : 가원 × 햄도리 × 루루의 차원 모험
> **Earth Purification Mission: Co-op Puzzle Action Adventure**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-990000?style=for-the-badge&logo=audio&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=for-the-badge&logo=github&logoColor=white)

---

## 📖 스토리 개요 (Story Arc)

* **[기] 도입부**: 서로 다른 세계에 살던 가원, 햄도리, 루루가 우연히 차원의 문을 넘어 심각하게 오염된 잿빛 행성 '지구'에 떨어진다!
* **[승] 전개**: 원래 세계로 돌아가기 위한 첫 단계로 잿빛 지구의 공장 지대를 정화하기로 결심한다.
* **[전] 절정**: 높은 환기탑을 타는 햄도리, 정면 응시 아이컨택으로 적을 무력화하는 가원, 샬라라 회전으로 꽃을 피우는 루루가 힘을 합쳐 공장 제어실을 돌파한다.
* **[결] 결말**: 맑고 푸른 모습을 되찾은 지구의 옥상 무대에서 가원의 힙한 디제잉 비트에 맞춰 햄도리와 루루가 승리의 댄스 파티를 연다!

---

## 🎮 캐릭터 프로필 & 특수 능력

| 캐릭터 | 역할 | 주 스킬 | 특수 상호작용 및 기믹 |
| :--- | :--- | :--- | :--- |
| **가원 (Gawon 🎧)** | 리더 / 제어 | `[E]` **아이컨택 (Eye Contact)**<br>(10초간 적 무력화) | 15인치 노트북 연결 케이블로 메인 콘솔 & 보안문 제어 |
| **햄도리 (Hamdori 🐹)** | 벽타기 / 유인 | `[E]` **어그로 유인 (Taunt)**<br>(경비원 시선 끌기) | `[↑/방향키]` **벽 매달리기/벽타기**로 공중 환기탑의 정화 배터리 습득 / 멍 때리기 모션 |
| **루루 (Lulu 🌸)** | 정화 / 회복 | `[E]` **샬라라 회전 (Shalala Spin)**<br>(3m 반경 오염 정화) | 독성 폐수 및 매연 배출구를 맑은 은방울꽃밭으로 복구 |

---

## ⌨️ 게임 조작 방법

### 1P 싱글플레이 (스위칭 모드)
* **이동**: <kbd>←</kbd> <kbd>→</kbd> 또는 <kbd>A</kbd> <kbd>D</kbd>
* **점프 / 벽타기**: <kbd>Space</kbd> / <kbd>W</kbd> / <kbd>↑</kbd> (햄도리는 벽에 밀착 후 <kbd>↑</kbd> 로 벽타기)
* **캐릭터 교체**: <kbd>1</kbd> (가원), <kbd>2</kbd> (햄도리), <kbd>3</kbd> (루루)
* **스킬 사용**: <kbd>E</kbd>
* **아이템 사용 / 콘솔 상호작용**: <kbd>R</kbd> 또는 <kbd>F</kbd>

### 2~3인 로컬 협동 (Co-op 모드)
* **가원 (P1)**: <kbd>A</kbd>/<kbd>D</kbd> 이동, <kbd>W</kbd> 점프, <kbd>F</kbd> 아이컨택
* **햄도리 (P2)**: <kbd>←</kbd>/<kbd>→</kbd> 이동, <kbd>↑</kbd> 점프/벽타기, <kbd>L</kbd> 어그로 유인
* **루루 (P3)**: <kbd>J</kbd>/<kbd>L</kbd> 이동, <kbd>I</kbd> 점프, <kbd>K</kbd> 샬라라 회전

---

## 🚀 GitHub Pages에 무료 출시(배포)하는 방법

이 게임은 별도의 서버 설치 없이 **GitHub Pages**를 통해 웹상에 즉시 무료 출시할 수 있습니다!

### Step 1. GitHub 리포지토리 생성
1. [GitHub](https://github.com/)에 로그인 후 우측 상단의 **[New Repository]** 버튼을 누릅니다.
2. Repository Name에 `earth-purification-game` (또는 원하는 이름)을 입력하고 **Public**을 선택한 뒤 **Create repository**를 누릅니다.

### Step 2. 로컬 코드 업로드 (Push)
터미널(또는 Git Bash / Command Prompt)을 열고 현재 프로젝트 폴더 위치에서 아래 명령어를 실행합니다:

```bash
# Git 초기화 및 파일 추가
git init
git add .
git commit -m "Initial release of Earth Purification Game"

# Main 브랜치 지정 및 원격 리포지토리 연결 (사용자 이름과 리포지토리명 변경)
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/earth-purification-game.git

# GitHub로 푸시
git push -u origin main
```

### Step 3. GitHub Pages 활성화
1. 생성한 GitHub 리포지토리 페이지 상단의 **[Settings]** 탭을 클릭합니다.
2. 좌측 메뉴에서 **[Pages]** 탭을 클릭합니다.
3. **Build and deployment** 항목의 **Source**에서 `Deploy from a branch`를 선택합니다.
4. **Branch** 드롭다운에서 `main` 브랜치를 선택하고 `/ (root)` 설정 후 **[Save]**를 누릅니다.

### Step 4. 게임 접속하기 🎉
약 1~2분 후, 주소창에 아래 URL을 입력하면 웹 브라우저 및 모바일에서 바로 플레이하실 수 있습니다!
> **https://`<YOUR_GITHUB_USERNAME>`.github.io/earth-purification-game/**

---

## 📁 프로젝트 파일 구조

```
├── index.html          # 메인 HTML5 레이아웃 및 HUD, 모달 컷씬 오버레이
├── style.css           # Modern Dark Glassmorphic CSS 스타일시트
├── Assets/             # 캐릭터 에셋 이미지 (가원.png, 햄도리.png, 루루.png)
├── js/
│   ├── audio.js        # Web Audio API 사운드 및 BGM 합성 엔진
│   ├── entities.js     # 가원, 햄도리, 루루, 경비원/보스, 정화 타일맵
│   ├── renderer.js     # HTML5 Canvas 2D 렌더러 & 디제잉 비주얼라이저
│   └── game.js         # 게임 메인 루프, 스테이지 전환 및 입력 컨트롤러
├── .gitignore          # Git 불필요 파일 제외 설정
└── README.md           # 프로젝트 안내서 및 GitHub 배포 가이드
```

---

## 📜 라이선스 (License)

This project is licensed under the MIT License.
