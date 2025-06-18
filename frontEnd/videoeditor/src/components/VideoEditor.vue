<template>
  <div>
    <h2>영상 자르기 데모</h2>
    <input type="file" @change="handleFile" accept="video/mp4" />
    <br />
    <video v-if="videoUrl" controls :src="videoUrl" style="max-width: 100%; margin-top: 10px;" />

    <div v-if="videoUrl" style="margin-top: 10px;">
      <label>시작 시간 (초): <input v-model.number="start" type="number" /></label>
      <label>끝 시간 (초): <input v-model.number="end" type="number" /></label>
      <button @click="cutVideo" :disabled="isLoadingFFmpeg || !file">자르기</button>
      <button @click="addSegment" :disabled="start >= end">➕ 구간 추가</button>
      <p v-if="isLoadingFFmpeg">🔄 FFmpeg 로딩 중...</p>
      <p v-if="loadError" style="color:red;">🚨 로딩 오류: {{ loadError }}</p>
    </div>

    <div v-if="segments.length" style="margin-top: 10px;">
      <h3>선택된 구간</h3>
      <ul>
        <li v-for="(seg, i) in segments" :key="i">
          {{ seg.start }}s ~ {{ seg.end }}s
          <button @click="removeSegment(i)">❌ 삭제</button>
        </li>
      </ul>
      <button @click="cutMultipleSegments" :disabled="isLoadingFFmpeg || !file">✂️ 여러 구간 자르기 및 병합</button>
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

const file = ref(null);
const videoUrl = ref(null);
const outputUrl = ref(null);

const start = ref(0);
const end = ref(5);
const segments = ref([]);

const isLoadingFFmpeg = ref(true);
const loadError = ref('');

let ffmpegInstance;

onMounted(async () => {
  try {
    ffmpegInstance = new FFmpeg({
      log: true,
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js',
    });

    ffmpegInstance.on('log', ({ message }) => {
      console.log('[ffmpeg log]', message);
    });

    await ffmpegInstance.load();
    isLoadingFFmpeg.value = false;
    console.log('✅ FFmpeg 로딩 완료');
  } catch (err) {
    loadError.value = err.message || '로딩 오류';
    isLoadingFFmpeg.value = false;
    console.error('❌ FFmpeg 로딩 실패:', err);
  }
});

const handleFile = (e) => {
  file.value = e.target.files[0];
  if (file.value) {
    videoUrl.value = URL.createObjectURL(file.value);
    outputUrl.value = null;
    segments.value = [];
  }
};

const formatTime = (seconds) => {
  const date = new Date(null);
  date.setSeconds(seconds);
  return date.toISOString().substr(11, 8);
};

const cutVideo = async () => {
  if (!ffmpegInstance || !file.value) return;

  try {
    const inputData = await fetchFile(file.value);
    await ffmpegInstance.writeFile('input.mp4', inputData);

    const args = [
      '-i', 'input.mp4',
      '-ss', formatTime(start.value),
      '-to', formatTime(end.value),
      '-c', 'copy',
      'output.mp4',
    ];

    console.log('⚙️ FFmpeg 실행:', args.join(' '));
    await ffmpegInstance.exec(args);

    const data = await ffmpegInstance.readFile('output.mp4');
    const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
    outputUrl.value = URL.createObjectURL(videoBlob);

    console.log('✅ 단일 구간 잘라내기 완료!');
  } catch (err) {
    console.error('❌ 자르기 실패:', err);
    alert('영상 자르기에 실패했습니다. 콘솔 확인');
  }
};

const addSegment = () => {
  if (start.value < end.value) {
    segments.value.push({ start: start.value, end: end.value });
    start.value = 0;
    end.value = 5;
  }
};

const removeSegment = (index) => {
  segments.value.splice(index, 1);
};

const cutMultipleSegments = async () => {
  if (!ffmpegInstance || !file.value || segments.value.length === 0) return;

  try {
    const inputData = await fetchFile(file.value);
    await ffmpegInstance.writeFile('input.mp4', inputData);

    const segmentFiles = [];
    for (let i = 0; i < segments.value.length; i++) {
      const seg = segments.value[i];
      const outName = `cut_${i}.mp4`;

      await ffmpegInstance.exec([
        '-i', 'input.mp4',
        '-ss', formatTime(seg.start),
        '-to', formatTime(seg.end),
        '-c', 'copy',
        outName,
      ]);

      segmentFiles.push(outName);
    }

    const listText = segmentFiles.map(f => `file '${f}'`).join('\n');
    await ffmpegInstance.writeFile('list.txt', listText);

    await ffmpegInstance.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'list.txt',
      '-c', 'copy',
      'output.mp4'
    ]);

    const finalData = await ffmpegInstance.readFile('output.mp4');
    const videoBlob = new Blob([finalData.buffer], { type: 'video/mp4' });
    outputUrl.value = URL.createObjectURL(videoBlob);

    console.log('✅ 여러 구간 자르기 및 병합 완료!');
  } catch (err) {
    console.error('❌ 병합 실패:', err);
    alert('여러 구간 자르기에 실패했습니다. 콘솔 확인');
  }
};
</script>

<style scoped>
input[type="number"] {
  width: 60px;
  margin: 0 10px;
}
</style>
