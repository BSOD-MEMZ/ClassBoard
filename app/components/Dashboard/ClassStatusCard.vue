<template>
  <m3e-card class="block class-block" variant="outlined">
    <div slot="header" class="block-title">课程状态</div>
    <div slot="content">
      <div v-if="classState.statusText" class="status">
        {{ classState.statusText }}
      </div>
      <div class="course">{{ classState.courseText }}</div>
      <div v-if="classState.teacherText" class="teacher">
        {{ classState.teacherText }}
      </div>
      <div v-if="classState.showProgress" class="progress-box">
        <m3e-linear-progress-indicator
          :variant="classState.progressNote.includes('即将上课') ? 'wavy' : 'flat'"
          :value="classState.progress * 100"
        ></m3e-linear-progress-indicator>
        <div class="progress-note">{{ classState.progressNote }}</div>
      </div>
      <m3e-card class="today-lessons">
        <div slot="header" class="tiny-label">今日课程安排</div>
        <m3e-list slot="content" variant="segmented" v-if="todayLessons.length" class="today-lesson-list">
          <m3e-list-item v-for="(lesson, idx) in todayLessonsVisible" :key="idx">
            <div class="today-lesson-item">
              <span>{{ lesson.start }} - {{ lesson.end }}</span>
              <span>{{ lesson.course }}</span>
            </div>
          </m3e-list-item>
        </m3e-list>
        <div v-else-if="!todayLessons.length" class="tip compact-tip">今日无课程</div>
        <div slot="actions" class="lesson-toggle-btn">
          <m3e-button v-if="hasMoreTodayLessons" variant="text" toggle @click="$emit('toggle-lessons')">
            <Icon
              slot="icon"
              :name="todayLessonsExpanded ? 'material-symbols:unfold-less' : 'material-symbols:unfold-more'"
            />
            {{ todayLessonsExpanded ? "收起" : "展开" }}
          </m3e-button>
        </div>
      </m3e-card>
    </div>
    <div slot="actions" end></div>
  </m3e-card>
</template>

<script setup lang="ts">
import type { ClassState, Lesson } from "@/types/schedule";

defineProps<{
  classState: ClassState;
  todayLessons: Lesson[];
  todayLessonsVisible: Lesson[];
  hasMoreTodayLessons: boolean;
  todayLessonsExpanded: boolean;
}>();

defineEmits<{
  "toggle-lessons": [];
}>();
</script>

<style scoped>
.status {
  margin-top: 6px;
  font-size: var(--md3-body-medium);
  color: var(--md-sys-color-on-surface-variant);
}

.course {
  margin-top: 10px;
  font-size: clamp(1.5rem, 6.3vw, 2rem);
  line-height: 1.2;
  font-weight: 700;
  color: var(--md-sys-color-primary) !important;
}

.teacher {
  margin-top: 4px;
  font-size: var(--md3-body-medium);
  color: var(--md-sys-color-on-surface-variant);
}

.progress-box {
  margin-top: 10px;
}

.progress-note {
  margin-top: 6px;
  font-size: var(--md3-label-medium);
  color: var(--md-sys-color-on-surface-variant);
}

.today-lessons {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 38%, transparent 62%);
}

.today-lesson-list {
  margin-top: 8px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--md-sys-color-surface-container-high) 58%, transparent 42%);
  overflow: hidden;
}

.today-lesson-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: var(--md3-body-medium);
  color: var(--md-sys-color-on-surface);
}

.compact-tip {
  margin-top: 6px;
}

.lesson-toggle-btn {
  display: flex;
  justify-content: flex-end;
}

.tip {
  margin-top: 8px;
  line-height: 1.45;
  color: rgb(var(--mdui-color-on-surface-variant));
  font-size: var(--md3-body-medium);
}
</style>
