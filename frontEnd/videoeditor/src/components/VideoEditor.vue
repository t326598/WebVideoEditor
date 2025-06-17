<template>
  <div>
    <h2>영상 자르기 데모</h2>
    <input type="file" @change="handleFile" accept="video/mp4" />
    <br>
    <video v-if="videoUrl" controls :src="videoUrl" style="max-width: 100%; margin-top: 10px;" />

    <div v-if="videoUrl" style="margin-top: 10px;">
      <p v-if="isLoadingFFmpeg">FFmpeg 로딩 중... 잠시만 기다려 주세요.</p>
      <p v-if="loadError" style="color: red;">FFmpeg 로드 오류: {{ loadError }}</p>
      <label>시작 시간 (초): <input v-model="start" type="number" /></label>
      <label>끝 시간 (초): <input v-model="end" type="number" /></label>
      <button @click="cutVideo" :disabled="isLoadingFFmpeg || loadError || !file">자르기</button>
    </div>

    <div v-if="outputUrl" style="margin-top: 10px;">
      <h3>잘라낸 영상</h3>
      <video controls :src="outputUrl" style="max-width: 100%;" />
      <a :href="outputUrl" download="cut-output.mp4">다운로드</a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpegInstance = null; // 전역 스코프에 선언

const file = ref(null);
const videoUrl = ref(null);
const outputUrl = ref(null);

const start = ref(0);
const end = ref(5);
const isLoadingFFmpeg = ref(true);
const loadError = ref(null);

onMounted(async () => {
  try {
    ffmpegInstance = new FFmpeg({
      log: true,
      baseURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm',
    });

    ffmpegInstance.on('log', ({ message }) => {
      console.log(`[ffmpeg log]: ${message}`);
    });

    await ffmpegInstance.load();
    isLoadingFFmpeg.value = false;
    console.log(ffmpegInstance); // 로드 완료 후 인스턴스 상태 로그
  } catch (err) {
    isLoadingFFmpeg.value = false;
    console.group('❌ FFmpeg 로드 중 에러 상세 정보');
    console.error('원본 에러 객체:', err);
    console.error('에러 이름:', err.name);
    console.error('에러 메시지:', err.message);
    if (err.stack) {
      console.error('에러 스택:', err.stack);
    }
    console.groupEnd();
    loadError.value = err.message || err.name || '알 수 없는 FFmpeg 로드 오류';
    alert(`FFmpeg 로드 실패: ${loadError.value}. 콘솔을 확인해주세요.`);
  }
});

const handleFile = (e) => {
  file.value = e.target.files[0];
  if (file.value) {
    videoUrl.value = URL.createObjectURL(file.value);
    console.log("선택된 비디오 URL:", videoUrl.value);
  } else {
    videoUrl.value = null;
  }
  outputUrl.value = null;
};

const cutVideo = async () => {
  // 버튼 비활성화 상태 확인은 계속 유지
  if (isLoadingFFmpeg.value || loadError.value || !file.value) {
    console.warn('⚠️ 비디오 자르기 버튼 비활성화 조건 충족. 작업 중단.');
    console.warn('isLoadingFFmpeg:', isLoadingFFmpeg.value, 'loadError:', loadError.value, 'file.value:', !!file.value);
    return;
  }

  if (start.value < 0 || end.value <= start.value) {
    alert('유효한 시작 및 종료 시간을 입력해주세요.');
    return;
  }

  try {
    console.log('✂️ 비디오 자르기 시작...');
    console.log(ffmpegInstance);

    // ffmpegInstance가 유효한지 다시 한번 명시적으로 검사
    if (!ffmpegInstance || typeof ffmpegInstance.exec !== 'function') {
      throw new Error('FFmpeg 인스턴스가 올바르게 초기화되지 않았거나 exec 메서드가 없습니다.');
    }

    const fetchedData = await fetchFile(file.value);
    console.log('✅ fetchFile 완료. 반환된 데이터 타입:', fetchedData.constructor.name);
    console.log('반환된 데이터 길이:', fetchedData.byteLength, '바이트');

    await ffmpegInstance.writeFile('input.mp4', fetchedData);
    console.log("✅ input.mp4 파일 FFmpeg 가상 FS에 쓰기 완료.");

    const formatTime = (seconds) => {
      const date = new Date(null);
      date.setSeconds(seconds);
      return date.toISOString().substr(11, 8);
    };

    const startTime = formatTime(start.value);
    const endTime = formatTime(end.value);

    // 🚨🚨🚨 이 부분이 중요합니다: ffmpegArgs 배열 정의 및 console.log 변경, exec 호출 변경
    const ffmpegArgs = [
      '-i', 'input.mp4',
      '-ss', startTime,
      '-to', endTime,
      '-c', 'copy', 
      '-map', '0', // 모든 스트림을 매핑합니다.
      '-c:a', 'copy',
      '-preset', 'veryfast', // 재인코딩 속도 옵션
      'output.mp4' // 출력 파일명은 항상 배열의 마지막 인자로 둡니다.
    ];

    console.log(`➡️ FFmpeg run 명령 실행: ${ffmpegArgs.join(' ')}`); // 실제 전달될 명령을 로그로 출력

    await ffmpegInstance.exec(ffmpegArgs); // 🚨🚨🚨 정의된 배열 (ffmpegArgs)을 전달


    console.log("✅ FFmpeg run 명령 완료 (output.mp4 생성 시도).");

    // 🚨🚨🚨 output.mp4 파일 존재 여부 확인 로직 추가 🚨🚨🚨
    try {
      const filesInMemFS = await ffmpegInstance.listDir('.'); // 현재 디렉토리의 파일 목록을 가져옵니다.
      console.log('FFmpeg 가상 파일 시스템 파일 목록:', filesInMemFS); // 파일 목록을 로그로 출력

      const isOutputMp4Present = filesInMemFS.some(file => file.name === 'output.mp4');

      if (!isOutputMp4Present) {
        // output.mp4가 파일 목록에 없다면, 파일이 생성되지 않은 것입니다.
        console.error('❌ 경고: output.mp4 파일이 FFmpeg 가상 FS에 생성되지 않았습니다. FFmpeg 내부 오류를 확인하세요.');
        throw new Error("FFmpeg 명령은 완료되었으나, output.mp4 파일이 생성되지 않았습니다. FFmpeg 로그를 다시 확인해주세요.");
      } else {
        console.log('✅ output.mp4 파일이 FFmpeg 가상 FS에 존재함을 확인했습니다.');
      }
    } catch (fsError) {
      console.error('FFmpeg 가상 파일 시스템 목록 조회 중 오류:', fsError);
      throw fsError;
    }
    // 🚨🚨🚨 여기까지 수정 🚨🚨🚨

    const data = await ffmpegInstance.readFile('output.mp4'); // 이제 여기가 정상 작동할 것입니다.
    console.log('✅ output.mp4 파일 FFmpeg 가상 FS에서 읽기 완료.');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    outputUrl.value = URL.createObjectURL(blob);

    console.log('✅ 비디오 자르기 완료!');

  } catch (error) {
    console.error('❌ 비디오 자르기 중 에러:', error);
    alert(`비디오 자르기 실패: ${error.message}. 콘솔을 확인해주세요.`);
  }
};
</script>

<style scoped>
input[type="number"] {
  width: 60px;
  margin: 0 10px;
}
</style>