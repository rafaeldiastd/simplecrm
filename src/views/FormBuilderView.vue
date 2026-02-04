<script setup>
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Plus, Trash, ExternalLink } from 'lucide-vue-next'

const formTitle = ref('New Form')
const formDescription = ref('')
const formFields = ref([])
const saving = ref(false)
const publishedUrl = ref('')

const fieldTypes = [
  { value: 'text', label: 'Text Input' },
  { value: 'email', label: 'Email Address' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Long Text' }
]

const embedCode = computed(() => {
  if (!publishedUrl.value) return ''
  try {
    const urlObj = new URL(publishedUrl.value)
    const origin = urlObj.origin
    const id = urlObj.pathname.split('/').pop()
    return `<script src="${origin}/embed.js" data-form-id="${id}" async><\/script>`
  } catch (e) {
    return ''
  }
})

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
}

function addField() {
  formFields.value.push({
    id: crypto.randomUUID(),
    type: 'text',
    label: 'New Field',
    placeholder: ''
  })
}

function removeField(index) {
  formFields.value.splice(index, 1)
}

async function saveForm() {
  saving.value = true
  const { data, error } = await supabase
    .from('forms')
    .insert({
      title: formTitle.value,
      description: formDescription.value,
      schema: formFields.value
    })
    .select()
    .single()

  saving.value = false

  if (error) {
    console.error(error)
    alert('Error saving form')
  } else {
    const url = `${window.location.origin}/form/${data.id}`
    publishedUrl.value = url
  }
}
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto pb-10">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Form Builder</h1>
        <p class="text-muted-foreground">Design your form and share it with the world.</p>
      </div>
      <div class="flex items-center gap-2">
        <Button v-if="publishedUrl" variant="outline" as="a" :href="publishedUrl" target="_blank"
          class="flex items-center gap-2">
          <ExternalLink class="h-4 w-4" />
          Open Form
        </Button>
        <Button @click="saveForm" :disabled="saving">
          {{ saving ? 'Saving...' : 'Publish Form' }}
        </Button>
      </div>
    </div>

    <!-- Form Configuration -->
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent class="grid gap-4">
        <div class="grid gap-2">
          <Label>Form Title</Label>
          <Input v-model="formTitle" placeholder="e.g., Contact Us" />
        </div>
        <div class="grid gap-2">
          <Label>Description</Label>
          <Input v-model="formDescription" placeholder="Optional brief description" />
        </div>
      </CardContent>
    </Card>

    <div class="grid gap-6 md:grid-cols-2">
      <!-- Editor -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Fields</h2>
          <Button @click="addField" variant="outline" size="sm" class="flex items-center gap-2">
            <Plus class="h-4 w-4" />
            Add Field
          </Button>
        </div>

        <div class="space-y-4">
          <Card v-for="(field, index) in formFields" :key="field.id" class="relative group">
            <CardContent class="p-4 space-y-4">
              <div class="flex items-center justify-between">
                <div class="grid gap-1.5 w-full mr-4">
                  <Label class="text-xs text-muted-foreground">Field Label</Label>
                  <Input v-model="field.label" class="h-8" />
                </div>
                <div class="grid gap-1.5 min-w-[120px]">
                  <Label class="text-xs text-muted-foreground">Type</Label>
                  <Select v-model="field.type">
                    <SelectTrigger class="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="t in fieldTypes" :key="t.value" :value="t.value">
                        {{ t.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div class="grid gap-1.5">
                <Label class="text-xs text-muted-foreground">Placeholder (Optional)</Label>
                <Input v-model="field.placeholder" class="h-8" placeholder="Placeholder text..." />
              </div>
            </CardContent>
            <Button @click="removeField(index)" variant="ghost" size="icon"
              class="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 shadow-sm">
              <Trash class="h-3 w-3" />
            </Button>
          </Card>

          <div v-if="formFields.length === 0"
            class="text-center py-10 border border-dashed rounded-lg text-muted-foreground">
            No fields added yet.
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div>
        <h2 class="text-lg font-semibold mb-4">Preview</h2>
        <Card class="bg-muted/30">
          <CardHeader>
            <CardTitle>{{ formTitle || 'Untitled Form' }}</CardTitle>
            <p class="text-sm text-muted-foreground" v-if="formDescription">{{ formDescription }}</p>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-for="field in formFields" :key="field.id" class="grid gap-2">
              <Label>{{ field.label }}</Label>

              <template v-if="field.type === 'textarea'">
                <textarea
                  class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  :placeholder="field.placeholder" disabled />
              </template>
              <template v-else>
                <Input :type="field.type" :placeholder="field.placeholder" disabled />
              </template>
            </div>
            <Button class="w-full mt-4" disabled>Submit</Button>
          </CardContent>
        </Card>

        <div v-if="publishedUrl"
          class="mt-6 p-4 border rounded-md bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900">
          <h3 class="font-medium text-green-800 dark:text-green-300 mb-2">Form Published!</h3>
          <div class="space-y-4">
            <div>
              <Label class="text-xs text-muted-foreground">Direct Link</Label>
              <div class="flex items-center gap-2">
                <Input readonly :model-value="publishedUrl" class="bg-white dark:bg-black" />
                <Button variant="outline" size="icon" @click="copyToClipboard(publishedUrl)">
                  <span class="sr-only">Copy</span>
                  <ExternalLink class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label class="text-xs text-muted-foreground">Embed Code</Label>
              <div class="relative">
                <textarea
                  class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  readonly :value="embedCode"></textarea>
                <Button variant="ghost" size="sm" class="absolute top-2 right-2 h-6 text-xs"
                  @click="copyToClipboard(embedCode)">
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
