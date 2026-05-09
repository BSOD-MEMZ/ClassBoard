<template>
  <mdui-card class="block settings-block">
    <div class="block-title">班牌与课表</div>
    <div class="form-grid">
      <mdui-text-field
        label="学校名称"
        :value="modelValue.schoolName"
        @input="
          $emit('update:modelValue', {
            ...modelValue,
            schoolName: $event.target.value,
          })
        "
      ></mdui-text-field>
      <mdui-text-field
        label="教室名称"
        :value="modelValue.classroomName"
        @input="
          $emit('update:modelValue', {
            ...modelValue,
            classroomName: $event.target.value,
          })
        "
      ></mdui-text-field>

      <div class="section-label">CSES 课表 (YAML)</div>
      <div class="cses-actions">
        <mdui-button variant="outlined" @click="triggerFileUpload">
          <mdui-icon slot="icon" name="file_upload"></mdui-icon>
          上传文件
        </mdui-button>
        <mdui-button variant="outlined" @click="editDialogOpen = true">
          <mdui-icon slot="icon" name="edit"></mdui-icon>
          手动编辑
        </mdui-button>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        accept=".yaml,.yml,.json,.txt"
        style="display: none"
        @change="onFileSelected"
      />
      <div v-if="parseResult" class="cses-preview">
        <mdui-icon
          :name="previewOk ? 'check_circle' : 'error'"
          class="preview-icon"
          :class="{ 'preview-icon--error': !previewOk }"
        ></mdui-icon>
        <span class="preview-text" :class="{ 'preview-text--error': !previewOk }">{{ previewLabel }}</span>
      </div>
    </div>

    <!-- 手动编辑对话框 -->
    <mdui-dialog
      :open="editDialogOpen"
      @close="editDialogOpen = false"
      close-on-overlay-click
      close-on-esc
    >
      <div class="dialog-title">编辑 CSES YAML</div>
      <div class="dialog-body">
        <mdui-text-field
          class="json-field"
          textarea
          autosize
          rows="16"
          placeholder="粘贴 CSES YAML 内容"
          :value="modelValue.csesRaw"
          @input="
            $emit('update:modelValue', {
              ...modelValue,
              csesRaw: $event.target.value,
            })
          "
        ></mdui-text-field>
      </div>
      <mdui-button slot="action" variant="text" @click="editDialogOpen = false"
        >完成</mdui-button
      >
    </mdui-dialog>
  </mdui-card>
</template>

<script setup lang="ts">
import { parseCsesLessons } from "@/utils/schedule";

interface BasicDraft {
  schoolName: string;
  classroomName: string;
  csesRaw: string;
}
const props = defineProps<{ modelValue: BasicDraft }>();
const emit = defineEmits<{ "update:modelValue": [value: BasicDraft] }>();

const editDialogOpen = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const parseResult = computed(() => {
  if (!props.modelValue.csesRaw) return null;
  return parseCsesLessons(props.modelValue.csesRaw, "yaml");
});

const previewLabel = computed(() => {
  if (!parseResult.value) return "";
  if (!parseResult.value.ok) return parseResult.value.error || "解析失败";
  if (parseResult.value.warning) return parseResult.value.warning;
  return `已加载 ${parseResult.value.lessons.length} 节课`;
});

const previewOk = computed(() => {
  if (!parseResult.value) return false;
  return parseResult.value.ok && !parseResult.value.warning;
});

function triggerFileUpload() {
  fileInputRef.value?.click();
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = String(e.target?.result ?? "");
    emit("update:modelValue", {
      ...props.modelValue,
      csesRaw: content,
    });
  };
  reader.readAsText(file);
  input.value = "";
}
</script>

<style scoped>
.form-grid {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.section-label {
  font-size: var(--md3-label-large);
  color: rgb(var(--mdui-color-on-surface-variant));
  margin-top: 4px;
}

.cses-actions {
  display: flex;
  gap: 10px;
}

.cses-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  background: color-mix(
    in srgb,
    rgb(var(--mdui-color-primary)) 12%,
    transparent
  );
}

.preview-icon {
  color: rgb(var(--mdui-color-primary));
  font-size: 20px;
}

.preview-icon--error {
  color: rgb(var(--mdui-color-error));
}

.preview-text {
  font-size: var(--md3-body-small);
  color: rgb(var(--mdui-color-primary));
}

.preview-text--error {
  color: rgb(var(--mdui-color-error));
}

.dialog-title {
  font-size: var(--md3-title-medium);
  font-weight: 500;
  color: rgb(var(--mdui-color-on-surface));
  margin-bottom: 12px;
}

.dialog-body {
  min-width: 420px;
}

.json-field {
  --mdui-shape-corner-extra-small: 14px;
}
</style>
