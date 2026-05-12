<template>
  <m3e-card class="block settings-block" variant="outlined">
    <div slot="header" class="block-title">班牌与课表</div>
    <div slot="content" class="form-grid">
      <m3e-form-field>
        <label slot="label" for="school-name">学校名称</label>
        <input
          id="school-name"
          class="text-input"
          :value="modelValue.schoolName"
          @input="
            $emit('update:modelValue', {
              ...modelValue,
              schoolName: ($event.target as HTMLInputElement).value,
            })
          "
        />
      </m3e-form-field>
      <m3e-form-field>
        <label slot="label" for="classroom-name">教室名称</label>
        <input
          id="classroom-name"
          class="text-input"
          :value="modelValue.classroomName"
          @input="
            $emit('update:modelValue', {
              ...modelValue,
              classroomName: ($event.target as HTMLInputElement).value,
            })
          "
        />
      </m3e-form-field>

      <div class="section-label">CSES 课表 (YAML)</div>
      <div class="cses-actions">
        <m3e-button variant="outlined" @click="triggerFileUpload">
          <Icon slot="icon" name="material-symbols:upload-file" />
          上传文件
        </m3e-button>
        <m3e-button variant="outlined" @click="editDialogOpen = true">
          <Icon slot="icon" name="material-symbols:edit" />
          手动编辑
        </m3e-button>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        accept=".yaml,.yml,.json,.txt"
        style="display: none"
        @change="onFileSelected"
      />
      <div v-if="parseResult" class="cses-preview">
        <Icon
          :name="`material-symbols:${previewOk ? 'check-circle' : 'error'}`"
          class="preview-icon"
          :class="{ 'preview-icon--error': !previewOk }"
        />
        <span
          class="preview-text"
          :class="{ 'preview-text--error': !previewOk }"
          >{{ previewLabel }}</span
        >
      </div>
    </div>
  </m3e-card>

  <!-- 手动编辑对话框 -->
  <m3e-dialog
    :open="editDialogOpen"
    dismissible
    @closed="editDialogOpen = false"
  >
    <span slot="header">编辑 CSES YAML</span>
    <div class="dialog-body">
      <m3e-form-field class="json-field">
        <textarea
          class="text-area"
          rows="16"
          placeholder="粘贴 CSES YAML 内容"
          :value="modelValue.csesRaw"
          @input="
            $emit('update:modelValue', {
              ...modelValue,
              csesRaw: ($event.target as HTMLTextAreaElement).value,
            })
          "
        ></textarea>
      </m3e-form-field>
    </div>
    <div slot="actions" end>
      <m3e-button variant="text" @click="editDialogOpen = false"
        >完成</m3e-button
      >
    </div>
  </m3e-dialog>
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
  return `成功解析课表`;
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
  color: var(--md-sys-color-on-surface-variant);
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
  background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
}

.preview-icon {
  color: var(--md-sys-color-primary);
  font-size: 20px;
}

.preview-icon--error {
  color: var(--md-sys-color-error);
}

.preview-text {
  font-size: var(--md3-body-small);
  color: var(--md-sys-color-primary);
}

.preview-text--error {
  color: var(--md-sys-color-error);
}

.dialog-body {
  min-width: 420px;
}

.text-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--md-sys-color-on-surface);
  font: inherit;
  padding: 4px 0;
}

.text-area {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--md-sys-color-on-surface);
  font: inherit;
  resize: vertical;
  padding: 8px 0;
}

.json-field {
  --m3e-form-field-container-shape: 14px;
}
</style>
