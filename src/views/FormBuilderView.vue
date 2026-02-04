<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const route = useRoute()
const router = useRouter()
const formId = route.params.id

const formTitle = ref('Novo Formulário')
const formDescription = ref('')
const formFields = ref([])
const saving = ref(false)
const publishedUrl = ref('')

const fieldTypes = [
  { value: 'text', label: 'Texto Curto' },
  { value: 'email', label: 'E-mail' },
  { value: 'number', label: 'Número' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'select', label: 'Seleção (Dropdown)' }
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
  alert('Copiado para a área de transferência!')
}

function addField() {
  formFields.value.push({
    id: crypto.randomUUID(),
    type: 'text',
    label: 'Novo Campo',
    placeholder: '',
    required: false,
    options: []
  })
}

function removeField(index) {
  formFields.value.splice(index, 1)
}

function addOption(field) {
  if (!field.options) field.options = []
  field.options.push({ label: 'Opção ' + (field.options.length + 1), value: 'opcao_' + (field.options.length + 1) })
}

function removeOption(field, idx) {
  field.options.splice(idx, 1)
}

async function saveForm() {
  saving.value = true

  let result;

  const payload = {
    title: formTitle.value,
    description: formDescription.value,
    schema: formFields.value
  }

  if (formId) {
    // Update
    result = await supabase
      .from('forms')
      .update(payload)
      .eq('id', formId)
      .select()
      .single()
  } else {
    // Insert
    result = await supabase
      .from('forms')
      .insert(payload)
      .select()
      .single()
  }

  const { data, error } = result

  saving.value = false

  if (error) {
    console.error(error)
    alert('Erro ao salvar formulário')
  } else {
    const url = `${window.location.origin}/form/${data.id}`
    publishedUrl.value = url
    if (!formId) {
      router.push(`/builder/${data.id}`)
    }
  }
}

onMounted(async () => {
  if (formId) {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single()

    if (data) {
      formTitle.value = data.title
      formDescription.value = data.description
      formFields.value = data.schema || []
      // Ensure options array exists
      formFields.value.forEach(f => {
        if (f.type === 'select' && !f.options) f.options = []
      })
      publishedUrl.value = `${window.location.origin}/form/${data.id}`
    }
  }
})
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto pb-10">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Criador de Formulários</h1>
        <p class="text-muted-foreground">Desenhe seu formulário e compartilhe com o mundo.</p>
      </div>
      <div class="flex items-center gap-2">
        <Button v-if="publishedUrl" variant="outline" as="a" :href="publishedUrl" target="_blank"
          class="flex items-center gap-2">
          <ExternalLink class="h-4 w-4" />
          Abrir Formulário
        </Button>
        <Button @click="saveForm" :disabled="saving">
          {{ saving ? 'Salvando...' : 'Publicar Formulário' }}
        </Button>
      </div>
    </div>

    <!-- Form Configuration -->
    <Card>
      <CardHeader>
        <CardTitle>Configurações Gerais</CardTitle>
      </CardHeader>
      <CardContent class="grid gap-4">
        <div class="grid gap-2">
          <Label>Título do Formulário</Label>
          <Input v-model="formTitle" placeholder="Ex: Fale Conosco" />
        </div>
        <div class="grid gap-2">
          <Label>Descrição</Label>
          <Input v-model="formDescription" placeholder="Breve descrição opcional" />
        </div>
      </CardContent>
    </Card>

    <div class="grid gap-6 lg:grid-cols-[1fr_400px]">
      <!-- Editor -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Campos</h2>
          <Button @click="addField" variant="outline" size="sm" class="flex items-center gap-2">
            <Plus class="h-4 w-4" />
            Adicionar Campo
          </Button>
        </div>

        <div class="space-y-4">
          <Card v-for="(field, index) in formFields" :key="field.id" class="relative group">
            <CardContent class="p-4 space-y-4">
              <div class="flex items-center justify-between gap-4">
                <div class="grid gap-1.5 w-full">
                  <Label class="text-xs text-muted-foreground">Rótulo do Campo</Label>
                  <Input v-model="field.label" class="h-8" />
                </div>
                <div class="grid gap-1.5 min-w-[140px]">
                  <Label class="text-xs text-muted-foreground">Tipo</Label>
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

              <div class="grid gap-1.5" v-if="field.type !== 'select'">
                <Label class="text-xs text-muted-foreground">Placeholder (Opcional)</Label>
                <Input v-model="field.placeholder" class="h-8" placeholder="Texto de exemplo..." />
              </div>

              <!-- Options for Select -->
              <div v-if="field.type === 'select'" class="space-y-2 border rounded-md p-3 bg-muted/20">
                <div class="flex items-center justify-between">
                  <Label class="text-xs font-semibold">Opções do Dropdown</Label>
                  <Button @click="addOption(field)" variant="ghost" size="xs" class="h-6 text-xs">
                    <Plus class="h-3 w-3 mr-1" /> Add Opção
                  </Button>
                </div>
                <div v-for="(opt, optIndex) in field.options" :key="optIndex" class="flex items-center gap-2">
                  <Input v-model="opt.label" class="h-7 text-xs flex-1" placeholder="Rótulo" />
                  <Input v-model="opt.value" class="h-7 text-xs flex-1 font-mono text-muted-foreground"
                    placeholder="Valor" />
                  <Button @click="removeOption(field, optIndex)" variant="ghost" size="icon"
                    class="h-7 w-7 text-destructive">
                    <Trash class="h-3 w-3" />
                  </Button>
                </div>
                <div v-if="!field.options || field.options.length === 0"
                  class="text-xs text-muted-foreground text-center py-2">
                  Nenhuma opção adicionada.
                </div>
              </div>

              <div class="flex items-center space-x-2 pt-2">
                <input type="checkbox" :id="`req-${field.id}`" v-model="field.required"
                  class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label :for="`req-${field.id}`" class="text-sm text-muted-foreground select-none cursor-pointer">Campo
                  Obrigatório</label>
              </div>
            </CardContent>
            <Button @click="removeField(index)" variant="ghost" size="icon"
              class="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 shadow-sm">
              <Trash class="h-3 w-3" />
            </Button>
          </Card>

          <div v-if="formFields.length === 0"
            class="text-center py-10 border border-dashed rounded-lg text-muted-foreground">
            Nenhum campo adicionado ainda. Use o botão acima para começar.
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div>
        <div class="sticky top-6">
          <h2 class="text-lg font-semibold mb-4">Pré-visualização</h2>
          <Card class="bg-muted/30">
            <CardHeader>
              <CardTitle>{{ formTitle || 'Sem Título' }}</CardTitle>
              <p class="text-sm text-muted-foreground" v-if="formDescription">{{ formDescription }}</p>
            </CardHeader>
            <CardContent class="space-y-4">
              <div v-for="field in formFields" :key="field.id" class="grid gap-2">
                <Label>
                  {{ field.label }}
                  <span v-if="field.required" class="text-destructive">*</span>
                </Label>

                <template v-if="field.type === 'textarea'">
                  <textarea
                    class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    :placeholder="field.placeholder" disabled />
                </template>
                <template v-else-if="field.type === 'select'">
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </Select>
                </template>
                <template v-else>
                  <Input :type="field.type" :placeholder="field.placeholder" disabled />
                </template>
              </div>
              <Button class="w-full mt-4" disabled>Enviar</Button>
            </CardContent>
          </Card>

          <div v-if="publishedUrl"
            class="mt-6 p-4 border rounded-md bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900">
            <h3 class="font-medium text-green-800 dark:text-green-300 mb-2">Formulário Publicado!</h3>
            <div class="space-y-4">
              <div>
                <Label class="text-xs text-muted-foreground">Link Direto</Label>
                <div class="flex items-center gap-2">
                  <Input readonly :model-value="publishedUrl" class="bg-white dark:bg-black" />
                  <Button variant="outline" size="icon" @click="copyToClipboard(publishedUrl)">
                    <span class="sr-only">Copiar</span>
                    <ExternalLink class="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label class="text-xs text-muted-foreground">Código para Incorporar</Label>
                <div class="relative">
                  <textarea
                    class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    readonly :value="embedCode"></textarea>
                  <Button variant="ghost" size="sm" class="absolute top-2 right-2 h-6 text-xs"
                    @click="copyToClipboard(embedCode)">
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
