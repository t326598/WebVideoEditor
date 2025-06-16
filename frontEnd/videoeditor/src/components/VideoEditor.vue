<template>
  <div>
    <h2>영상 자르기 데모</h2>
    <input type="file" @change="handleFile" accept="video/mp4" />
    <video v-if="videoUrl" controls :src="videoUrl" style="max-width: 100%; margin-top: 10px;" />

    <div v-if="videoUrl" style="margin-top: 10px;">
      <label>시작 시간 (초): <input v-model="start" type="number" /></label>
      <label>끝 시간 (초): <input v-model="end" type="number" /></label>
      <button @click="cutVideo">자르기</button>
    </div>

    <div v-if="outputUrl" style="margin-top: 10px;">
      <h3>잘라낸 영상</h3>
      <video controls :src="outputUrl" style="max-width: 100%;" />
      <a :href="outputUrl" download="cut-output.mp4">다운로드</a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'; // onMounted 훅을 추가합니다.
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

console.log("나옴?");
console.log(fetchFile);
console.log(FFmpeg);

// createFFmpeg 대신 FFmpeg 클래스를 사용하여 인스턴스를 생성합니다.
// 초기에는 null로 설정하고, onMounted 훅에서 로드합니다.
const ffmpeg = ref(null);

const file = ref(null);
const videoUrl = ref(null);
const outputUrl = ref(null);
const start = ref(0);
const end = ref(5);

// 컴포넌트가 마운트될 때 FFmpeg 인스턴스를 초기화하고 로드합니다.
onMounted(async () => {
  ffmpeg.value = new FFmpeg({ log: true });
  // FFmpeg 코어 로드 전에 로드 상태를 확인하는 것은 불필요하며 오류를 발생시킬 수 있습니다.
  // 바로 load()를 호출하여 코어를 로드합니다.
  await ffmpeg.value.load();
  console.log('FFmpeg 로드 완료!');
});

const handleFile = (e) => {
  file.value = e.target.files[0];
  videoUrl.value = URL.createObjectURL(file.value);
};

const cutVideo = async () => {
  // ffmpeg 인스턴스가 로드되었는지 확인합니다.
  if (!ffmpeg.value || !ffmpeg.value.loaded) { // loaded 속성을 사용해 로드 여부 확인
    console.error('FFmpeg이 아직 로드되지 않았습니다!');
    alert('FFmpeg을 로드 중입니다. 잠시 후 다시 시도해주세요.');
    return;
  }

  // 파일 시스템에 비디오 파일을 씁니다.
  await ffmpeg.value.writeFile('input.mp4', await fetchFile(file.value));

  // FFmpeg 명령에 사용할 시작 및 종료 시간을 포맷합니다.
  // 초 단위 입력이므로 HH:MM:SS 형식으로 변환합니다.
  const formatTime = (seconds) => {
    const s = String(Math.floor(seconds % 60)).padStart(2, '0');
    const m = String(Math.floor((seconds / 60) % 60)).padStart(2, '0');
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const startTime = formatTime(start.value);
  const endTime = formatTime(end.value);

  // FFmpeg 명령 실행
  await ffmpeg.value.run(
    '-i', 'input.mp4',
    '-ss', startTime,
    '-to', endTime,
    '-c', 'copy', // 비디오 스트림을 복사하여 재인코딩 없이 빠르게 자릅니다.
    'output.mp4'
  );

  // 잘라낸 비디오 파일을 읽어와서 Blob으로 변환합니다.
  const data = await ffmpeg.value.readFile('output.mp4');
  const blob = new Blob([data.buffer], { type: 'video/mp4' });
  outputUrl.value = URL.createObjectURL(blob);
};
</script>

<style scoped>
input[type="number"] {
  width: 60px;
  margin: 0 10px;
}
</style>