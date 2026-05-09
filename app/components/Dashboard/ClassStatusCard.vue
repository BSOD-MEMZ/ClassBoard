<template>
  <mdui-card class="block class-block">
    <div class="block-title">课程状态</div>
    <div v-if="classState.statusText" class="status">
      {{ classState.statusText }}
    </div>
    <div class="course">{{ classState.courseText }}</div>
    <div v-if="classState.teacherText" class="teacher">
      {{ classState.teacherText }}
    </div>
    <div v-if="classState.showProgress" class="progress-box">
      <mdui-linear-progress :value="classState.progress"></mdui-linear-progress>
      <div class="progress-note">{{ classState.progressNote }}</div>
    </div>
    <div class="today-lessons">
      <div class="tiny-label">今日课程安排</div>
      <mdui-list v-if="todayLessons.length" class="today-lesson-list">
        <mdui-list-item
          v-for="(lesson, idx) in todayLessonsVisible"
          :key="idx"
          @click="$emit('show-lesson-detail', lesson)"
        >
          <div slot="custom" class="today-lesson-item">
            <span>{{ lesson.start }} - {{ lesson.end }}</span>
            <span>{{ lesson.course }}</span>
          </div>
        </mdui-list-item>
      </mdui-list>
      <mdui-button
        v-if="hasMoreTodayLessons"
        variant="text"
        class="lesson-toggle-btn"
        @click="$emit('toggle-lessons')"
      >
        {{ todayLessonsExpanded ? "收起" : "展开全部" }}
      </mdui-button>
      <div v-else-if="!todayLessons.length" class="tip compact-tip">
        今日无课程
      </div>
    </div>
  </mdui-card>
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
  "show-lesson-detail": [lesson: Lesson];
  "toggle-lessons": [];
}>();
</script>

<style scoped>
.status {
  margin-top: 6px;
  font-size: var(--md3-body-medium);
  color: rgb(var(--mdui-color-on-surface-variant));
}

.course {
  margin-top: 10px;
  font-size: clamp(1.5rem, 6.3vw, 2rem);
  line-height: 1.2;
  font-weight: 700;
  color: rgb(var(--mdui-color-primary)) !important;
}

.teacher {
  margin-top: 4px;
  font-size: var(--md3-body-medium);
  color: rgb(var(--mdui-color-on-surface-variant));
}

.progress-box {
  margin-top: 10px;
}

.progress-note {
  margin-top: 6px;
  font-size: var(--md3-label-medium);
  color: rgb(var(--mdui-color-on-surface-variant));
}

.today-lessons {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid
    color-mix(
      in srgb,
      rgb(var(--mdui-color-outline-variant)) 38%,
      transparent 62%
    );
}

.today-lesson-list {
  margin-top: 8px;
  border-radius: 12px;
  background: color-mix(
    in srgb,
    rgb(var(--mdui-color-surface-container-high)) 58%,
    transparent 42%
  );
  overflow: hidden;
}

.today-lesson-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 8px 0;
  line-height: 1.7;
  font-size: var(--md3-body-medium);
  color: rgb(var(--mdui-color-on-surface));
}

.compact-tip {
  margin-top: 6px;
}

.lesson-toggle-btn {
  margin-top: 4px;
}

.tiny-label {
  font-size: var(--md3-label-medium);
  letter-spacing: 0.02em;
  color: rgb(var(--mdui-color-on-surface-variant));
}

.tip {
  margin-top: 8px;
  line-height: 1.45;
  color: rgb(var(--mdui-color-on-surface-variant));
  font-size: var(--md3-body-medium);
}
</style>
