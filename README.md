<div>

# WebVideoEditor(Vue3.0 + FFmpeg 0.12)

### Web 기반 영상 편집기 프로젝트입니다.

<img src="https://github.com/user-attachments/assets/2650b9ec-e4f1-46db-9ae2-cdfd2abd2378" alt="영상 편집 데모" style="display:block; margin:0 auto; max-width:80%;" />

<div align="left">

[📝 배포 페이지](https://6852e9535e51ac294c207bee--timely-queijadas-e93381.netlify.app/)

## 📚 **프로젝트 목차**

- 1. 프로젝트 소개  
- 2. 트러블 슈팅  
- 3. 기술 개선점 및 보완점  

---

## ⚙️ 1. **프로젝트 소개**

### 💡 프로젝트 인원
- 1명

### 💡 프로젝트 기간
- 2025-06-16 ~ 진행중

### 💡 기획 의도
영상 편집 경험과 웹 기술을 결합한 솔루션을 만들어보고자, Vue 3.0과 FFmpeg 0.12를 활용해 브라우저에서 실행 가능한 영상 편집 데모를 구현하였습니다.

### 💡 주요기능
- **영상 선택 및 미리보기 기능**

</div>

<img src="https://github.com/user-attachments/assets/81415c1d-8b0e-4808-804b-683aa879f620" alt="미리보기 화면" style="display:block; margin:0 auto; max-width:80%;" />

<br><br><br>
<div align="left">

영상 선택시 미리보기 화면이 등장하며 원하는 부분을 초단위로 나눠서 선택할 수 있습니다.
><br>
</div>

<img src="![bandicam 2025-06-19 01-15-36-443](https://github.com/user-attachments/assets/e9f3ddc3-d25e-4b63-b797-e2f51841a65a)
" alt="영상 구간 선택 및 병합" style="display:block; margin:0 auto; max-width:80%;" />
<br><br><br>
<div align="left">

특정 부분만 나눌수도 있지만 여러구간을 선택해 자르고 병합하여 영상을 만들 수도 있습니다.
<br>
### 💡 사용 기술
- 사용 언어 : HTML5, CSS3, Java, JavaScript  
- 프론트엔드 : Vue.js 3.0, FFmpeg 0.12  
- 개발도구 : Visual Studio Code  
- 협업툴 : GitHub  

---

## 💡 2. 트러블슈팅

</div>

<img src="https://github.com/user-attachments/assets/3852ad9f-702b-4bef-9cdd-ddce9f626b2e" alt="트러블슈팅 1" style="display:block; margin:0 auto; max-width:80%;" />
<br><br>
<div align="left">

기존 import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg' 방식으로는 createFFmpeg를 인식하지 못하는 현상 발생  
0.10 버전에서는 CJS기반 방식으로 createFFmpeg()를 사용할 수 있었지만

</div>

<img src="https://github.com/user-attachments/assets/cb1fdebf-e138-4f5d-a988-f660679aa036" alt="트러블슈팅 2" style="display:block; margin:0 auto; max-width:80%;" />
<br><br>
<div align="left">

0.12버전에서는 ESM기반 브라우저 전용 구조로 변경되어, 기존 방식에서 new FFmpeg()를 사용하는 방식으로 변경됨  
이후에도 FFmpeg 로드하지 못하는 에러 발생 ESM 방식일때는 필요 리소스인 ffmpeg-core, wasm, worker.js들을 가져와야하기에 baseURL 경로 설정이 필수이며 보통 CDN 경로를 사용하는게 일반적입니다.

</div>

<img src="https://github.com/user-attachments/assets/7670a569-e465-4330-b165-9cd4bd3aa04a" alt="트러블슈팅 3" style="display:block; margin:0 auto; max-width:80%;" />
<br><br>
<div align="left">

외부경로에서 가져오는 데이터인 만큼 CORS 설정 이 필요하며 직접 스크립트 파일을 다운받아서 지정해줘도 무방함

</div>

<img src="https://github.com/user-attachments/assets/405107e1-989c-4ab3-a1d3-5f01f40a4d13" alt="트러블슈팅 4" style="display:block; margin:0 auto; max-width:80%;" />
<br><br>
<div align="left">

기존 <code>await ffmpeg.run('-i', 'input.mp4', '-ss', '00:00:02', '-to', '00:00:06', '-c', 'copy', 'output.mp4');</code> 형식에서 파일이 인식되지 않는 에러 발생  
0.12버전에서는 run 형식을 지원하지 않고 exec를 사용해 코드 로드해줘야함

---

## 💡 3. 기술 개선점 및 보완점

- **사용자 경험(UX) 향상을 위한 기능 필요**  
  현재는 시작 시간과 끝나는 시간을 직접 입력해서 구간을 자르지만 구간 자르기 시 타임라인 UI로 시각적 조절 기능이나 진행률 표시 기능이 필요합니다.

- **썸네일 및 자막 기능 추가**  
  canvas를 활용한 자막 및 썸네일 기능 추가할 예정입니다.

- **대용량 영상 처리 성능 개선**  
  Web Worker를 통해 UI 렌더링과 분리가 필요합니다.

- **포맷 다양성 대응**  
  현재 .mp4 위주 테스트이지만 다양한 인코딩 포맷에 대한 처리 분기가 필요합니다.

- **필터 구현**  
  FFmpeg filter graph를 사용해 필터 버튼 구현이 필요합니다.

</div>
