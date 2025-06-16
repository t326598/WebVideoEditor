import { createRouter, createWebHistory } from 'vue-router'
import VideoEditor from '../components/VideoEditor.vue'

const routes = [
  { path: '/', name: 'VideoEditor', component: VideoEditor }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
