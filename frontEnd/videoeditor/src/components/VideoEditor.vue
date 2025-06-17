<template>
  <div>
    <h2>영상 자르기 데모</h2>
    <input type="file" @change="handleFile" accept="video/mp4" />
    <video v-if="videoUrl" controls :src="videoUrl" style="max-width: 100%; margin-top: 10px;" />
    <br>

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

let ffmpegInstance = null;

const file = ref(null);
const videoUrl = ref(null);
const outputUrl = ref(null);
// const thumbnailUrl = ref(null); // 썸네일 관련 변수 제거
// const thumbnailSecond = 1; // 썸네일 관련 변수 제거

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
    console.log('✅ FFmpeg 로드 완료!');
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
    console.log(videoUrl.value)
  } else {
    videoUrl.value = null;
  }
  outputUrl.value = null;
  // thumbnailUrl.value = null; // 썸네일 관련 변수 초기화 제거
};

const cutVideo = async () => {
  if (isLoadingFFmpeg.value || loadError.value || !file.value) return;

  if (start.value < 0 || end.value <= start.value) {
    alert('유효한 시작 및 종료 시간을 입력해주세요.');
    return;
  }

  try {
    console.log('✂️ 비디오 자르기 시작...');
    await ffmpegInstance.writeFile('input.mp4', await fetchFile(file.value));
    console.log("나옴?")

    const formatTime = (seconds) => {
      const date = new Date(null);
      date.setSeconds(seconds);
      return date.toISOString().substr(11, 8);
    };

    const startTime = formatTime(start.value);
    const endTime = formatTime(end.value);
    await ffmpegInstance.run(
      '-i', 'input.mp4',
      '-ss', startTime,
      '-to', endTime,
      '-c', 'copy',
      'output.mp4'
    );
   console.log("나옴?")
    const data = await ffmpegInstance.readFile('output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    outputUrl.value = URL.createObjectURL(blob);

    // 📸 썸네일 생성 로직 제거
    /*
    const thumbnailTime = formatTime(start.value + thumbnailSecond);
    console.log(`📸 썸네일 추출 위치: ${thumbnailTime}`);

    await ffmpegInstance.run(
      '-i', 'input.mp4',
      '-ss', thumbnailTime,
      '-vframes', '1',
      '-q:v', '2',
      'thumbnail.jpg'
    );

    const thumbData = await ffmpegInstance.readFile('thumbnail.jpg');
    const thumbBlob = new Blob([thumbData.buffer], { type: 'image/jpeg' });
    thumbnailUrl.value = URL.createObjectURL(thumbBlob);
    */

    console.log('✅ 비디오 자르기 완료!'); // 메시지 수정

  } catch (error) {
    console.error('❌ 비디오 자르기 중 에러:', error); // 에러 메시지 수정
    alert(`비디오 자르기 실패: ${error.message}`);
  }
};
</script>

<style scoped>
input[type="number"] {
  width: 60px;
  margin: 0 10px;
}
</style>